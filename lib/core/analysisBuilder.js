import { noVigProbabilities } from './oddsMath.js';
import { soccerModelFromMarket } from './soccerPoisson.js';
import { computeDataCompleteness, riskLevel, confidenceScore } from './confidenceEngine.js';
import { evaluateMarket } from './evEngine.js';
import { classifyByTaipeiDay, formatTaipeiTime, taipeiDateKey } from './timeBuckets.js';

const round = (n, d = 1) => +Number(n || 0).toFixed(d);

export const SPORT_MAP = {
  // 世界杯 2026 - 所有可能的 key
  soccer_world_cup: '世界杯',
  soccer_fifa_world_cup: '世界杯',
  soccer_fifa_world_cup_2026: '世界杯',
  soccer_usa_fifa_world_cup_2026: '世界杯',
  soccer_world_cup_2026: '世界杯',
  soccer_intl_world_cup: '世界杯',
  // 其他運動
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
  // 電競
  esports_lol_msi: 'MSI 2026',
  esports_lol: 'LOL 電競',
  esports_lol_worlds: 'LOL 電競',
  esports_lol_lck: 'LCK',
  esports_lol_lpl: 'LPL',
};

// 根據 sport_title 也做 fallback 判斷
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
  if (['世界杯','英超','歐冠','西甲','德甲','義甲','法甲'].includes(sport)) {
    const m = soccerModelFromMarket({ marketHome: home, marketDraw: draw || 0.25, marketAway: away });
    return {
      home: m.model.home, draw: draw ? m.model.draw : 0, away: m.model.away,
      xg: m.xg, scoreModel: m.score, method: m.method,
    };
  }
  // 電競：Bo3/Bo5 格式，主客場意義不大，用純市場概率
  if (['MSI 2026','LOL 電競','LCK','LPL'].includes(sport)) {
    // 沒有賠率時用 50/50
    if (!home || home === 0.5) return { home: 0.5, draw: 0, away: 0.5, xg: null, scoreModel: null, method: 'esports_no_odds_equal' };
    const reg = 0.05;
    return {
      home: home * (1 - reg) + 0.5 * reg,
      draw: 0,
      away: away * (1 - reg) + 0.5 * reg,
      xg: null,
      scoreModel: null,
      method: 'esports_market_calibrated',
    };
  }
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
  // sport_key 對應，fallback 用 sport_title 判斷
  const sport = SPORT_MAP[event.sport_key] || detectSportFromTitle(event.sport_title || '');
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
    xg: model.xg || null,
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
  const db = dataBlock;
  const isSoccer = ['世界杯','英超','歐冠','西甲','德甲','義甲','法甲'].includes(db.sport);
  const isMLB = db.sport === 'MLB';
  const isNBA = db.sport === 'NBA';
  const isEsports = /電競|MSI|LOL/.test(db.sport || '');

  const hasForm = db.homeForm && db.homeForm !== 'N/A' && db.homeForm.length > 0;
  const hasH2H = db.h2h && db.h2h.length > 0;
  const hasXG = db.xg?.homeXg;
  const hasScores = db.topScores?.length > 0;

  // Context block
  const lines = [];
  lines.push(`賽事：${db.home} vs ${db.away}`);
  lines.push(`聯賽：${db.league || db.sport} | 開賽：${db.timeStr || 'N/A'}`);
  lines.push('');
  lines.push('【賠率與市場】');
  lines.push(`市場去水：主 ${db.marketHome}%${db.marketDraw ? ' / 平 ' + db.marketDraw + '%' : ''} / 客 ${db.marketAway}%`);
  lines.push(`模型機率：主 ${db.modelHome}%${db.modelDraw ? ' / 平 ' + db.modelDraw + '%' : ''} / 客 ${db.modelAway}%`);
  lines.push(`EV：${db.ev >= 0 ? '+' : ''}${db.ev}% | Edge：${db.edge >= 0 ? '+' : ''}${db.edge}% | 最低參考賠率：${db.minOdds || 'N/A'}`);
  lines.push(`莊家水錢：${db.overround}% | 模型判斷：${db.decision}`);
  lines.push('');

  if (hasForm) {
    lines.push('【近期戰績（最近5場：W勝 D平 L負）】');
    lines.push(`${db.home}：${db.homeForm}${db.homeGoalsAvg ? ' | 場均進球 ' + db.homeGoalsAvg : ''}`);
    lines.push(`${db.away}：${db.awayForm}${db.awayGoalsAvg ? ' | 場均進球 ' + db.awayGoalsAvg : ''}`);
    lines.push('');
  }

  if (hasH2H) {
    lines.push('【近期交鋒記錄】');
    lines.push(db.h2h);
    lines.push('');
  }

  if (hasXG && isSoccer) {
    lines.push('【預期進球（xG）】');
    lines.push(`${db.home}：${db.xg.homeXg} xG | ${db.away}：${db.xg.awayXg} xG`);
    if (db.over25 != null) lines.push(`大球Over 2.5機率：${db.over25}%`);
    if (db.btts != null) lines.push(`雙方進球機率：${db.btts}%`);
    lines.push('');
  }

  if (hasScores && isSoccer) {
    lines.push('【最可能比分】');
    db.topScores.slice(0,5).forEach(s => lines.push(`${s.score}：${s.probPct}%`));
    lines.push('');
  }

  lines.push('【資料品質】');
  lines.push(`完整度：${db.dataCompleteness}/100 | 風險分數：${db.risk}/100`);
  if (db.contextSource) lines.push(`資料補充來源：${db.contextSource}`);

  // Sport-specific tips for AI
  const sportTips = isSoccer
    ? '足球：引用近期戰績和交鋒記錄，分析進攻效率。若為世界杯，說明小組積分情境（是否有輪換壓力）。'
    : isMLB
    ? '棒球：先發投手是最關鍵因素，若未確認必須說明。分析主客場優勢。'
    : isNBA
    ? '籃球：說明主客場優勢，背靠背賽程影響，進攻防守效率差異。'
    : isEsports
    ? '電競：說明賽區強度（LCK/LPL vs LEC/LCS），版本適應性，Bo3/Bo5心理因素。'
    : '說明主客場、近況與關鍵不確定因素。';

  const decisionContext = db.decision === 'BET'
    ? '可說明價格優勢，同時提醒風險'
    : db.decision === 'LEAN'
    ? '說明傾向觀察的理由，但不得暗示必勝'
    : '說明為何需要等待確認或資料不足';

  return `你是 SignalEdge 的繁體中文賽事分析編輯。${sportTips}

規則（必須遵守）：
- 只能引用 DATA_BLOCK 提供的數字，不得自行創造任何數據
- decision 為 ${db.decision}，${decisionContext}
- 資料完整度 ${db.dataCompleteness}/100${db.dataCompleteness < 65 ? '，必須在分析中說明資料不足的限制' : ''}
- 絕對禁止：穩、必中、保證、鎖單、必下、重注、上車
- 語氣像專業分析師，不是廣告文
- 輸出只包含分析內容本身，不要重複規則或 DATA_BLOCK

以下是賽事資料：
${lines.join('\n')}

請嚴格按照以下格式輸出，每個標題用【】括住，不要加編號：

【一句話結論】
直接說明模型對這場比賽的判斷（15字以內）

【賽事背景與雙方狀態】
${hasForm ? '引用近期戰績數字，說明雙方當前狀態。' : '說明這場比賽的背景與雙方基本情況。'}${hasH2H ? '提及歷史交鋒記錄。' : ''}（100-150字）

【模型與市場解讀】
引用模型機率、市場去水機率、EV、Edge 等具體數字，解釋為什麼做出這個判斷。（80-120字）

【主要風險與限制】
列出可能影響判斷的因素，包括資料缺口、賽前不確定性。${db.dataCompleteness < 65 ? '資料完整度偏低，必須明確說明。' : ''}（60-90字）

【賽前確認事項】
列出賽前需要確認的具體條件（首發、投手、賠率變動等）。（40-70字）

【SignalEdge 判斷】
${decisionContext}。（30-50字）`;
};
export const fallbackNarrative = (a) => {
  const db = a.dataBlock || a;
  const scores = db.topScores?.length ? `最可能比分參考：${db.topScores.slice(0,3).map(s=>`${s.score}(${s.probPct}%)`).join('、')}。` : '';
  return `【一句話結論】${db.home} vs ${db.away} 目前模型判斷為 ${db.decision}，首選觀察方向是 ${db.pickName}。\n【模型與市場】模型機率 ${db.modelHome}% / ${db.modelDraw ? db.modelDraw + '% / ' : ''}${db.modelAway}%，市場去水機率 ${db.marketHome}% / ${db.marketDraw ? db.marketDraw + '% / ' : ''}${db.marketAway}%。目前最佳價格差 EV ${db.ev}%、Edge ${db.edge}%。\n【資料完整度】資料完整度 ${db.dataCompleteness}/100，風險分數 ${db.risk}/100。${scores}\n【主要風險】臨場陣容、先發、版本或盤口變動可能改變判斷。\n【賽前確認】確認首發/投手/版本與賠率是否仍高於最低可參考價 ${db.minOdds || '—'}。\n【SignalEdge 判斷】此內容是價格與機率比較，不代表結果保證。`;
};

export default { buildAnalysisFromOddsEvent, buildPromptFromDataBlock, fallbackNarrative, SPORT_MAP };

