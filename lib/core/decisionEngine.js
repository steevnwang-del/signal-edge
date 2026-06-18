const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Number(n) || 0));
const round = (n, d = 0) => Number.isFinite(Number(n)) ? +Number(n).toFixed(d) : 0;

const DIR_LABEL = {
  home: '主隊方向',
  away: '客隊方向',
  draw: '平手方向',
  over: '大分方向',
  under: '小分方向',
  watch: '觀望',
  no_match: '待確認',
  no_odds: '等待賠率',
};

const SPORT_TERMS = {
  '世界杯': { lineup: '首發名單', context: 'Elo/Poisson、國外觀點與市場賠率', live: '賽前陣容與盤口' },
  '英超': { lineup: '首發名單', context: 'Elo/Poisson、國外觀點與市場賠率', live: '賽前陣容與盤口' },
  '歐冠': { lineup: '首發名單', context: 'Elo/Poisson、國外觀點與市場賠率', live: '賽前陣容與盤口' },
  '西甲': { lineup: '首發名單', context: 'Elo/Poisson、國外觀點與市場賠率', live: '賽前陣容與盤口' },
  '德甲': { lineup: '首發名單', context: 'Elo/Poisson、國外觀點與市場賠率', live: '賽前陣容與盤口' },
  '義甲': { lineup: '首發名單', context: 'Elo/Poisson、國外觀點與市場賠率', live: '賽前陣容與盤口' },
  '法甲': { lineup: '首發名單', context: 'Elo/Poisson、國外觀點與市場賠率', live: '賽前陣容與盤口' },
  'MSI 2026': { lineup: '版本 / BP / 選手狀態', context: '版本適應、戰隊節奏、國外電競觀點', live: '臨場 BP 與賠率' },
  'LOL 電競': { lineup: '版本 / BP / 選手狀態', context: '版本適應、戰隊節奏、國外電競觀點', live: '臨場 BP 與賠率' },
  'LCK': { lineup: '版本 / BP / 選手狀態', context: '版本適應、戰隊節奏、國外電競觀點', live: '臨場 BP 與賠率' },
  'LPL': { lineup: '版本 / BP / 選手狀態', context: '版本適應、戰隊節奏、國外電競觀點', live: '臨場 BP 與賠率' },
  'NBA': { lineup: '傷病 / 輪休 / 先發', context: '球隊節奏、進階數據、國外籃球觀點', live: '傷病與讓分變化' },
  'MLB': { lineup: '先發投手 / 牛棚 / 打線', context: '投打對位、牛棚消耗、國外棒球觀點', live: '先發投手與打線確認' },
  '網球': { lineup: '傷病 / 場地 / 賽程疲勞', context: '場地適性、發接發、國外網球觀點', live: '退賽風險與臨場狀態' },
  'F1': { lineup: '排位 / 長距離速度 / 天氣', context: '車隊速度、升級套件、天氣與賽道特性', live: '排位、天氣與安全車風險' },
};

const normalizeDir = (dir) => {
  const d = String(dir || '').toLowerCase();
  if (['home', 'away', 'draw', 'over', 'under'].includes(d)) return d;
  return 'watch';
};

const modelLeader = (db = {}) => {
  const list = [
    ['home', Number(db.modelHome || 0)],
    ['draw', Number(db.modelDraw || 0)],
    ['away', Number(db.modelAway || 0)],
  ].filter(([, v]) => v > 0);
  return list.sort((a, b) => b[1] - a[1])[0] || ['watch', 0];
};

const directionName = (db = {}, dir = 'watch') => {
  if (dir === 'home') return db.home || '主隊';
  if (dir === 'away') return db.away || '客隊';
  if (dir === 'draw') return '平手';
  return DIR_LABEL[dir] || '觀望';
};

const getTerms = (sport) => SPORT_TERMS[sport] || { lineup: '臨場資訊', context: '模型、情報與市場資料', live: '賽前資訊與盤口' };

