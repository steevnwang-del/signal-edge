import { noVigProbabilities } from './oddsMath.js';
import { soccerModelFromMarket } from './soccerPoisson.js';
import { worldCupEloModel } from './worldCupElo.js';
import { computeDataCompleteness, riskLevel, confidenceScore } from './confidenceEngine.js';
import { evaluateMarket } from './evEngine.js';
import { classifyByTaipeiDay, formatTaipeiTime, taipeiDateKey } from './timeBuckets.js';
import { buildSignalFusion } from './signalFusion.js';
import { buildContentQualityReport } from './contentQuality.js';

const round = (n, d = 1) => Number.isFinite(Number(n)) ? +Number(n).toFixed(d) : 0;
const safeNumber = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;

export const SPORT_MAP = {
  // 世界杯 2026 - all observed/fallback keys
  soccer_world_cup: '世界杯',
  soccer_fifa_world_cup: '世界杯',
  soccer_fifa_world_cup_2026: '世界杯',
  soccer_usa_fifa_world_cup_2026: '世界杯',
  soccer_world_cup_2026: '世界杯',
  soccer_intl_world_cup: '世界杯',
  // mainstream sports
  baseball_mlb: 'MLB',
  basketball_nba: 'NBA',
  icehockey_nhl: 'NHL',
  mma_mixed_martial_arts: 'UFC',
  soccer_epl: '英超',
  soccer_uefa_champs_league: '歐冠',
  soccer_spain_la_liga: '西甲',
  soccer_germany_bundesliga: '德甲',
  soccer_france_ligue_one: '法甲',
  soccer_italy_serie_a: '義甲',
  // esports
  esports_lol_msi: 'MSI 2026',
  esports_lol: 'LOL 電競',
  esports_lol_worlds: 'LOL 電競',
  esports_lol_lck: 'LCK',
  esports_lol_lpl: 'LPL',
  // tennis
  tennis_atp: '網球',
  tennis_wta: '網球',
  tennis_atp_wimbledon: '網球',
  tennis_wta_wimbledon: '網球',
  tennis_atp_us_open: '網球',
  tennis_wta_us_open: '網球',
  tennis_atp_french_open: '網球',
  tennis_wta_french_open: '網球',
  tennis_atp_australian_open: '網球',
  tennis_wta_australian_open: '網球',
  // motorsport
  motorsport_formula1: 'F1',
  motorsport_f1: 'F1',
  f1: 'F1',
};

const SOCCER_SPORTS = ['世界杯', '英超', '歐冠', '西甲', '德甲', '義甲', '法甲'];
const ESPORTS_SPORTS = ['MSI 2026', 'LOL 電競', 'LCK', 'LPL'];
const TENNIS_SPORTS = ['網球'];
const F1_SPORTS = ['F1'];

// sport_title fallback
const detectSportFromTitle = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('world cup') || t.includes('fifa') || t.includes('mundial')) return '世界杯';
  if (t.includes('mlb') || t.includes('baseball')) return 'MLB';
  if (t.includes('nba') || t.includes('basketball')) return 'NBA';
  if (t.includes('nhl') || t.includes('hockey')) return 'NHL';
  if (t.includes('ufc') || t.includes('mma')) return 'UFC';
  if (t.includes('premier league') || t.includes('epl')) return '英超';
  if (t.includes('champions league')) return '歐冠';
  if (t.includes('la liga')) return '西甲';
  if (t.includes('msi') || t.includes('mid-season')) return 'MSI 2026';
  if (t.includes('worlds') || t.includes('world championship')) return 'LOL 電競';
  if (t.includes('lck') || t.includes('lpl') || t.includes('lec') || t.includes('lcs')) return 'LOL 電競';
  if (t.includes('tennis') || t.includes('atp') || t.includes('wta') || t.includes('wimbledon') || t.includes('grand slam')) return '網球';
  if (t.includes('formula 1') || t.includes('f1') || t.includes('grand prix')) return 'F1';
  if (t.includes('bundesliga')) return '德甲';
  if (t.includes('serie a')) return '義甲';
  if (t.includes('ligue 1') || t.includes('ligue one')) return '法甲';
  return null;
};

