import { decimalEV, minPlayableOdds, pct, chooseBestValue } from './oddsMath.js';

const round = (n, d = 1) => +Number(n || 0).toFixed(d);

export const enrichOutcomesWithEV = (marketRows = [], modelMap = {}) => marketRows.map(row => {
  const key = row.role || row.name;
  const modelProb = Number(modelMap[key] ?? modelMap[row.name] ?? row.marketProb ?? 0);
  const ev = decimalEV(modelProb, row.price);
  const edge = modelProb - Number(row.marketProb || 0);
  return {
    ...row,
    modelProb,
    modelProbPct: pct(modelProb, 1),
    edge,
    edgePct: round(edge * 100, 1),
    ev,
    evPct: round(ev * 100, 1),
    minOdds: minPlayableOdds(modelProb, 0.02),
  };
});

export const classifyDecision = ({ evPct = 0, edgePct = 0, dataCompleteness = 50, risk = 50 } = {}) => {
  if (dataCompleteness < 55 || risk > 72) return evPct > 0 ? 'WAIT' : 'NO_BET';
  if (evPct > 6 && edgePct > 3 && dataCompleteness >= 72 && risk < 65) return 'BET';
  if (evPct > 2.5 && edgePct > 1.5 && dataCompleteness >= 60) return 'LEAN';
  if (evPct <= 0) return 'NO_BET';
  return 'WAIT';
};

export const evaluateMarket = ({ marketRows = [], modelMap = {}, dataCompleteness = 60, risk = 50 } = {}) => {
  const rows = enrichOutcomesWithEV(marketRows, modelMap);
  const best = chooseBestValue(rows) || rows[0] || null;
  const decision = best ? classifyDecision({ evPct: best.evPct, edgePct: best.edgePct, dataCompleteness, risk }) : 'WAIT';
  return { rows, best, decision };
};

export default { enrichOutcomesWithEV, classifyDecision, evaluateMarket };