const buildScores = (db = {}) => {
  const hasOdds = db.sourceCoverage?.odds === true;
  const [leaderDir, leaderProb] = modelLeader(db);
  const alignment = Number(db.signalFusion?.alignmentScore || db.signalAlignmentScore || 0);
  const quality = Number(db.contentQuality?.score || db.qualityScore || 0);
  const data = Number(db.dataCompleteness || 0);
  const risk = Number(db.risk || 0);
  const ev = Number(db.ev || 0);
  const edge = Number(db.edge || 0);
  const masterStrength = Number(db.foreignMasterConsensus?.consensusStrength || 0) * 100;
  const mastersUsable = Number(db.foreignMasterConsensus?.usableSources || 0);
  const conflictLevel = db.signalFusion?.conflictLevel || db.foreignMasterConsensus?.conflictLevel || 'none';
  const conflictPenalty = conflictLevel === 'high' ? 20 : conflictLevel === 'medium' ? 9 : 0;

  const probabilityScore = clamp(
    leaderProb * 0.46
    + alignment * 0.2
    + data * 0.14
    + (100 - risk) * 0.1
    + (mastersUsable ? Math.min(100, 42 + masterStrength * 0.45 + mastersUsable * 4) : 38) * 0.1
    - conflictPenalty * 0.45
  );

  const valueBase = hasOdds
    ? clamp(48 + ev * 5.2 + edge * 2.8, 0, 100)
    : 20;
  const valueScore = clamp(
    valueBase * 0.48
    + alignment * 0.18
    + quality * 0.16
    + data * 0.1
    + (100 - risk) * 0.08
    - conflictPenalty * 0.55
  );

  const riskScore = clamp(
    risk * 0.48
    + (100 - data) * 0.2
    + (100 - quality) * 0.12
    + conflictPenalty * 0.9
    + (!hasOdds ? 18 : 0)
    + (mastersUsable ? 0 : 5)
  );

  return {
    leaderDir,
    leaderProb: round(leaderProb, 1),
    probabilityScore: Math.round(probabilityScore),
    valueScore: Math.round(valueScore),
    riskScore: Math.round(riskScore),
    dataScore: Math.round(data),
    qualityScore: Math.round(quality),
    alignmentScore: Math.round(alignment),
  };
};

const classifySegment = ({ hasOdds, probabilityScore, valueScore, riskScore, dataScore, conflictLevel }) => {
  if (!hasOdds || dataScore < 45) return 'WAIT_FOR_DATA';
  if (riskScore >= 78 || conflictLevel === 'high') return 'HIGH_RISK_CONFLICT';
  if (probabilityScore >= 68 && valueScore < 68) return 'HIGH_PROBABILITY_LOW_RETURN';
  if (valueScore >= 72 && riskScore <= 68) return 'VALUE_EDGE';
  if (probabilityScore >= 68 && riskScore <= 65) return 'STABLE_OBSERVE';
  return 'BALANCED_WATCH';
};

const segmentLabel = (segment) => ({
  HIGH_PROBABILITY_LOW_RETURN: '高機率低報酬',
  VALUE_EDGE: '價值下注型',
  STABLE_OBSERVE: '穩健觀察型',
  BALANCED_WATCH: '一般觀察型',
  WAIT_FOR_DATA: '等待資料型',
  HIGH_RISK_CONFLICT: '高分歧高風險',
}[segment] || '一般觀察型');

const buildConditions = ({ db, leaderDir, segment, hasOdds }) => {
  const terms = getTerms(db.sport);
  const dir = directionName(db, leaderDir);
  const minOdds = db.minOdds || null;
  const bestOdds = db.bestOdds || null;
  const oddsText = minOdds ? `參考賠率最好維持在 ${minOdds} 以上` : '賠率需維持在模型可接受範圍';

  const entry = [];
  const avoid = [];
  const beginner = [];
  const advanced = [];

  if (hasOdds) {
    entry.push(`${dir} 的模型方向、國外情報與市場方向未出現重大反轉。`);
    entry.push(`${oddsText}；若目前賠率已明顯低於參考價，降低出手等級。`);
  } else {
    entry.push('等待 H2H 賠率出現後，重新計算 fair odds、EV 與 Edge。');
  }

  entry.push(`${terms.live} 沒有出現重大負面變化。`);
  entry.push(`資料完整度維持在目前水準或更高，且主要缺口不影響 ${terms.context}。`);

  if (segment === 'HIGH_PROBABILITY_LOW_RETURN') {
    beginner.push(`本場偏向「命中率優先」：${dir} 的勝率穩定分較高，但報酬不漂亮，適合保守玩家小注參考。`);
    advanced.push('價值分數不算突出，進階玩家不宜為了熱門方向追低賠率。');
  } else if (segment === 'VALUE_EDGE') {
    beginner.push('本場雖有價值訊號，但波動可能高於純熱門盤，新手需降低注碼與期待。');
    advanced.push('價值分數較高，可優先檢查價格是否仍高於最低參考價。');
  } else if (segment === 'STABLE_OBSERVE') {
    beginner.push(`本場屬於可觀察方向：${dir} 較有機會，但仍需等臨場資訊確認。`);
    advanced.push('若價格改善或國外情報共識升高，可重新評估是否升級。');
  } else if (segment === 'HIGH_RISK_CONFLICT') {
    beginner.push('本場分歧與風險偏高，不適合新手用「穩」的邏輯去追。');
    advanced.push('除非價格明顯補償風險，否則以觀察與等待為主。');
  } else {
    beginner.push('本場目前不屬於明確高機率場，建議先看情報更新。');
    advanced.push('價值訊號尚未集中，等待賠率、情報或模型方向更一致。');
  }

  avoid.push(`${terms.lineup} 與目前假設不一致，或出現核心缺席 / 重大輪換 / 版本反向訊號。`);
  avoid.push(hasOdds ? '賠率被市場壓到明顯低於最低參考價，代表報酬已被吃掉。' : '賠率長時間缺失，無法計算下注價值。');
  avoid.push('國外高權重來源出現明確反方觀點，且與模型或市場同時衝突。');
  avoid.push('資料完整度下降、新聞風險升高，或盤口短時間劇烈變動。');

  return {
    entryConditions: entry.slice(0, 5),
    avoidConditions: avoid.slice(0, 5),
    beginnerNotes: beginner,
    advancedNotes: advanced,
    priceNote: hasOdds
      ? `目前最佳賠率 ${bestOdds || '未提供'}；最低參考價 ${minOdds || '未提供'}。高機率場不等於高報酬，若價格被壓低，仍需降低注碼或等待。`
      : '目前沒有賠率，不產生 EV 或最低參考價，只能做情報觀察。',
  };
};

