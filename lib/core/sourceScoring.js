const TIER_WEIGHT = { A: 1, 'A-': 0.92, 'B+': 0.84, B: 0.74, 'B-': 0.66, C: 0.5, Manual: 0.62, 'Manual-A': 0.82 };
const CONF_WEIGHT = { high: 1, medium: 0.72, low: 0.45, '未評級': 0.58, watch: 0.52 };
const STANCE_MAP = {
  lean_home: 'home', home: 'home', home_lean: 'home', 主隊: 'home',
  lean_away: 'away', away: 'away', away_lean: 'away', 客隊: 'away',
  lean_draw: 'draw', draw: 'draw', 平局: 'draw',
  over: 'over', under: 'under', wait: 'wait', watch: 'watch', neutral: 'watch', market_context: 'context', context: 'context',
};

export const normalizeStance = (stance = '') => STANCE_MAP[String(stance || '').trim().toLowerCase()] || 'watch';

export const scoreSource = (source = {}) => {
  const tier = TIER_WEIGHT[source.tier] ?? TIER_WEIGHT[String(source.tier || '').toUpperCase()] ?? 0.62;
  const base = Number(source.weight || tier || 0.62);
  return Math.max(0.1, Math.min(1, base));
};

export const freshnessScore = (publishedAt) => {
  if (!publishedAt) return 0.48;
  const hours = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
  if (!Number.isFinite(hours) || hours < 0) return 0.62;
  if (hours <= 12) return 1;
  if (hours <= 48) return 0.82;
  if (hours <= 168) return 0.65;
  if (hours <= 720) return 0.42;
  return 0.25;
};

export const scoreMasterItem = (item = {}, match = {}) => {
  const sourceScore = scoreSource(item.source || item.sourceMeta || item);
  const fresh = freshnessScore(item.publishedAt || item.addedAt || item.updatedAt);
  const confidence = CONF_WEIGHT[String(item.confidence || '未評級').toLowerCase()] || CONF_WEIGHT[item.confidence] || 0.58;
  const matchScore = Number(match.score ?? item.eventMatchScore ?? 0.35);
  const hasSummary = item.summaryZh || item.summary || item.excerpt || item.shortExcerpt ? 1 : 0.65;
  const score = (sourceScore * 0.32 + fresh * 0.18 + confidence * 0.18 + matchScore * 0.24 + hasSummary * 0.08) * 100;
  return Math.round(Math.max(1, Math.min(100, score)));
};

export const buildMasterConsensus = (items = []) => {
  const usable = items.filter(x => x?.usableInModel !== false);
  const buckets = { home: 0, away: 0, draw: 0, over: 0, under: 0, watch: 0, context: 0 };
  let weightTotal = 0;
  for (const item of usable) {
    const stance = normalizeStance(item.stance || item.direction);
    const rawWeight = Number(item.sourceWeight || item.sourceScore || item.masterScore || 50);
    const normalizedWeight = rawWeight > 1 ? rawWeight / 100 : rawWeight;
    const w = normalizedWeight * (Number(item.eventMatchScore || 0.5));
    buckets[stance] = (buckets[stance] || 0) + w;
    weightTotal += w;
  }
  const ranked = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
  const [topKey, topWeight] = ranked[0] || ['watch', 0];
  const [, secondWeight] = ranked[1] || ['watch', 0];
  const strength = weightTotal > 0 ? topWeight / weightTotal : 0;
  const conflict = weightTotal <= 0 ? 'none' : secondWeight / Math.max(0.01, topWeight) > 0.65 ? 'high' : secondWeight / Math.max(0.01, topWeight) > 0.35 ? 'medium' : 'low';
  return {
    totalSources: items.length,
    usableSources: usable.length,
    buckets: Object.fromEntries(Object.entries(buckets).map(([k,v]) => [k, Number(v.toFixed(2))])),
    consensusDirection: topWeight > 0 ? topKey : 'watch',
    consensusStrength: Number(strength.toFixed(2)),
    conflictLevel: conflict,
    highTierSources: usable.filter(x => /A/.test(String(x.sourceTier || x.tier || ''))).length,
    summary: usable.length
      ? (['watch', 'context'].includes(topKey)
        ? `${usable.length} 則可用國外分析大師/資料源觀點，目前偏向觀察/背景資訊，尚未形成明確方向；分歧 ${conflict}。`
        : `${usable.length} 則可用國外分析大師/資料源觀點，主要方向：${topKey}，一致度 ${Math.round(strength * 100)}%，分歧 ${conflict}。`)
      : '目前沒有足夠的國外分析大師觀點命中此賽事。',
  };
};

export default { normalizeStance, scoreSource, scoreMasterItem, buildMasterConsensus };