const zhTeam = (name = '') => ({
  Brazil:'巴西 🇧🇷', France:'法國 🇫🇷', Spain:'西班牙 🇪🇸', Argentina:'阿根廷 🇦🇷',
  Morocco:'摩洛哥 🇲🇦', England:'英格蘭 🏴', Portugal:'葡萄牙 🇵🇹', Germany:'德國 🇩🇪',
  Netherlands:'荷蘭 🇳🇱', Uruguay:'烏拉圭 🇺🇾', 'Saudi Arabia':'沙烏地阿拉伯 🇸🇦',
  USA:'美國 🇺🇸', 'United States':'美國 🇺🇸', Mexico:'墨西哥 🇲🇽', Japan:'日本 🇯🇵',
  Sweden:'瑞典 🇸🇪', Tunisia:'突尼西亞 🇹🇳', Croatia:'克羅埃西亞 🇭🇷',
  Switzerland:'瑞士 🇨🇭', Belgium:'比利時 🇧🇪', Poland:'波蘭 🇵🇱', Serbia:'塞爾維亞 🇷🇸',
  Denmark:'丹麥 🇩🇰', Senegal:'塞內加爾 🇸🇳', Ecuador:'厄瓜多 🇪🇨', Qatar:'卡達 🇶🇦',
  Australia:'澳洲 🇦🇺', Canada:'加拿大 🇨🇦', Cameroon:'喀麥隆 🇨🇲', Ghana:'迦納 🇬🇭',
  'South Korea':'南韓 🇰🇷', 'Costa Rica':'哥斯大黎加 🇨🇷', Colombia:'哥倫比亞 🇨🇴',
  Venezuela:'委內瑞拉 🇻🇪', Chile:'智利 🇨🇱', Paraguay:'巴拉圭 🇵🇾', Panama:'巴拿馬 🇵🇦',
  'New Zealand':'紐西蘭 🇳🇿', 'South Africa':'南非 🇿🇦', Nigeria:'奈及利亞 🇳🇬',
  Algeria:'阿爾及利亞 🇩🇿', Egypt:'埃及 🇪🇬', Iran:'伊朗 🇮🇷',
  Austria:'奧地利 🇦🇹', Norway:'挪威 🇳🇴', Scotland:'蘇格蘭 🏴', Czechia:'捷克 🇨🇿',
  'Bosnia and Herzegovina':'波士尼亞 🇧🇦', Turkey:'土耳其 🇹🇷', Iraq:'伊拉克 🇮🇶', Jordan:'約旦 🇯🇴',
  Uzbekistan:'烏茲別克 🇺🇿', Haiti:'海地 🇭🇹', 'Cape Verde':'維德角 🇨🇻', Curacao:'庫拉索 🇨🇼',
  'Ivory Coast':'象牙海岸 🇨🇮', 'DR Congo':'剛果民主共和國 🇨🇩',
}[name] || name);

const outcomeRole = (event, name) => {
  if (name === event.home_team) return 'home';
  if (name === event.away_team) return 'away';
  if (String(name).toLowerCase() === 'draw') return 'draw';
  return name;
};

const emptyMarketRows = (event) => ([
  { name: event.home_team, role: 'home', price: null, implied: 0, marketProb: 0.5, marketProbPct: 50, impliedPct: 0, fairOdds: 2 },
  { name: event.away_team, role: 'away', price: null, implied: 0, marketProb: 0.5, marketProbPct: 50, impliedPct: 0, fairOdds: 2 },
]);