export const buildDecisionEngine = (db = {}) => {
  const hasOdds = db.sourceCoverage?.odds === true;
  const scores = buildScores(db);
  const conflictLevel = db.signalFusion?.conflictLevel || db.foreignMasterConsensus?.conflictLevel || 'none';
  const segment = classifySegment({
    hasOdds,
    probabilityScore: scores.probabilityScore,
    valueScore: scores.valueScore,
    riskScore: scores.riskScore,
    dataScore: scores.dataScore,
    conflictLevel,
  });
  const direction = scores.leaderDir === 'watch' ? normalizeDir(db.bestRole) : scores.leaderDir;
  const directionLabel = directionName(db, direction);
  const conditions = buildConditions({ db, leaderDir: direction, segment, hasOdds });

  const beginner = (() => {
    if (!hasOdds || segment === 'WAIT_FOR_DATA') return { status: 'WAIT', label: '等待資料', suitability: '不急著出手', note: '賠率或核心資料不足，先看情報整理。' };
    if (segment === 'HIGH_RISK_CONFLICT') return { status: 'AVOID', label: '不適合新手', suitability: '高風險', note: '訊號分歧或風險過高，不適合用高機率邏輯追。' };
    if (segment === 'HIGH_PROBABILITY_LOW_RETURN') return { status: 'BEGINNER_OK', label: '新手可小注參考', suitability: '高機率低報酬', note: `${directionLabel} 屬於高機率方向，但報酬偏低，不宜重注。` };
    if (segment === 'STABLE_OBSERVE') return { status: 'BEGINNER_WATCH', label: '保守觀察', suitability: '中等穩定', note: `${directionLabel} 可列入觀察，但仍需賽前確認。` };
    if (segment === 'VALUE_EDGE') return { status: 'CAUTION', label: '有價值但需控風險', suitability: '進階較適合', note: '價值訊號較強，但不一定是最穩的熱門方向。' };
    return { status: 'WAIT', label: '觀察即可', suitability: '普通', note: '目前沒有形成明確高機率優勢。' };
  })();

  const advanced = (() => {
    if (!hasOdds) return { status: 'NO_VALUE_CALC', label: '無法計算價值', note: '沒有賠率，暫不計算 EV。' };
    if (segment === 'VALUE_EDGE') return { status: 'VALUE_BET', label: '價值下注成立', note: '價格、模型與情報訊號相對集中。' };
    if (segment === 'HIGH_PROBABILITY_LOW_RETURN') return { status: 'LOW_VALUE', label: '方向穩但價值有限', note: '適合看勝率，不適合用高 EV 邏輯重倉。' };
    if (segment === 'HIGH_RISK_CONFLICT') return { status: 'RISK_OFF', label: '高風險不建議', note: '分歧與風險高，除非價格大幅補償。' };
    return { status: 'WATCH_PRICE', label: '等待更好價格', note: '方向或價格尚未達到高價值門檻。' };
  })();

  const tags = [segmentLabel(segment)];
  if (scores.probabilityScore >= 68) tags.push('高機率方向');
  if (scores.valueScore >= 72) tags.push('價格有價值');
  if (scores.riskScore >= 70) tags.push('高風險');
  if (hasOdds && Number(db.ev || 0) <= 0 && scores.probabilityScore >= 72) tags.push('勝率高但賠率差');
  if (!hasOdds) tags.push('等待賠率');

  return {
    version: 'v6g-decision-engine',
    segment,
    segmentLabel: segmentLabel(segment),
    recommendedDirection: direction,
    recommendedName: directionLabel,
    probabilityScore: scores.probabilityScore,
    valueScore: scores.valueScore,
    riskScore: scores.riskScore,
    dataScore: scores.dataScore,
    qualityScore: scores.qualityScore,
    alignmentScore: scores.alignmentScore,
    leaderProb: scores.leaderProb,
    beginnerLane: beginner,
    advancedLane: advanced,
    conditions,
    tags: [...new Set(tags)],
    summary: `本場屬於「${segmentLabel(segment)}」：${beginner.note} ${advanced.note}`,
  };
};

export default { buildDecisionEngine };
