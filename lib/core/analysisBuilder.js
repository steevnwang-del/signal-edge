import { noVigProbabilities } from './oddsMath.js';
import { soccerModelFromMarket } from './soccerPoisson.js';
import { computeDataCompleteness, riskLevel, confidenceScore } from './confidenceEngine.js';
import { evaluateMarket } from './evEngine.js';
import { classifyByTaipeiDay, formatTaipeiTime, taipeiDateKey } from './timeBuckets.js';

const round = (n, d = 1) => +Number(n || 0).toFixed(d);

export const SPORT_MAP = {
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

const zhTeam = (name = '') => ({
  Brazil:'巴西 🇧🇷', France:'法國 🇫🇷', Spain:'西班牙 🇪🇸', Argentina:'阿根廷 🇦🇷', Morocco:'摩洛哥 🇲🇦', England:'英格蘭 🏴', Portugal:'葡萄牙 🇵🇹', Germany:'德國 🇩🇪', Netherlands:'荷蘭 🇳🇱', Uruguay:'烏拉圭 🇺🇾', 'Saudi Arabia':'沙烏地阿拉伯 🇸🇦', USA:'美國 🇺🇸', 'United States':'美國 🇺🇸', Mexico:'墨西哥 🇲🇽', Japan:'日本 🇯🇵', Sweden:'瑞典 🇸🇪', Tunisia:'突尼西亞 🇹🇳'
}[name] || name);

const outcomeRole = (event, name) => {
  if (name === event.home_team) return 'home';
  if (name === event.away_team) return 'away';
  if (String(name).toLowerCase() === 'draw') return 'draw';
  return name;
};

const modelForSport = ({ sport, market }) => {
  const home = market.find(o => o.role === 'home')?.marketProb || 0.5;
  const draw = market.find(o => o.role === 'draw')?.marketProb || 0;
  const away = market.find(o => o.role === 'away')?.marketProb || Math.max(0, 1 - home - draw);
  if (sport === '世界杯' || sport === '英超' || sport === '歐冠' || sport === '西甲') {
    const m = soccerModelFromMarket({ marketHome: home, marketDraw: draw || 0.25, marketAway: away });
    return {
      home: m.model.home, draw: draw ? m.model.draw : 0, away: m.model.away,
      xg: m.xg, scoreModel: m.score, method: m.method,
    };
  }
  // MVP for MLB/NBA: market-calibrated probability, slightly regressed to 50/50 to avoid fake precision.
  const reg = 0.08;
  return {
    home: home * (1 - reg) + 0.5 * reg,
    draw: 0,
    away: away * (1 - reg) + 0.5 * reg,
    xg: null,
    scoreModel: null,
    method: 'market_calibrated_probability_mvp',
  };
};

export const buildAnalysisFromOddsEvent = (event, { now = new Date(), stats = {}, source = 'the-odds-api' } = {}) => {
  const sport = SPORT_MAP[event.sport_key];
  if (!sport) return null;
  const bm = event.bookmakers?.[0] || {};
  const marketObj = bm.markets?.find(m => m.key === 'h2h') || {};
  const rawOutcomes = marketObj.outcomes || [];
  const nv = noVigProbabilities(rawOutcomes);
  if (nv.outcomes.length < 2) return null;
  const marketRows = nv.outcomes.map(o => ({ ...o, role: outcomeRole(event, o.name) }));
  const kickoff = new Date(event.commence_time);
  const kickoffHours = (kickoff.getTime() - new Date(now).getTime()) / 3600000;
  const hasOdds = marketRows.length >= 2;
  const hasKickoff = Boolean(event.commence_time);
  const hasTeamNames = Boolean(event.home_team && event.away_team);
  const hasStats = Boolean(stats?.hasStats);
  const hasLineups = Boolean(stats?.hasLineups);
  const dataCompleteness = computeDataCompleteness({ sport, hasOdds, hasKickoff, hasTeamNames, hasStats, hasLineups });
  const risk = riskLevel({ dataCompleteness, overround: nv.overround, kickoffHours, sport });
  const model = modelForSport({ sport, market: marketRows });
  const modelMap = { home: model.home, draw: model.draw, away: model.away };
  const evEval = evaluateMarket({ marketRows, modelMap, dataCompleteness, risk });
  const best = evEval.best;
  const decision = evEval.decision;
  const confidence = confidenceScore({ dataCompleteness, edgePct: best?.edgePct || 0, evPct: best?.evPct || 0, risk, decision });
  const bucket = classifyByTaipeiDay(event.commence_time, now);
  const topScores = model.scoreModel?.topScores || [];
  const pickName = best?.role === 'home' ? zhTeam(event.home_team) : best?.role === 'away' ? zhTeam(event.away_team) : '平手';
  const id = `${source}_${event.id || `${event.sport_key}_${event.home_team}_${event.away_team}_${event.commence_time}`}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  const dataBlock = {
    eventId: event.id || id,
    sport,
    league: event.sport_title || event.sport_key,
    home: zhTeam(event.home_team), away: zhTeam(event.away_team),
    homeEn: event.home_team, awayEn: event.away_team,
    commence_time: event.commence_time,
    timeStr: formatTaipeiTime(event.commence_time),
    bucket,
    taipeiDate: taipeiDateKey(event.commence_time),
    bookmaker: bm.title || bm.key || 'N/A',
    overround: nv.overround,
    marketRows: evEval.rows.map(r => ({ name: r.name, role: r.role, odds: r.price, marketProbPct: r.marketProbPct, modelProbPct: r.modelProbPct, edgePct: r.edgePct, evPct: r.evPct, minOdds: r.minOdds })),
    modelHome: round(model.home * 100, 1),
    modelDraw: round((model.draw || 0) * 100, 1),
    modelAway: round(model.away * 100, 1),
    marketHome: round((marketRows.find(r => r.role === 'home')?.marketProb || 0) * 100, 1),
    marketDraw: round((marketRows.find(r => r.role === 'draw')?.marketProb || 0) * 100, 1),
    marketAway: round((marketRows.find(r => r.role === 'away')?.marketProb || 0) * 100, 1),
    bestRole: best?.role || 'home',
    pickName,
    bestOdds: best?.price || null,
    ev: best?.evPct || 0,
    edge: best?.edgePct || 0,
    minOdds: best?.minOdds || null,
    decision,
    confidence,
    dataCompleteness,
    risk,
    method: model.method,
    xg: model.xg,
    topScores,
    over25: model.scoreModel ? round(model.scoreModel.over25 * 100, 1) : null,
    btts: model.scoreModel ? round(model.scoreModel.btts * 100, 1) : null,
    sourceCoverage: {
      odds: true,
      schedule: hasKickoff,
      stats: hasStats,
      lineups: hasLineups,
      scores: false,
    },
    cancelConditions: [
      '首發 / 先發投手 / 陣容資訊與目前假設不一致',
      '賠率跌破最低可參考價',
      '臨場傷病、輪休或版本資訊改變模型前提',
    ],
  };

  return {
    id,
    ...dataBlock,
    status: 'pending',
    accessLevel: 'free',
    home: dataBlock.home,
    away: dataBlock.away,
    nvH: dataBlock.marketHome,
    nvD: dataBlock.marketDraw,
    nvA: dataBlock.marketAway,
    odds: {
      h: marketRows.find(r => r.role === 'home')?.price || null,
      d: marketRows.find(r => r.role === 'draw')?.price || null,
      a: marketRows.find(r => r.role === 'away')?.price || null,
    },
    dataBlock,
    modelVersion: 'v6b-1-market-poisson-mvp',
    generatedAtISO: new Date(now).toISOString(),
  };
};

export const buildPromptFromDataBlock = (dataBlock, settings = {}) => {
  const templates = settings?.promptTemplates || {};
  const system = templates.system || `你是 SignalEdge 的賽事分析編輯。你只能根據 DATA_BLOCK 寫分析，不能創造勝率、EV、比分、傷病、賠率或內線資訊。不得使用必中、穩單、保證獲利。`;
  const sportTemplateRaw = dataBlock.sport === 'NBA'
    ? templates.basketball_match
    : dataBlock.sport === 'MLB'
      ? templates.baseball_match
      : /電競|MSI|LOL/.test(dataBlock.sport || '')
        ? templates.esports_match
        : templates.soccer_match;
  const vars = {
    home_team: dataBlock.home, away_team: dataBlock.away,
    home_no_vig: dataBlock.marketHome, away_no_vig: dataBlock.marketAway, draw_no_vig: dataBlock.marketDraw,
    model_home: dataBlock.modelHome, model_away: dataBlock.modelAway, model_draw: dataBlock.modelDraw,
    ev: dataBlock.ev, edge: dataBlock.edge, decision: dataBlock.decision, min_odds: dataBlock.minOdds,
    home_xg: dataBlock.xg?.homeXg || 'N/A', away_xg: dataBlock.xg?.awayXg || 'N/A', overround: dataBlock.overround,
    key_note: `資料完整度 ${dataBlock.dataCompleteness}/100；風險 ${dataBlock.risk}/100；模型方法 ${dataBlock.method}`
  };
  const filledSportTemplate = String(sportTemplateRaw || '').replace(/\{([^}]+)\}/g, (_, k) => vars[k] ?? 'N/A');
  return `${system}\n\n後台運動模板參考：\n${filledSportTemplate || '使用預設 SignalEdge 模板'}\n\nDATA_BLOCK=${JSON.stringify(dataBlock, null, 2)}\n\n請輸出繁體中文，格式固定為：\n【一句話結論】\n【模型與市場】\n【資料完整度】\n【主要風險】\n【賽前確認】\n【SignalEdge 判斷】\n\n要求：\n1. 必須引用 DATA_BLOCK 裡的模型機率、市場去水機率、EV、Edge、資料完整度。\n2. 若 decision 不是 BET，不得寫成推薦下注。\n3. 若資料完整度低於 70，必須清楚說明限制。\n4. 文字要具體、可讀，不要出現 API、prompt、AI、JSON 等工程字眼。`;
};

export const fallbackNarrative = (a) => {
  const db = a.dataBlock || a;
  const scores = db.topScores?.length ? `最可能比分參考：${db.topScores.slice(0,3).map(s=>`${s.score}(${s.probPct}%)`).join('、')}。` : '';
  return `【一句話結論】${db.home} vs ${db.away} 目前模型判斷為 ${db.decision}，首選觀察方向是 ${db.pickName}。\n【模型與市場】模型機率 ${db.modelHome}% / ${db.modelDraw ? db.modelDraw + '% / ' : ''}${db.modelAway}%，市場去水機率 ${db.marketHome}% / ${db.marketDraw ? db.marketDraw + '% / ' : ''}${db.marketAway}%。目前最佳價格差 EV ${db.ev}%、Edge ${db.edge}%。\n【資料完整度】資料完整度 ${db.dataCompleteness}/100，風險分數 ${db.risk}/100。${scores}\n【主要風險】臨場陣容、先發、版本或盤口變動可能改變判斷。\n【賽前確認】確認首發/投手/版本與賠率是否仍高於最低可參考價 ${db.minOdds || '—'}。\n【SignalEdge 判斷】此內容是價格與機率比較，不代表結果保證。`;
};

export default { buildAnalysisFromOddsEvent, buildPromptFromDataBlock, fallbackNarrative, SPORT_MAP };
