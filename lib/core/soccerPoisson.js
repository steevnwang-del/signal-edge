const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
const round = (n, d = 3) => +Number(n || 0).toFixed(d);

const factorial = (n) => n <= 1 ? 1 : Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a * b, 1);
const poisson = (lambda, k) => Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);

// A conservative xG proxy calibrated from market probabilities. It is not a team-stat model yet.
export const estimateXGFromMarket = ({ homeProb = 0.45, drawProb = 0.26, awayProb = 0.29 } = {}) => {
  const strength = clamp(homeProb - awayProb, -0.45, 0.45);
  const drawLift = clamp(drawProb - 0.25, -0.08, 0.12);
  const total = clamp(2.55 - drawLift * 2.5, 1.7, 3.4);
  const homeShare = clamp(0.5 + strength * 0.55, 0.25, 0.75);
  return {
    homeXg: round(total * homeShare, 2),
    awayXg: round(total * (1 - homeShare), 2),
    totalXg: round(total, 2),
  };
};

export const scoreMatrix = ({ homeXg = 1.35, awayXg = 1.05, maxGoals = 6, dixonColes = true } = {}) => {
  const rows = [];
  let totalMass = 0;
  for (let h = 0; h <= maxGoals; h += 1) {
    for (let a = 0; a <= maxGoals; a += 1) {
      let p = poisson(homeXg, h) * poisson(awayXg, a);
      if (dixonColes) {
        if (h === 0 && a === 0) p *= 1.06;
        if (h === 1 && a === 0) p *= 0.98;
        if (h === 0 && a === 1) p *= 0.98;
        if (h === 1 && a === 1) p *= 1.04;
      }
      rows.push({ home: h, away: a, prob: p });
      totalMass += p;
    }
  }
  const norm = rows.map(r => ({ ...r, prob: r.prob / totalMass }));
  const homeWin = norm.filter(r => r.home > r.away).reduce((s, r) => s + r.prob, 0);
  const draw = norm.filter(r => r.home === r.away).reduce((s, r) => s + r.prob, 0);
  const awayWin = norm.filter(r => r.home < r.away).reduce((s, r) => s + r.prob, 0);
  const over25 = norm.filter(r => r.home + r.away > 2.5).reduce((s, r) => s + r.prob, 0);
  const btts = norm.filter(r => r.home > 0 && r.away > 0).reduce((s, r) => s + r.prob, 0);
  const topScores = [...norm].sort((a, b) => b.prob - a.prob).slice(0, 5).map(r => ({ score: `${r.home}-${r.away}`, probPct: +(r.prob * 100).toFixed(1) }));
  return {
    homeWin, draw, awayWin, over25, under25: 1 - over25, btts, topScores,
    matrix: norm.map(r => ({ home: r.home, away: r.away, probPct: +(r.prob * 100).toFixed(2) })),
  };
};

export const soccerModelFromMarket = ({ marketHome = 0.45, marketDraw = 0.26, marketAway = 0.29 } = {}) => {
  const xg = estimateXGFromMarket({ homeProb: marketHome, drawProb: marketDraw, awayProb: marketAway });
  const sm = scoreMatrix(xg);
  // Blend market and Poisson proxy to avoid fake overconfidence.
  const home = marketHome * 0.62 + sm.homeWin * 0.38;
  const draw = marketDraw * 0.62 + sm.draw * 0.38;
  const away = marketAway * 0.62 + sm.awayWin * 0.38;
  const total = home + draw + away || 1;
  return {
    model: { home: home / total, draw: draw / total, away: away / total },
    xg,
    score: sm,
    method: 'market_calibrated_poisson_dc_proxy',
  };
};

export default { estimateXGFromMarket, scoreMatrix, soccerModelFromMarket };
