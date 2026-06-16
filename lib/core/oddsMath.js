/**
 * SignalEdge V6B odds math core.
 * Pure functions only. No network calls, no AI.
 */
const round = (n, d = 2) => Number.isFinite(Number(n)) ? +Number(n).toFixed(d) : 0;

export const impliedProbability = (decimalOdds) => {
  const o = Number(decimalOdds);
  return o > 1 ? 1 / o : 0;
};

export const safeDecimal = (odds, fallback = null) => {
  const n = Number(odds);
  return Number.isFinite(n) && n > 1 ? n : fallback;
};

export const normalizeOutcomes = (outcomes = []) => outcomes
  .filter(o => o && o.name && safeDecimal(o.price))
  .map(o => ({ name: String(o.name), price: safeDecimal(o.price), raw: o }));

export const noVigProbabilities = (outcomes = []) => {
  const rows = normalizeOutcomes(outcomes);
  const implied = rows.map(o => ({ ...o, implied: impliedProbability(o.price) }));
  const total = implied.reduce((s, o) => s + o.implied, 0);
  if (!rows.length || total <= 0) return { outcomes: [], overround: 0, totalImplied: 0 };
  return {
    outcomes: implied.map(o => ({
      ...o,
      marketProb: o.implied / total,
      marketProbPct: round((o.implied / total) * 100, 1),
      impliedPct: round(o.implied * 100, 1),
      fairOdds: round(1 / (o.implied / total), 2),
    })),
    overround: round((total - 1) * 100, 2),
    totalImplied: round(total * 100, 2),
  };
};

export const decimalEV = (modelProb, decimalOdds) => {
  const p = Number(modelProb);
  const o = Number(decimalOdds);
  if (!Number.isFinite(p) || !Number.isFinite(o) || p <= 0 || o <= 1) return 0;
  return p * o - 1;
};

export const pct = (fraction, digits = 1) => round(Number(fraction || 0) * 100, digits);

export const minPlayableOdds = (modelProb, minEv = 0.02) => {
  const p = Number(modelProb);
  if (!Number.isFinite(p) || p <= 0) return null;
  return round((1 + Number(minEv || 0)) / p, 2);
};

export const outcomeByName = (rows = [], name = '') => rows.find(o => String(o.name).toLowerCase() === String(name).toLowerCase()) || null;

export const chooseBestValue = (rows = []) => {
  const candidates = rows.filter(r => Number.isFinite(r.evPct));
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => (b.evPct - a.evPct) || (b.edgePct - a.edgePct))[0];
};

export default {
  impliedProbability,
  safeDecimal,
  normalizeOutcomes,
  noVigProbabilities,
  decimalEV,
  pct,
  minPlayableOdds,
  outcomeByName,
  chooseBestValue,
};
