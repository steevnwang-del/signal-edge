import { normalizeStance } from './sourceScoring.js';

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Number(n) || 0));

const modelDirection = (db = {}) => {
  const vals = [
    ['home', Number(db.modelHome || 0)],
    ['draw', Number(db.modelDraw || 0)],
    ['away', Number(db.modelAway || 0)],
  ].filter(([,v]) => v > 0);
  return vals.sort((a,b)=>b[1]-a[1])[0]?.[0] || 'watch';
};

const marketDirection = (db = {}) => {
  const vals = [
    ['home', Number(db.marketHome || 0)],
    ['draw', Number(db.marketDraw || 0)],
    ['away', Number(db.marketAway || 0)],
  ].filter(([,v]) => v > 0);
  return vals.sort((a,b)=>b[1]-a[1])[0]?.[0] || 'watch';
};

const dirAgree = (a, b) => a && b && !['watch','context','none'].includes(a) && a === b;

export const buildSignalFusion = (db = {}) => {
  const modelDir = modelDirection(db);
  const marketDir = marketDirection(db);
  const bestDir = db.bestRole || 'watch';
  const masterDir = normalizeStance(db.foreignMasterConsensus?.consensusDirection || 'watch');
  const hasOdds = db.sourceCoverage?.odds === true;
  const hasMasters = Number(db.foreignMasterConsensus?.usableSources || 0) > 0;
  const evPositive = Number(db.ev || 0) > 0;
  const edgePositive = Number(db.edge || 0) > 0;
  const signals = [
    { id: 'model', label: 'SignalEdge 模型', direction: modelDir, active: true, weight: 0.28 },
    { id: 'market', label: '市場去水', direction: marketDir, active: hasOdds, weight: 0.18 },
    { id: 'value', label: 'EV/Edge', direction: evPositive || edgePositive ? bestDir : 'watch', active: hasOdds, weight: 0.22 },
    { id: 'masters', label: '國外分析大師', direction: masterDir, active: hasMasters, weight: 0.2 },
    { id: 'news', label: '國際新聞風險', direction: db.internationalInsights?.length ? 'context' : 'watch', active: Boolean(db.internationalInsights?.length), weight: 0.12 },
  ];
  // Use EV best direction only when it is actually positive.
  // If all EV values are negative, the least-bad price must not override the model direction.
  const referenceDir = hasOdds && evPositive && bestDir && bestDir !== 'watch' ? bestDir : modelDir;
  const activeSignals = signals.filter(s => s.active);
  const alignedWeight = activeSignals.reduce((sum, s) => sum + (dirAgree(s.direction, referenceDir) ? s.weight : s.direction === 'context' ? s.weight * 0.45 : 0), 0);
  const possibleWeight = activeSignals.reduce((sum, s) => sum + s.weight, 0) || 1;
  const alignmentScore = clamp((alignedWeight / possibleWeight) * 100, 0, 100);
  const conflictSignals = activeSignals.filter(s => !dirAgree(s.direction, referenceDir) && !['watch','context'].includes(s.direction));
  const tags = [];
  if (alignmentScore >= 78) tags.push('訊號一致');
  if (hasMasters) tags.push('大師命中');
  if (db.foreignMasterConsensus?.conflictLevel === 'high') tags.push('大師分歧');
  if (hasOdds && Number(db.ev || 0) > 2) tags.push('正EV');
  if (hasOdds && Number(db.ev || 0) <= 0) tags.push('價值不足');
  if (Number(db.dataCompleteness || 0) < 60) tags.push('資料不足');
  if (Number(db.risk || 0) >= 70) tags.push('高風險');
  if (!hasOdds) tags.push('等待賠率');

  const qualityScore = clamp(
    Number(db.dataCompleteness || 0) * 0.34
    + alignmentScore * 0.28
    + (100 - Number(db.risk || 0)) * 0.18
    + (hasMasters ? Math.min(100, 45 + Number(db.foreignMasterConsensus?.usableSources || 0) * 10) : 35) * 0.12
    + (db.internationalInsights?.length ? 75 : 45) * 0.08
  );

  return {
    referenceDirection: referenceDir,
    modelDirection: modelDir,
    marketDirection: hasOdds ? marketDir : 'no_odds',
    valueDirection: hasOdds && (evPositive || edgePositive) ? bestDir : 'watch',
    foreignMastersDirection: hasMasters ? masterDir : 'no_match',
    alignmentScore: Math.round(alignmentScore),
    qualityScore: Math.round(qualityScore),
    conflictLevel: conflictSignals.length >= 2 ? 'high' : conflictSignals.length === 1 ? 'medium' : 'low',
    conflictSignals,
    signals,
    tags: [...new Set(tags)].slice(0, 8),
    verdict: qualityScore >= 78 ? '研究價值高' : qualityScore >= 62 ? '可觀察' : '資料仍需補強',
  };
};

export default { buildSignalFusion };