const modelForSport = ({ sport, market, event }) => {
  const home = market.find(o => o.role === 'home')?.marketProb ?? 0.5;
  const draw = market.find(o => o.role === 'draw')?.marketProb ?? 0;
  const away = market.find(o => o.role === 'away')?.marketProb ?? Math.max(0, 1 - home - draw);

  if (sport === '世界杯') {
    const m = worldCupEloModel({
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      market: { home, draw: draw || 0.25, away },
    });
    return {
      home: m.model.home,
      draw: m.model.draw,
      away: m.model.away,
      xg: m.xg,
      scoreModel: m.score,
      method: m.method,
      elo: m.elo,
    };
  }

  if (SOCCER_SPORTS.includes(sport)) {
    const m = soccerModelFromMarket({ marketHome: home, marketDraw: draw || 0.25, marketAway: away });
    return {
      home: m.model.home,
      draw: draw ? m.model.draw : 0,
      away: m.model.away,
      xg: m.xg,
      scoreModel: m.score,
      method: m.method,
      elo: null,
    };
  }

  // Esports: no draw for Bo3/Bo5. Without odds, keep a neutral model and force WAIT later.
  if (ESPORTS_SPORTS.includes(sport)) {
    const reg = 0.05;
    return {
      home: home * (1 - reg) + 0.5 * reg,
      draw: 0,
      away: away * (1 - reg) + 0.5 * reg,
      xg: null,
      scoreModel: null,
      method: market.some(r => r.price) ? 'esports_market_calibrated_v6d' : 'esports_schedule_only_no_odds_v6d',
      elo: null,
    };
  }

  if (TENNIS_SPORTS.includes(sport)) {
    const reg = 0.06;
    return {
      home: home * (1 - reg) + 0.5 * reg,
      draw: 0,
      away: away * (1 - reg) + 0.5 * reg,
      xg: null,
      scoreModel: null,
      method: 'tennis_market_calibrated_surface_form_v6f',
      elo: null,
    };
  }

  if (F1_SPORTS.includes(sport)) {
    return {
      home: home || 0.5,
      draw: 0,
      away: away || 0.5,
      xg: null,
      scoreModel: null,
      method: 'f1_market_context_driver_constructor_v6f',
      elo: null,
    };
  }

  const reg = 0.08;
  return {
    home: home * (1 - reg) + 0.5 * reg,
    draw: 0,
    away: away * (1 - reg) + 0.5 * reg,
    xg: null,
    scoreModel: null,
    method: 'market_calibrated_probability_v6d',
    elo: null,
  };
};

const normalizePrediction = (externalPrediction) => {
  if (!externalPrediction) return null;
  const p = externalPrediction;
  return {
    source: p.source || p.predictionSource || 'external_prediction',
    advice: p.advice || p.predictionAdvice || p.winnerComment || null,
    winner: p.winner || null,
    confidence: p.confidence ?? null,
    percent: p.percent || p.predictions || null,
    homeForm: p.homeForm || null,
    awayForm: p.awayForm || null,
    homeTeam: p.homeTeam || null,
    awayTeam: p.awayTeam || null,
    fixtureId: p.fixtureId || null,
  };
};

const normalizeInsights = (insights = []) => insights
  .filter(Boolean)
  .slice(0, 5)
  .map((x, idx) => ({
    id: x.id || `insight-${idx}`,
    title: x.titleZh || x.titleDisplay || x.title || '',
    source: x.sourceLabel || x.source || 'international',
    url: x.url || '',
    publishedAt: x.publishedAt || x.date || null,
    summary: x.summaryZh || x.summary || '',
  }))
  .filter(x => x.title);


const normalizeForeignAnalystPicks = (picks = []) => picks
  .filter(Boolean)
  .slice(0, 5)
  .map((x, idx) => ({
    id: x.id || `foreign-pick-${idx}`,
    analystName: x.analystName || x.name || x.sourceLabel || '國外分析師',
    source: x.sourceLabel || x.platform || x.source || 'Foreign analyst',
    platform: x.platform || x.sourceLabel || '',
    sport: x.sport || '',
    title: x.title || '',
    url: x.url || '',
    excerpt: x.excerpt || '',
    summary: x.summaryZh || x.summary || '',
    interpretation: x.ourInterpretation || x.interpretation || '',
    stance: x.stance || 'watch',
    confidence: x.confidence || '未評級',
    eventKeywords: Array.isArray(x.eventKeywords) ? x.eventKeywords.slice(0, 8) : [],
    note: x.note || '管理員輸入的短摘錄/摘要；只作對照訊號，不可取代 SignalEdge 模型。',
  }))
  .filter(x => x.analystName && (x.summary || x.excerpt || x.title));


const normalizeForeignMasters = (items = []) => items
  .filter(Boolean)
  .slice(0, 12)
  .map((x, idx) => ({
    id: x.id || `foreign-master-${idx}`,
    sourceName: x.sourceName || x.analystName || x.name || x.sourceLabel || '國外分析大師',
    sourceLabel: x.sourceLabel || x.platform || x.sourceName || 'Foreign Master',
    sourceType: x.sourceType || 'foreign_master',
    sourceTier: x.sourceTier || x.tier || '',
    sport: x.sport || '',
    title: x.title || '',
    url: x.url || '',
    shortExcerpt: x.shortExcerpt || x.excerpt || '',
    summaryZh: x.summaryZh || x.summary || '',
    signalEdgeInterpretation: x.signalEdgeInterpretation || x.ourInterpretation || x.interpretation || '',
    stance: x.stance || 'watch',
    confidence: x.confidence || '未評級',
    eventMatchScore: x.eventMatchScore ?? null,
    masterScore: x.masterScore ?? null,
    matchReasons: Array.isArray(x.matchReasons) ? x.matchReasons.slice(0, 8) : [],
    publishedAt: x.publishedAt || null,
    usableInModel: x.usableInModel !== false,
    note: x.note || '公開短摘錄/自行摘要，只供對照與模型輔助。',
  }))
  .filter(x => x.sourceName && (x.summaryZh || x.shortExcerpt || x.title));

