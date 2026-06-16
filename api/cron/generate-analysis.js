// Vercel Cron / Admin manual trigger
// 1) 抓 The Odds API upcoming odds
// 2) 由 aiProvider 產生較完整的 SignalEdge 分析
// 3) 優先用 Firebase Admin SDK 寫入 Firestore，避免被 Rules 擋住

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import aiProvider from '../../lib/sources/aiProvider.js';
import { getAdminDB, adminTimestamp } from '../../lib/server/firebaseAdmin.js';

const SPORT_MAP = {
  soccer_world_cup: '世界杯',
  soccer_fifa_world_cup: '世界杯',
  baseball_mlb: 'MLB',
  basketball_nba: 'NBA',
  icehockey_nhl: 'NHL',
  mma_mixed_martial_arts: 'UFC',
  soccer_epl: '英超',
  soccer_uefa_champs_league: '歐冠',
  soccer_spain_la_liga: '西甲',
};

const initClientFirebase = () => {
  if (getApps().length > 0) return getApps()[0];
  const cfg = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };
  if (!cfg.apiKey || !cfg.projectId) throw new Error('Firebase Web config missing');
  return initializeApp(cfg);
};

const getWritableDB = () => {
  const adminDb = getAdminDB(process.env);
  if (adminDb) return { type: 'admin', db: adminDb };
  try {
    return { type: 'client', db: getFirestore(initClientFirebase()) };
  } catch (e) {
    console.warn('[Cron] Firestore init failed:', e.message);
    return { type: 'none', db: null };
  }
};


const readSiteSettings = async (ctx) => {
  try {
    if (!ctx?.db) return {};
    if (ctx.type === 'admin') {
      const snap = await ctx.db.collection('settings').doc('site').get();
      return snap.exists ? snap.data() : {};
    }
    return {};
  } catch (e) { console.warn('[Cron] read settings skipped:', e.message); return {}; }
};

const fillTemplate = (template = '', vars = {}) => {
  let out = String(template || '');
  Object.entries(vars).forEach(([k, v]) => { out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v ?? 'N/A'); });
  return out;
};

const writeDoc = async (ctx, collectionName, data) => {
  if (!ctx?.db) return null;
  if (ctx.type === 'admin') {
    const ref = await ctx.db.collection(collectionName).add({ ...data, createdAt: adminTimestamp() });
    return ref.id;
  }
  const ref = await addDoc(collection(ctx.db, collectionName), { ...data, createdAt: serverTimestamp() });
  return ref.id;
};

const writeCache = async (ctx, id, data) => {
  if (!ctx?.db) return;
  if (ctx.type === 'admin') {
    await ctx.db.collection('cache').doc(id).set({ ...data, updatedAt: adminTimestamp() }, { merge: true });
    return;
  }
  await setDoc(doc(ctx.db, 'cache', id), { ...data, updatedAt: new Date() }, { merge: true });
};

const noVig = (h, d, a) => {
  const arr = [h, d, a].filter(Boolean).map(Number).filter(v => v > 1);
  if (arr.length < 2) return { h: 50, d: 0, a: 50, overround: 0 };
  const imp = arr.map(o => 1 / o);
  const total = imp.reduce((s, p) => s + p, 0);
  return {
    h: +(imp[0] / total * 100).toFixed(1),
    d: d ? +(imp[1] / total * 100).toFixed(1) : 0,
    a: +(imp[d ? 2 : 1] / total * 100).toFixed(1),
    overround: +((total - 1) * 100).toFixed(2),
  };
};

const calcDisplayModel = (nv, sport, homeOdds) => {
  // 目前還沒有真正 Poisson/Elo，先用「市場去水 + 保守修正」當展示用模型。
  // 不把它稱為真 EV，避免誤導。
  const modelHome = Math.max(3, Math.min(94, +(nv.h + (sport === '世界杯' ? 1.5 : 0.7)).toFixed(1)));
  const modelAway = Math.max(3, Math.min(94, +(100 - modelHome - (nv.d || 0)).toFixed(1)));
  const displayEdge = +(modelHome - nv.h).toFixed(1);
  const displayEv = +((modelHome / 100) * homeOdds - 1).toFixed(1);
  const decision = displayEv > 6 && displayEdge > 3 ? 'BET' : displayEv > 2 ? 'LEAN' : 'WAIT';
  return { modelHome, modelDraw: nv.d, modelAway, displayEdge, displayEv, decision };
};

