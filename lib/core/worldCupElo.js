import { scoreMatrix } from './soccerPoisson.js';
import { getEloRating, isHostTeam, eloExpectedScore } from './eloRatings.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
const round = (n, d = 2) => Number.isFinite(Number(n)) ? +Number(n).toFixed(d) : 0;

const weighted = (a, b, wa, wb) => (Number(a || 0) * wa) + (Number(b || 0) * wb);
const normalize3 = ({ home = 0, draw = 0, away = 0 }) => {
  const total = Number(home || 0) + Number(draw || 0) + Number(away || 0) || 1;
  return { home: home / total, draw: draw / total, away: away / total };
};

export const expectedGoalsFromElo = ({ homeElo, awayElo, homeAdvantage = 0 } = {}) => {
  const diff = clamp((homeElo + homeAdvantage) - awayElo, -420, 420);
  const totalXg = clamp(2.55 + Math.abs(diff) / 900, 2.05, 3.1);
  const homeShare = clamp(0.5 + diff / 950, 0.25, 0.75);
  return {
    homeXg: round(totalXg * homeShare, 2),
    awayXg: round(totalXg * (1 - homeShare), 2),
    totalXg: round(totalXg, 2),
  };
};

export const worldCupEloModel = ({ homeTeam, awayTeam, market = {}, neutral = false } = {}) => {
  const homeElo = getEloRating(homeTeam);
  const awayElo = getEloRating(awayTeam);
  const homeAdvantage = neutral ? 0 : (isHostTeam(homeTeam) ? 28 : isHostTeam(awayTeam) ? -18 : 0);
  const xg = expectedGoalsFromElo({ homeElo, awayElo, homeAdvantage });
  const score = scoreMatrix({ homeXg: xg.homeXg, awayXg: xg.awayXg, dixonColes: true });
  const eloRaw = normalize3({ home: score.homeWin, draw: score.draw, away: score.awayWin });

  const hasMarket = Number(market.home) > 0 && Number(market.away) > 0;
  const marketRaw = normalize3({
    home: Number(market.home || 0),
    draw: Number(market.draw || 0),
    away: Number(market.away || 0),
  });

  const model = hasMarket
    ? normalize3({
        home: weighted(marketRaw.home, eloRaw.home, 0.58, 0.42),
        draw: weighted(marketRaw.draw || eloRaw.draw, eloRaw.draw, 0.58, 0.42),
        away: weighted(marketRaw.away, eloRaw.away, 0.58, 0.42),
      })
    : eloRaw;

  return {
    model,
    xg,
    score,
    method: hasMarket ? 'worldcup_market_elo_dc_blend_v6d' : 'worldcup_elo_dc_proxy_no_odds_v6d',
    elo: {
      home: homeElo,
      away: awayElo,
      diff: round(homeElo + homeAdvantage - awayElo, 0),
      homeAdvantage,
      homeExpectedScore: round(eloExpectedScore(homeElo, awayElo, homeAdvantage), 3),
    },
  };
};

export default { worldCupEloModel, expectedGoalsFromElo };