const normalizeAnalystSignals = (analystSignals = []) => analystSignals
  .filter(Boolean)
  .slice(0, 5)
  .map((x, idx) => ({
    id: x.id || `analyst-${idx}`,
    name: x.name || x.sourceLabel || 'International analyst source',
    source: x.sourceLabel || x.name || 'Analyst Radar',
    sport: x.sport || '',
    category: x.category || '',
    tier: x.tier || '',
    url: x.url || '',
    focus: x.focusZh || x.focus || '',
    useFor: x.useForZh || x.useFor || '',
    doNotUseFor: x.doNotUseForZh || x.doNotUseFor || '',
    checklist: Array.isArray(x.signalChecklist) ? x.signalChecklist.slice(0, 6) : [],
    note: x.note || '此為國外分析師/數據源雷達，不是即時預測；除非 DATA_BLOCK 同時有文章或摘錄，AI 不可聲稱該來源看好任何一方。',
  }))
  .filter(x => x.name);

export const buildAnalysisFromOddsEvent = (event, {
  now = new Date(),
  stats = {},
  source = 'the-odds-api',
  externalPrediction = null,
  insights = [],
  analystSignals = [],
  analystPicks = [],
  foreignMasters = [],
  foreignMasterConsensus = null,
} = {}) => {
  const sport = SPORT_MAP[event.sport_key] || detectSportFromTitle(event.sport_title || '');
  if (!sport) return null;

  const bm = event.bookmakers?.[0] || {};
  const marketObj = bm.markets?.find(m => m.key === 'h2h') || {};
  const rawOutcomes = marketObj.outcomes || [];
  const nv = noVigProbabilities(rawOutcomes);
  const hasOdds = nv.outcomes.length >= 2;
  const marketRows = hasOdds
    ? nv.outcomes.map(o => ({ ...o, role: outcomeRole(event, o.name) }))
    : emptyMarketRows(event);

  const kickoff = event.commence_time ? new Date(event.commence_time) : null;
  const kickoffHours = kickoff ? (kickoff.getTime() - new Date(now).getTime()) / 3600000 : 999;
  const hasKickoff = Boolean(event.commence_time);
  const hasTeamNames = Boolean(event.home_team && event.away_team);
  const prediction = normalizePrediction(externalPrediction);
  const insightRows = normalizeInsights(insights);
  const analystRows = normalizeAnalystSignals(analystSignals);
  const foreignPickRows = normalizeForeignAnalystPicks(analystPicks);
  const foreignMasterRows = normalizeForeignMasters(foreignMasters);
  const masterConsensus = foreignMasterConsensus || { totalSources: foreignMasterRows.length, usableSources: foreignMasterRows.filter(x => x.usableInModel).length, consensusDirection: 'watch', consensusStrength: 0, conflictLevel: 'none', summary: '尚未建立國外分析大師共識。' };
  const hasStats = Boolean(stats?.hasStats || prediction || stats?.homeForm || stats?.awayForm);
  const hasLineups = Boolean(stats?.hasLineups);
  const dataCompleteness = computeDataCompleteness({
    sport,
    hasOdds,
    hasKickoff,
    hasTeamNames,
    hasStats,
    hasLineups,
    hasEsportsSchedule: ESPORTS_SPORTS.includes(sport) && hasKickoff,
  });
  const risk = riskLevel({ dataCompleteness, overround: nv.overround, kickoffHours, sport });
  const model = modelForSport({ sport, market: marketRows, event });
  const modelMap = { home: model.home, draw: model.draw, away: model.away };
  const evEval = evaluateMarket({ marketRows, modelMap, dataCompleteness, risk });
  const rawBest = evEval.best;
  const best = hasOdds ? rawBest : null;
  const decision = hasOdds ? evEval.decision : 'WAIT';
  const confidence = confidenceScore({
    dataCompleteness,
    edgePct: hasOdds ? rawBest?.edgePct || 0 : 0,
    evPct: hasOdds ? rawBest?.evPct || 0 : 0,
    risk,
    decision,
  });
  const bucket = classifyByTaipeiDay(event.commence_time, now);
  const topScores = model.scoreModel?.topScores || [];
  const pickRole = best?.role || 'home';
  const pickName = pickRole === 'home' ? zhTeam(event.home_team) : pickRole === 'away' ? zhTeam(event.away_team) : '平手';
  const id = `${source}_${event.id || `${event.sport_key}_${event.home_team}_${event.away_team}_${event.commence_time}`}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  const rowsWithEV = evEval.rows.map(r => ({
    name: r.name,
    role: r.role,
    odds: r.price ?? null,
    impliedProbPct: r.impliedPct ?? null,
    noVigProbPct: r.marketProbPct,
    fairOdds: r.fairOdds ?? null,
    modelProbPct: r.modelProbPct,
    edgePct: hasOdds ? r.edgePct : 0,
    evPct: hasOdds ? r.evPct : 0,
    minOdds: hasOdds ? r.minOdds : null,
  }));

  const dataBlock = {
    eventId: event.id || id,
    sport,
    league: event.sport_title || event.sport_key,
    home: zhTeam(event.home_team),
    away: zhTeam(event.away_team),
    homeEn: event.home_team,
    awayEn: event.away_team,
    commence_time: event.commence_time,
    timeStr: formatTaipeiTime(event.commence_time),
    bucket,
    taipeiDate: taipeiDateKey(event.commence_time),
    bookmaker: hasOdds ? (bm.title || bm.key || 'N/A') : 'N/A - no odds',
    overround: hasOdds ? nv.overround : 0,
    marketRows: rowsWithEV,
    modelHome: round(model.home * 100, 1),
    modelDraw: round((model.draw || 0) * 100, 1),
    modelAway: round(model.away * 100, 1),
    marketHome: round((marketRows.find(r => r.role === 'home')?.marketProb || 0) * 100, 1),
    marketDraw: round((marketRows.find(r => r.role === 'draw')?.marketProb || 0) * 100, 1),
    marketAway: round((marketRows.find(r => r.role === 'away')?.marketProb || 0) * 100, 1),
    bestRole: best?.role || null,
    pickName: best ? pickName : '等待賠率',
    bestOdds: best?.price || null,
    ev: hasOdds ? rawBest?.evPct || 0 : 0,
    edge: hasOdds ? rawBest?.edgePct || 0 : 0,
    minOdds: hasOdds ? rawBest?.minOdds || null : null,
    decision,
    confidence,
    dataCompleteness,
    risk,
    method: model.method,
    modelSource: sport === '世界杯' ? 'Elo + Dixon-Coles Poisson proxy + market fair odds blend' : 'market-calibrated deterministic model',
    xg: model.xg || null,
    elo: model.elo || null,
    topScores,
    over25: model.scoreModel ? round(model.scoreModel.over25 * 100, 1) : null,
    btts: model.scoreModel ? round(model.scoreModel.btts * 100, 1) : null,
    externalPrediction: prediction,
    internationalInsights: insightRows,
    analystSignals: analystRows,
    foreignAnalystPicks: foreignPickRows,
    foreignMasters: foreignMasterRows,
    foreignMasterConsensus: masterConsensus,
    noOddsReason: hasOdds ? null : '目前沒有可用 H2H 賠率；只保留賽程與模型資訊，不計算投注 EV。',
    sourceCoverage: {
      odds: hasOdds,
      schedule: hasKickoff,
      stats: hasStats,
      lineups: hasLineups,
      scores: false,
      predictions: Boolean(prediction),
      internationalInsights: insightRows.length > 0,
      analystSignals: analystRows.length > 0,
      foreignAnalystPicks: foreignPickRows.length > 0,
      foreignMasters: foreignMasterRows.length > 0,
      oddsMovement: Boolean(stats?.oddsMovement),
    },
    cancelConditions: [
      '首發 / 先發投手 / 陣容資訊與目前假設不一致',
      '賠率跌破最低可參考價或盤口缺失',
      '臨場傷病、輪休、版本資訊或國際新聞改變模型前提',
    ],
  };

  const signalFusion = buildSignalFusion(dataBlock);
  dataBlock.signalFusion = signalFusion;
  dataBlock.contentQuality = buildContentQualityReport(dataBlock);
  dataBlock.qualityScore = dataBlock.contentQuality.score;
  dataBlock.signalAlignmentScore = signalFusion.alignmentScore;
  dataBlock.qualityTags = signalFusion.tags || [];

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
    modelVersion: 'v6f-quality-engine-foreign-master-wall',
    generatedAtISO: new Date(now).toISOString(),
  };
};

const compactDataBlockForAI = (db) => ({
  event: {
    sport: db.sport,
    league: db.league,
    home: db.home,
    away: db.away,
    commence_time_tw: db.timeStr,
    bucket: db.bucket,
  },
  market: {
    bookmaker: db.bookmaker,
    hasOdds: db.sourceCoverage?.odds === true,
    overround: db.overround,
    rows: db.marketRows,
    marketHome: db.marketHome,
    marketDraw: db.marketDraw,
    marketAway: db.marketAway,
    noOddsReason: db.noOddsReason,
  },
  model: {
    modelSource: db.modelSource,
    method: db.method,
    home: db.modelHome,
    draw: db.modelDraw,
    away: db.modelAway,
    xg: db.xg,
    elo: db.elo,
    topScores: db.topScores,
    over25: db.over25,
    btts: db.btts,
  },
  externalPrediction: db.externalPrediction || null,
  internationalInsights: db.internationalInsights || [],
  analystRadar: db.analystSignals || [],
  foreignAnalystPicks: db.foreignAnalystPicks || [],
  foreignMasters: db.foreignMasters || [],
  foreignMasterConsensus: db.foreignMasterConsensus || null,
  signalFusion: db.signalFusion || null,
  contentQuality: db.contentQuality || null,
  quality: {
    decision: db.decision,
    confidence: db.confidence,
    dataCompleteness: db.dataCompleteness,
    risk: db.risk,
    bestRole: db.bestRole,
    pickName: db.pickName,
    bestOdds: db.bestOdds,
    ev: db.ev,
    edge: db.edge,
    minOdds: db.minOdds,
    sourceCoverage: db.sourceCoverage,
    cancelConditions: db.cancelConditions,
  },
  teamContext: {
    homeForm: db.homeForm || null,
    awayForm: db.awayForm || null,
    homeGoalsAvg: db.homeGoalsAvg || null,
    awayGoalsAvg: db.awayGoalsAvg || null,
    h2h: db.h2h || null,
    contextSource: db.contextSource || null,
  },
});

export const buildPromptFromDataBlock = (dataBlock, settings = {}) => {
  const db = dataBlock;
  const isSoccer = SOCCER_SPORTS.includes(db.sport);
  const isMLB = db.sport === 'MLB';
  const isNBA = db.sport === 'NBA';
  const isEsports = /電競|MSI|LOL|LCK|LPL/.test(db.sport || '');
  const isTennis = db.sport === '網球';
  const isF1 = db.sport === 'F1';
  const aiBlock = compactDataBlockForAI(db);

  const sportTips = isSoccer
    ? '足球：重點解釋 Elo/Poisson、模型機率、去水市場、比分分布與資料缺口。世界杯可提國際媒體觀點；國外分析大師雷達只能作為應核對來源；若 foreignAnalystPicks 有管理員輸入的短摘錄/摘要，才可整理成對照觀點。'
    : isMLB
    ? '棒球：先發投手未在 DATA_BLOCK 出現時，不得自行補投手或傷病。'
    : isNBA
    ? '籃球：不得自行補傷病、輪休或先發，只能說 DATA_BLOCK 未提供。'
    : isEsports
    ? '電競：可說明賽區強度與 Bo3/Bo5 風險，但不得自行創造版本、選手狀態或賠率。'
    : isTennis
    ? '網球：重點放在球員狀態、場地適性、發接發與賽程疲勞；DATA_BLOCK 沒有提供時不得編造傷病或對戰數據。'
    : isF1
    ? 'F1：重點放在排位、長距離速度、車隊升級、天氣與賽道特性；DATA_BLOCK 沒有提供時不得編造練習賽或車況。'
    : '說明市場、模型與資料限制。';

  const decisionContext = db.decision === 'BET'
    ? '可說明價格優勢，同時提醒風險'
    : db.decision === 'LEAN'
    ? '說明傾向觀察的理由，但不得暗示必勝'
    : '說明為何需要等待確認或資料不足';

  return `你是 SignalEdge 的繁體中文賽事分析編輯。${sportTips}

硬性規則（必須遵守）：
- 你只能讀取並引用下方 DATA_BLOCK_JSON 的資料。
- 不得自行創造任何勝率、EV、Edge、比分、傷病、陣容、先發、新聞事件、賽果或內幕。
- DATA_BLOCK_JSON 沒有提供的資訊，一律寫「目前資料未提供」或「需賽前確認」。
- DATA_BLOCK_JSON.analystRadar 是國外分析大師/數據源雷達，不是即時推薦；不得寫成該來源已經下注或推薦。
- DATA_BLOCK_JSON.foreignAnalystPicks 是管理員輸入的短摘錄/中文摘要；只有這裡存在的內容可以被稱為『國外分析大師對照觀點』，且必須保持保守語氣。
- DATA_BLOCK_JSON.foreignMasters 是全自動國外分析大師情報牆：只可引用短摘錄、中文摘要、來源連結、共識分數與 SignalEdge 對照，不得搬運全文。
- DATA_BLOCK_JSON.contentQuality / signalFusion 是內容質量與訊號一致性評估，必須用來說明為什麼推薦、觀望或降級。
- decision 已由模型決定為 ${db.decision}，不得更改；${decisionContext}。
- 若 sourceCoverage.odds=false，必須明確說「無賠率，不計算投注 EV，只做情報觀察」。
- 禁止用語：穩、必中、保證、鎖單、必下、重注、上車。
- 輸出只包含分析內容本身，不要貼回 JSON，不要提到你收到規則。

DATA_BLOCK_JSON:
${JSON.stringify(aiBlock, null, 2)}

請嚴格按照以下格式輸出，每個標題用【】括住，不要加編號：

【一句話結論】
15字以內，直接說模型判斷。

【資料來源與模型框架】
用 70-110 字說明這場分析用了哪些資料：市場去水、fair odds/最低參考賠率、Elo/Poisson、外部預測、國際觀點、國外分析大師雷達與人工觀點庫。沒有的資料要說缺失。

【賽事背景與雙方狀態】
用 90-140 字，只能引用 teamContext、externalPrediction、internationalInsights 中有的內容；沒有就寫資料未提供，不要編造。

【模型與市場解讀】
用 100-150 字引用模型機率、市場去水機率、EV、Edge、fair odds/最低參考賠率與最可能比分。沒有賠率時說明不計算 EV。

【內容質量評分】
用 60-100 字說明 contentQuality.score、signalFusion.alignmentScore、資料完整度、主要缺口與質量標籤。

【國外分析大師牆】
用 100-170 字整理 DATA_BLOCK_JSON.foreignMasters、foreignMasterConsensus 與 foreignAnalystPicks；列出命中的來源數、共識方向、分歧程度，以及與 SignalEdge 模型是否一致。不得寫成保證或照抄全文。

【國外分析大師雷達】
用 50-90 字整理 DATA_BLOCK_JSON.analystRadar 中應優先核對的國外分析大師/數據源；只能當核對清單。

【國際新聞與觀點】
用 50-90 字整理 DATA_BLOCK_JSON.internationalInsights 的標題或摘要；沒有就說目前國際新聞快取尚未命中此賽事。

【主要風險與限制】
用 70-100 字說明資料完整度、風險分數、資料缺口與取消條件。

【賽前確認事項】
用 40-70 字列出需要確認的條件，例如首發/投手/陣容/版本/賠率是否仍有效。

【SignalEdge 判斷】
用 35-60 字，必須符合 decision=${db.decision}。`;
};

export const fallbackNarrative = (a) => {
  const db = a.dataBlock || a;
  const hasOdds = db.sourceCoverage?.odds !== false;
  const scores = db.topScores?.length ? `最可能比分參考：${db.topScores.slice(0,3).map(s=>`${s.score}(${s.probPct}%)`).join('、')}。` : '';
  const insights = db.internationalInsights?.length
    ? `國際觀點：${db.internationalInsights.slice(0,2).map(x=>x.title).join('；')}。`
    : '國際觀點快取尚未命中此賽事。';
  const prediction = db.externalPrediction?.advice || db.externalPrediction?.winner
    ? `外部預測參考：${[db.externalPrediction?.advice, db.externalPrediction?.winner].filter(Boolean).join(' / ')}。`
    : '外部預測資料未提供。';
  const analysts = db.analystSignals?.length
    ? `國外分析大師雷達：${db.analystSignals.slice(0,3).map(x=>`${x.name || x.source}（${x.category || '觀點源'}）`).join('、')}，只作賽前核對，不代表該來源已給出推薦。`
    : '國外分析大師雷達尚未命中此賽事。';
  const foreignPicks = db.foreignAnalystPicks?.length
    ? `人工觀點庫命中：${db.foreignAnalystPicks.slice(0,2).map(x=>`${x.analystName || x.source}：${x.summary || x.title}`).join('；')}。`
    : '人工觀點庫尚未命中此賽事。';
  const masterWall = db.foreignMasters?.length
    ? `國外分析大師牆命中 ${db.foreignMasters.length} 則；${db.foreignMasterConsensus?.summary || ''}`
    : '國外分析大師牆尚未命中此賽事。';
  const qualityLine = `內容質量 ${db.contentQuality?.score || db.qualityScore || 0}/100，訊號一致性 ${db.signalFusion?.alignmentScore || db.signalAlignmentScore || 0}/100，標籤：${(db.qualityTags || db.signalFusion?.tags || []).join('、') || '待補強'}。`;

  if (!hasOdds) {
    return `【一句話結論】等待賠率確認\n【資料來源與模型框架】本場目前只有賽程與隊伍資訊，缺少可用 H2H 市場賠率，因此不計算投注 EV、Edge 或最低參考賠率。\n【賽事背景與雙方狀態】${db.home} 對 ${db.away}，開賽時間 ${db.timeStr || '未提供'}。${prediction}\n【模型與市場解讀】模型暫以保守機率顯示：主 ${db.modelHome}%${db.modelDraw ? ` / 平 ${db.modelDraw}%` : ''} / 客 ${db.modelAway}%。由於無賠率，SignalEdge 判斷維持 WAIT。\n【內容質量評分】${qualityLine}\n【國外分析大師牆】${masterWall}${foreignPicks}\n【國外分析大師雷達】${analysts}\n【國際新聞與觀點】${insights}\n【主要風險與限制】資料完整度 ${db.dataCompleteness}/100，風險分數 ${db.risk}/100；主要限制是賠率、陣容、版本與臨場資訊不足。\n【賽前確認事項】等待賠率、陣容/版本與官方賽程確認後再更新。\n【SignalEdge 判斷】目前只適合情報觀察，不作下注建議。`;
  }

  return `【一句話結論】${db.decision}：${db.pickName}\n【資料來源與模型框架】本場使用市場去水、fair odds、模型機率與資料完整度評估。${prediction}\n【賽事背景與雙方狀態】${db.home} vs ${db.away}，開賽時間 ${db.timeStr || '未提供'}。${db.homeForm ? `${db.home} 近況 ${db.homeForm}，${db.away} 近況 ${db.awayForm || '未提供'}。` : '近期狀態資料未提供。'}\n【模型與市場解讀】模型機率 ${db.modelHome}% / ${db.modelDraw ? db.modelDraw + '% / ' : ''}${db.modelAway}%，市場去水機率 ${db.marketHome}% / ${db.marketDraw ? db.marketDraw + '% / ' : ''}${db.marketAway}%。最佳價格差 EV ${db.ev}%、Edge ${db.edge}%，最低參考價 ${db.minOdds || '—'}。${scores}\n【內容質量評分】${qualityLine}\n【國外分析大師牆】${masterWall}${foreignPicks}\n【國外分析大師雷達】${analysts}\n【國際新聞與觀點】${insights}\n【主要風險與限制】資料完整度 ${db.dataCompleteness}/100，風險分數 ${db.risk}/100；臨場陣容、先發、版本或盤口變動可能改變判斷。\n【賽前確認事項】確認首發/投手/陣容/版本與賠率是否仍高於最低參考價。\n【SignalEdge 判斷】此內容是價格與機率比較，不代表結果保證。`;
};

export default { buildAnalysisFromOddsEvent, buildPromptFromDataBlock, fallbackNarrative, SPORT_MAP };