const buildPrompt = (ev, sport, bm, odds, nv, model, settings = {}) => {
  const vars = {
    home_team: ev.home_team,
    away_team: ev.away_team,
    home_no_vig: nv.h,
    away_no_vig: nv.a,
    draw_no_vig: nv.d,
    model_home: model.modelHome,
    model_away: model.modelAway,
    model_draw: model.modelDraw,
    home_xg: sport === '世界杯' ? (model.modelHome / 35).toFixed(2) : 'N/A',
    away_xg: sport === '世界杯' ? (model.modelAway / 45).toFixed(2) : 'N/A',
    ev: model.displayEv,
    edge: model.displayEdge,
    decision: model.decision,
    min_odds: (100 / Math.max(model.modelHome, 1)).toFixed(2),
    stake: model.decision === 'BET' ? '0.25' : '0',
    home_form: '待接入正式近況資料',
    away_form: '待接入正式近況資料',
    home_goals_avg: 'N/A',
    away_goals_avg: 'N/A',
    overround: nv.overround,
    key_note: '目前模型核心尚未正式接入 Poisson/Elo，請保守解讀，並等待首發、傷病、盤口與市場更新。',
    game: 'League of Legends',
    format: '待官方賽程確認',
    home_win_rate: 'N/A',
    away_win_rate: 'N/A',
    patch_note: '待賽事版本確認',
  };
  const templates = settings?.promptTemplates || {};
  const system = templates.system || '';
  const sportTemplate = sport === '世界杯'
    ? templates.soccer_match
    : sport === 'NBA'
      ? templates.basketball_match
      : sport === '電競'
        ? templates.esports_match
        : '';

  const defaultBlock = `DATA_BLOCK:
賽事：${ev.home_team} vs ${ev.away_team}
運動類型：${sport}
開賽時間：${ev.commence_time || 'N/A'}
資料來源：The Odds API / bookmaker=${bm?.title || bm?.key || 'N/A'}
市場類型：H2H / 勝平負或勝負盤
市場去水概率：主 ${nv.h}%${odds.d ? `｜平 ${nv.d}%` : ''}｜客 ${nv.a}%
市場賠率：主 ${odds.h.toFixed(2)}${odds.d ? `｜平 ${odds.d.toFixed(2)}` : ''}｜客 ${odds.a.toFixed(2)}
展示模型概率：主 ${model.modelHome}%${odds.d ? `｜平 ${model.modelDraw}%` : ''}｜客 ${model.modelAway}%
展示 Edge：${model.displayEdge}%
展示 EV：${model.displayEv}%
決策：${model.decision}
資料完整度：0.68
陣容確認：false
重要限制：目前 Poisson/Elo 尚未正式接入，展示模型只作為市場去水後的保守解讀，不可包裝成真正模型 edge。請務必提供具體風險、價格判斷、賽前確認事項，不要寫空泛廢話。

請輸出完整賽前分析，至少包含：一句話結論、模型與市場差距、主要風險、賽前確認、SignalEdge 判斷。`;

  const userPrompt = sportTemplate ? fillTemplate(sportTemplate, vars) : defaultBlock;
  return `${system ? `${system}\n\n` : ''}${userPrompt}\n\n請使用繁體中文，語氣像專業運動分析媒體，不要暴露 prompt / API / AI 等工程字眼。`;
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
  if (process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (req.method === 'POST' && req.headers['x-admin-trigger']) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
};

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ success: false, error: 'Unauthorized' });
  if (!process.env.ODDS_API_KEY) return res.status(500).json({ success: false, error: 'ODDS_API_KEY 未設定' });

  const results = [];
  const dbCtx = getWritableDB();
  const siteSettings = await readSiteSettings(dbCtx);
  const autoCount = Number(siteSettings?.analysisSettings?.autoGenerateCount || 12);

  try {
    const oddsR = await fetch(`https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}&daysFrom=2`);
    const oddsD = await oddsR.json().catch(() => []);
    if (!oddsR.ok) throw new Error(oddsD?.message || oddsD?.error || `The Odds API HTTP ${oddsR.status}`);

    try { await writeCache(dbCtx, 'odds', { events: oddsD, source: 'the-odds-api' }); } catch (e) { console.warn('[Cron] cache odds failed:', e.message); }

    const events = (Array.isArray(oddsD) ? oddsD : [])
      .filter(ev => SPORT_MAP[ev.sport_key])
      .sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time))
      .slice(0, autoCount);

    for (const ev of events) {
      try {
        const sport = SPORT_MAP[ev.sport_key];
        const bm = ev.bookmakers?.[0];
        const h2h = bm?.markets?.find(m => m.key === 'h2h');
        const oc = h2h?.outcomes || [];
        const odds = {
          h: Number(oc.find(o => o.name === ev.home_team)?.price || 2),
          a: Number(oc.find(o => o.name === ev.away_team)?.price || 2),
          d: Number(oc.find(o => o.name === 'Draw')?.price || 0) || null,
        };
        const nv = noVig(odds.h, odds.d, odds.a);
        const model = calcDisplayModel(nv, sport, odds.h);
        const prompt = buildPrompt(ev, sport, bm, odds, nv, model, siteSettings);
        const analysis = await getAIAnalysis(prompt);

        const docData = {
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
          nvH: nv.h,
          nvD: nv.d,
          nvA: nv.a,
          modelHome: model.modelHome,
          modelDraw: model.modelDraw,
          modelAway: model.modelAway,
          odds,
          ev: model.displayEv,
          edge: model.displayEdge,
          evType: 'display_market_adjusted_placeholder',
          decision: model.decision,
          dataCompleteness: siteSettings?.analysisSettings?.minDataCompleteness || 0.68,
          lineupConfirmed: false,
          analysis: analysis || `市場去水：主 ${nv.h}% 客 ${nv.a}%。目前屬於 ${model.decision}，但 Poisson/Elo 尚未正式接入，請等首發與盤口確認。`,
          commence_time: ev.commence_time,
          timeStr: ev.commence_time,
          autoGenerated: true,
          provider: analysis ? 'aiProvider' : 'fallback_text',
          promptVersion: siteSettings?.promptMeta?.version || null,
          updatedAt: dbCtx.type === 'admin' ? adminTimestamp() : new Date(),
        };

        let id = null;
        try { id = await writeDoc(dbCtx, 'analyses', docData); } catch (e) { console.warn('[Cron] write analysis failed:', e.message); }
        results.push({ match: `${ev.home_team} vs ${ev.away_team}`, sport, id, status: 'ok' });
        await new Promise(r => setTimeout(r, 650));
      } catch (e) {
        results.push({ match: ev.id || `${ev.home_team} vs ${ev.away_team}`, status: 'error', error: e.message });
      }
    }
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message, firestore: dbCtx.type, results });
  }

  const failed = results.filter(r => r.status === 'error').length;
  res.json({ success: true, firestore: dbCtx.type, generated: results.length - failed, failed, results, time: new Date().toISOString() });
}
