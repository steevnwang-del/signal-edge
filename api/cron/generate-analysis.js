/**
 * 每日 AI 分析生成 Cron Job
 * 使用正確的數據流：後端計算所有數字 → 填入 DATA_BLOCK → Gemini 只生成敘述
 */
import { default as gemini } from '../../lib/sources/gemini.js';
import { default as odds } from '../../lib/sources/odds.js';

// 計算去水概率（no-vig）
const calcNoVig = (oddsArr) => {
  const implied = oddsArr.map(o => 1/o);
  const total = implied.reduce((s,p) => s+p, 0);
  return implied.map(p => +(p/total*100).toFixed(1));
};

// EV 計算
const calcEV = (modelPct, decimal) => +((modelPct/100 * decimal - 1)*100).toFixed(1);
const calcEdge = (modelPct, noVigPct) => +(modelPct - noVigPct).toFixed(1);
const calcMinOdds = (modelPct) => +(1/((modelPct-2)/100)).toFixed(2);
const getDecision = (edge) => edge>=4?'BET':edge>=2?'LEAN':edge<0?'NO_BET':'WAIT';

// 泊松模型
const poisson = (lambda, k) => {
  let r = Math.exp(-lambda);
  for (let i=1;i<=k;i++) r *= lambda/i;
  return r;
};
const calcPoisson = (hL, aL) => {
  let homeWin=0, draw=0, awayWin=0;
  for(let h=0;h<=6;h++) for(let a=0;a<=6;a++) {
    const p = poisson(hL,h)*poisson(aL,a);
    if(h>a) homeWin+=p; else if(h===a) draw+=p; else awayWin+=p;
  }
  return { homeWin:+(homeWin*100).toFixed(1), draw:+(draw*100).toFixed(1), awayWin:+(awayWin*100).toFixed(1) };
};

// 今日賽事（Cron 實際運行時從 The Odds API 取得）
const SAMPLE_MATCHES = [
  { id:'wc_bra_mar', sport:'soccer', home:'巴西 🇧🇷', away:'摩洛哥 🇲🇦', stage:'世界杯 C組',
    homeOdds:1.62, drawOdds:3.90, awayOdds:4.80,
    homeAtk:2.1, awayAtk:0.8, homeDef:0.9, awayDef:1.2, homeLambda:1.82, awayLambda:0.71,
    homeForm:'W W D W W', awayForm:'W L W W D', keyNote:'摩洛哥主力後衛傷況存疑' },
  { id:'lck_t1_geng', sport:'esports', game:'LOL', home:'T1', away:'Gen.G', stage:'LCK 春季賽',
    homeOdds:1.74, awayOdds:2.10,
    homeWinRate:78, awayWinRate:72,
    homeForm:'W W W W W', awayForm:'W W L W W', keyNote:'Faker 本賽季個人評分最高值' },
];

const buildDataBlock = (match) => {
  const { home, away, homeOdds, drawOdds, awayOdds, homeLambda, awayLambda } = match;
  const oddsArr = drawOdds ? [homeOdds, drawOdds, awayOdds] : [homeOdds, awayOdds];
  const noVig = calcNoVig(oddsArr);
  const noVigHome = noVig[0], noVigDraw = drawOdds ? noVig[1] : 0, noVigAway = noVig[drawOdds?2:1];
  const overround = +(oddsArr.map(o=>1/o).reduce((s,p)=>s+p,0)*100-100).toFixed(1);

  let modelHome, modelDraw, modelAway;
  if (homeLambda && awayLambda) {
    const p = calcPoisson(homeLambda, awayLambda);
    modelHome = p.homeWin; modelDraw = p.draw; modelAway = p.awayWin;
  } else {
    modelHome = noVigHome; modelDraw = noVigDraw; modelAway = noVigAway;
  }

  const edge = calcEdge(modelHome, noVigHome);
  const ev = calcEV(modelHome, homeOdds);
  const decision = getDecision(edge);

  return {
    match_info: { sport:match.sport, home_team:home, away_team:away, stage:match.stage },
    odds: { home_decimal:homeOdds, draw_decimal:drawOdds, away_decimal:awayOdds,
      home_no_vig:noVigHome, draw_no_vig:noVigDraw, away_no_vig:noVigAway, overround },
    model: { home_win_probability:modelHome, draw_probability:modelDraw, away_win_probability:modelAway,
      home_xg:homeLambda, away_xg:awayLambda },
    ev: { edge, ev_percent:ev, decision, minimum_bettable_odds:calcMinOdds(modelHome),
      stake_units: decision==='BET' ? 0.5 : 0 },
    context: { home_form:match.homeForm, away_form:match.awayForm, key_note:match.keyNote,
      data_completeness: 0.85, lineup_confirmed: false },
  };
};

const NARRATIVE_PROMPT = (dataBlock) =>
`你是 SignalEdge 的量化分析 Narrative Agent。

嚴格規則：
- 不得自行創造任何數字，所有數字來自 DATA_BLOCK
- 不使用「穩」「必中」「保證」「鎖單」
- Decision = NO BET 時說明無下注價值的原因
- 150-200字繁體中文

DATA_BLOCK:
${JSON.stringify(dataBlock, null, 2)}

輸出 JSON：
{"headline":"","summary":"","value_reason":"","main_risk":"","pre_match_check":"","decision_display":"${dataBlock.ev.decision}"}`;

export default async function handler(req, res) {
  console.log('[Cron] 每日分析生成開始', new Date().toISOString());

  // 嘗試從 The Odds API 取得真實賽事
  let matches = SAMPLE_MATCHES;
  try {
    const oddsData = await odds.getUpcoming({ region:'eu', limit:10 }, process.env);
    if (oddsData.events?.length > 0) {
      // 真實賽事：使用市場賠率作為基礎
      matches = oddsData.events.slice(0, 5).map(ev => ({
        id: ev.id, sport: ev.sport_key?.includes('soccer') ? 'soccer' : 'basketball',
        home: ev.home_team, away: ev.away_team, stage: ev.sport_title,
        homeOdds: ev.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o=>o.name===ev.home_team)?.price || 2.0,
        drawOdds: ev.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o=>o.name==='Draw')?.price,
        awayOdds: ev.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o=>o.name===ev.away_team)?.price || 2.0,
        homeLambda: null, awayLambda: null,
        homeForm: '', awayForm: '', keyNote: '賠率即時數據',
      }));
    }
  } catch(e) {
    console.log('[Cron] Odds API 失敗，使用備用賽事:', e.message);
  }

  const results = [];
  for (const match of matches) {
    try {
      const dataBlock = buildDataBlock(match);
      const prompt = NARRATIVE_PROMPT(dataBlock);
      const { analysis } = await gemini.analyze({ prompt, type:'general' }, process.env);

      // TODO: 串接 Firestore 後啟用
      // await db.collection('analyses').doc(match.id).set({ dataBlock, analysis, generatedAt: new Date() });

      results.push({ id:match.id, success:true, decision:dataBlock.ev.decision, ev:dataBlock.ev.ev_percent, chars:analysis.length });
      await new Promise(r => setTimeout(r, 700));
    } catch(e) {
      results.push({ id:match.id, success:false, error:e.message });
    }
  }

  const summary = { generated:results.filter(r=>r.success).length, failed:results.filter(r=>!r.success).length, bets:results.filter(r=>r.decision==='BET').length, results };
  console.log('[Cron] 完成', summary);
  res.json({ success:true, ...summary, time:new Date().toISOString() });
}
