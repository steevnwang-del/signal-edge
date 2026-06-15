/**
 * 每日 AI 分析生成 Cron Job
 * 台灣時間早上 6 點（UTC 22:00）
 * 使用 aiProvider：自動 Gemini → Groq fallback
 */
import aiProvider from '../../lib/sources/aiProvider.js';
import odds       from '../../lib/sources/odds.js';

// 泊松分布
const poisson = (lambda, k) => { let r = Math.exp(-lambda); for (let i=1;i<=k;i++) r*=lambda/i; return r; };
const calcPoissonProb = (hL, aL) => {
  let hw=0, d=0, aw=0;
  for (let h=0;h<=6;h++) for (let a=0;a<=6;a++) {
    const p = poisson(hL,h)*poisson(aL,a);
    if(h>a) hw+=p; else if(h===a) d+=p; else aw+=p;
  }
  return { homeWin:+(hw*100).toFixed(1), draw:+(d*100).toFixed(1), awayWin:+(aw*100).toFixed(1) };
};

// 去水概率
const noVig = (odds_) => {
  const i = odds_.map(o=>1/o);
  const t = i.reduce((s,p)=>s+p,0);
  return i.map(p=>+(p/t*100).toFixed(1));
};

// EV 計算
const calcEV = (modelPct, decimal) => +((modelPct/100*decimal-1)*100).toFixed(1);
const calcEdge = (modelPct, nvPct) => +(modelPct-nvPct).toFixed(1);
const getDecision = (edge) => edge>=4?'BET':edge>=2?'LEAN':edge<0?'NO_BET':'WAIT';

const NARRATIVE_PROMPT = (db) =>
`你是 SignalEdge 的 Narrative Agent。嚴格規則：
- 所有數字必須來自 DATA_BLOCK，不得自行創造
- 不使用「穩」「必中」「保證」「鎖單」
- Decision=NO_BET 時說明無價值原因
- 150-200字繁體中文

DATA_BLOCK:
${JSON.stringify(db, null, 2)}

輸出 JSON：{"headline":"","summary":"","main_risk":"","pre_match_check":"","decision":"${db.ev?.decision}"}`;

export default async function handler(req, res) {
  console.log('[Cron] 每日分析生成開始', new Date().toISOString());

  // 取今日賽事（從 Odds API）
  let matches = [];
  try {
    const r = await odds.getUpcoming({ region:'eu', limit:8 }, process.env);
    if (r.events?.length) {
      matches = r.events.slice(0,5).map(ev => {
        const bm = ev.bookmakers?.[0];
        const h2h = bm?.markets?.find(m=>m.key==='h2h');
        const oc = h2h?.outcomes || [];
        const homeO = oc.find(o=>o.name===ev.home_team)?.price||2;
        const awayO = oc.find(o=>o.name===ev.away_team)?.price||2;
        const drawO = oc.find(o=>o.name==='Draw')?.price||null;
        return { id:ev.id, home:ev.home_team, away:ev.away_team, stage:ev.sport_title, homeO, drawO, awayO };
      });
    }
  } catch(e) { console.warn('[Cron] Odds API failed:', e.message); }

  // 備用賽事
  if (!matches.length) {
    matches = [
      { id:'wc_sample_1', home:'巴西', away:'摩洛哥', stage:'世界杯', homeO:1.62, drawO:3.90, awayO:4.80 },
      { id:'wc_sample_2', home:'法國', away:'塞內加爾', stage:'世界杯', homeO:1.75, drawO:3.80, awayO:4.20 },
    ];
  }

  const results = [];
  for (const match of matches) {
    try {
      const oddsArr = [match.homeO, match.drawO, match.awayO].filter(Boolean);
      const nv = noVig(oddsArr);
      const [nvH, nvD, nvA] = nv;

      // 模型概率（用去水概率作為基線，有 lambda 就用泊松）
      const { homeWin:modelH, draw:modelD, awayWin:modelA } = { homeWin:nvH, draw:nvD||0, awayWin:nvA };

      const edge = calcEdge(modelH, nvH);
      const ev = calcEV(modelH, match.homeO);
      const decision = getDecision(edge);

      const dataBlock = {
        match_info: { home:match.home, away:match.away, stage:match.stage },
        odds: { home:match.homeO, draw:match.drawO, away:match.awayO, home_no_vig:nvH, draw_no_vig:nvD, away_no_vig:nvA },
        model: { home_win:modelH, draw:modelD, away_win:modelA },
        ev: { edge, ev_percent:ev, decision, min_bettable_odds:+(1/((modelH-2)/100)).toFixed(2) },
        context: { data_completeness:0.8, lineup_confirmed:false },
      };

      // 使用 aiProvider（自動 Gemini → Groq fallback）
      const { analysis, provider, model } = await aiProvider.analyze(
        { prompt: NARRATIVE_PROMPT(dataBlock), type: 'general' },
        process.env
      );

      // TODO: 串接 Firestore 後存入
      // await db.collection('analyses').add({ ...dataBlock, analysis, provider, model, createdAt: new Date() });

      results.push({ id:match.id, success:true, decision, ev, provider, model });
      await new Promise(r => setTimeout(r, 800));
    } catch(e) {
      results.push({ id:match.id, success:false, error:e.message });
    }
  }

  const summary = {
    generated: results.filter(r=>r.success).length,
    failed: results.filter(r=>!r.success).length,
    bets: results.filter(r=>r.decision==='BET').length,
    providers: [...new Set(results.filter(r=>r.provider).map(r=>r.provider))],
    results,
  };
  console.log('[Cron] 完成', summary);
  res.json({ success:true, ...summary, time:new Date().toISOString() });
}
