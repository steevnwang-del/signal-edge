// Vercel Cron Job: 每天 UTC 22:00（台灣早上 6 點）自動執行
// 功能：1. 抓今日賽事 2. AI Provider 分析 3. 存 Firestore
// 注意：目前仍使用 Firebase Client SDK 寫入；正式上線建議改 Firebase Admin SDK。

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import aiProvider from '../../lib/sources/aiProvider.js';

const initFirebase = () => {
  if (getApps().length > 0) return getApps()[0];
  const cfg = {
    apiKey:            process.env.VITE_FIREBASE_API_KEY,
    authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.VITE_FIREBASE_APP_ID,
  };
  if (!cfg.apiKey || !cfg.projectId) throw new Error('Firebase Web config missing. 請設定 VITE_FIREBASE_* 後重新部署。');
  return initializeApp(cfg);
};

const SPORT_MAP = {
  'soccer_world_cup':'世界杯','soccer_fifa_world_cup':'世界杯',
  'basketball_nba':'NBA','baseball_mlb':'MLB',
  'icehockey_nhl':'NHL','mma_mixed_martial_arts':'UFC',
};

const noVig = (h,d,a) => {
  const arr=[h,d,a].filter(Boolean);
  const imp=arr.map(o=>1/o);
  const tot=imp.reduce((s,p)=>s+p,0);
  return { h:+(imp[0]/tot*100).toFixed(1), d:d?+(imp[1]/tot*100).toFixed(1):0, a:+(imp[d?2:1]/tot*100).toFixed(1) };
};

const getAIAnalysis = async (prompt) => {
  try {
    const result = await aiProvider.analyze({ prompt, type: 'match' }, process.env);
    return result?.analysis || null;
  } catch (e) {
    console.warn('[Cron] aiProvider failed:', e.message);
    return null;
  }
};

const isAuthorized = (req) => {
  // Vercel Cron 正式驗證
  if (process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`) return true;
  // 後台手動觸發。注意：這不是正式安全驗證；後續應改 Firebase ID token admin 驗證。
  if (req.method === 'POST' && req.headers['x-admin-trigger']) return true;
  // 本地開發環境放行
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
};

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ success:false, error:'Unauthorized' });
  if (!process.env.ODDS_API_KEY) return res.status(500).json({ success:false, error:'ODDS_API_KEY 未設定' });

  const results = [];

  try {
    const oddsR = await fetch(
      `https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}&daysFrom=1`
    );
    const oddsD = await oddsR.json();
    if (!oddsR.ok) throw new Error(oddsD?.message || oddsD?.error || `The Odds API HTTP ${oddsR.status}`);

    const events = (Array.isArray(oddsD) ? oddsD : [])
      .filter(ev => SPORT_MAP[ev.sport_key])
      .slice(0, 8);

    let db = null;
    try {
      db = getFirestore(initFirebase());
      await setDoc(doc(db, 'cache', 'odds'), { events: oddsD, updatedAt: new Date() });
    } catch (e) {
      console.warn('[Cron] Cache odds failed:', e.message);
    }

    for (const ev of events) {
      try {
        const sport = SPORT_MAP[ev.sport_key];
        const bm = ev.bookmakers?.[0];
        const h2h = bm?.markets?.find(m => m.key === 'h2h');
        const oc = h2h?.outcomes || [];
        const hO = oc.find(o=>o.name===ev.home_team)?.price || 2;
        const aO = oc.find(o=>o.name===ev.away_team)?.price || 2;
        const dO = oc.find(o=>o.name==='Draw')?.price;
        const nv = noVig(hO, dO, aO);

        // 目前這裡仍是市場去水視角，不是真正模型 EV。
        // 真正 EV 應改為：modelProbability * marketOdds - 1。
        const marketValuePct = +((nv.h/100*hO-1)*100).toFixed(1);
        const decision = marketValuePct>4?'BET':marketValuePct>2?'LEAN':'WAIT';

        const prompt = `你是 SignalEdge 的運動數據分析師。

根據以下 DATA_BLOCK 生成賽前分析。嚴格使用數據，不得自行創造數字。
不使用「穩」「必中」「保證」「鎖單」。150字繁體中文。

DATA_BLOCK:
賽事：${ev.home_team} vs ${ev.away_team}（${sport}）
市場去水：主 ${nv.h}%${dO?` 平 ${nv.d}%`:''} 客 ${nv.a}%
賠率：主 ${hO.toFixed(2)}${dO?` 平 ${dO.toFixed(2)}`:''} 客 ${aO.toFixed(2)}
市場價值指標：${marketValuePct}%  決策：${decision}

請輸出：市場共識 + 主要風險 + 開賽前確認事項。`;

        const analysis = await getAIAnalysis(prompt);

        if (db) {
          await addDoc(collection(db, 'analyses'), {
            sport,
            status: 'pending',
            accessLevel: 'free',
            home: ev.home_team,
            away: ev.away_team,
            homeEn: ev.home_team,
            awayEn: ev.away_team,
            marketHome: nv.h,
            marketDraw: nv.d,
            marketAway: nv.a,
            modelHome: nv.h,
            modelDraw: nv.d,
            modelAway: nv.a,
            odds: { h: hO, d: dO || null, a: aO },
            ev: marketValuePct,
            evType: 'market_no_vig_placeholder',
            edge: 0,
            decision,
            dataCompleteness: 0.78,
            analysis: analysis || `市場去水：主 ${nv.h}% 客 ${nv.a}%。目前為市場價值初步指標 ${marketValuePct}%，${decision}。`,
            createdAt: serverTimestamp(),
            autoGenerated: true,
            provider: analysis ? 'aiProvider' : 'fallback_text',
          });
        }

        results.push({ match: `${ev.home_team} vs ${ev.away_team}`, status: 'ok' });
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        results.push({ match: ev.id || `${ev.home_team} vs ${ev.away_team}`, status: 'error', error: e.message });
      }
    }
  } catch (e) {
    return res.status(500).json({ success:false, error: e.message, results });
  }

  const failed = results.filter(r=>r.status==='error').length;
  res.json({ success: true, generated: results.length - failed, failed, results, time: new Date().toISOString() });
}
