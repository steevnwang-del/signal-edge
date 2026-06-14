const poisson = (lambda, k) => {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let r = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) r *= lambda / i;
  return r;
};

export const predictScores = (homeLambda, awayLambda) => {
  const MAX = 5;
  const matrix = [];
  for (let h = 0; h <= MAX; h++) {
    for (let a = 0; a <= MAX; a++) {
      const prob = poisson(homeLambda, h) * poisson(awayLambda, a);
      if (prob > 0.0005) matrix.push({ home: h, away: a, prob });
    }
  }
  matrix.sort((a, b) => b.prob - a.prob);
  const pct = (arr) => Math.round(arr.reduce((s, x) => s + x.prob, 0) * 1000) / 10;
  return {
    topScores: matrix.slice(0, 5).map(s => ({ ...s, prob: Math.round(s.prob * 1000) / 10 })),
    homeWin: pct(matrix.filter(s => s.home > s.away)),
    draw:    pct(matrix.filter(s => s.home === s.away)),
    awayWin: pct(matrix.filter(s => s.home < s.away)),
  };
};
