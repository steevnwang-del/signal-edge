/**
 * SignalEdge V6D Elo seed table.
 *
 * Transparent, static priors used only when official odds / external predictors are
 * incomplete. Ratings are intentionally conservative and should be maintained by
 * admins as newer team data becomes available.
 */

const strip = (value = '') => String(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[🇦-🇿🏴]/gu, '')
  .replace(/[^a-zA-Z0-9 ]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

export const TEAM_ELO_RATINGS = {
  argentina: 2100,
  spain: 2060,
  france: 2050,
  brazil: 2035,
  england: 2025,
  portugal: 2015,
  netherlands: 1995,
  germany: 1985,
  uruguay: 1970,
  colombia: 1955,
  belgium: 1940,
  croatia: 1925,
  morocco: 1915,
  italy: 1910,
  switzerland: 1900,
  japan: 1885,
  denmark: 1875,
  austria: 1870,
  mexico: 1855,
  usa: 1845,
  'united states': 1845,
  senegal: 1840,
  ecuador: 1835,
  iran: 1825,
  serbia: 1820,
  norway: 1815,
  sweden: 1810,
  poland: 1805,
  turkey: 1800,
  canada: 1785,
  australia: 1775,
  southkorea: 1770,
  'south korea': 1770,
  egypt: 1765,
  algeria: 1760,
  tunisia: 1745,
  paraguay: 1740,
  chile: 1735,
  nigeria: 1730,
  ghana: 1725,
  ivorycoast: 1720,
  'ivory coast': 1720,
  cameroon: 1715,
  qatar: 1690,
  saudiarabia: 1685,
  'saudi arabia': 1685,
  southafrica: 1680,
  'south africa': 1680,
  panama: 1675,
  costarica: 1670,
  'costa rica': 1670,
  venezuela: 1665,
  iraq: 1660,
  uzbekistan: 1655,
  jordan: 1645,
  newzealand: 1635,
  'new zealand': 1635,
  haiti: 1625,
  capeverde: 1620,
  'cape verde': 1620,
  curacao: 1615,
  scotland: 1810,
  czechia: 1790,
  bosniaandherzegovina: 1760,
  'bosnia and herzegovina': 1760,
  drcongo: 1705,
  'dr congo': 1705,
  democraticrepublicofcongo: 1705,
};

export const TEAM_ALIASES = {
  usmnt: 'united states',
  america: 'united states',
  usa: 'united states',
  'u s a': 'united states',
  korea: 'south korea',
  republicofkorea: 'south korea',
  'republic of korea': 'south korea',
  ksa: 'saudi arabia',
  saudis: 'saudi arabia',
  holland: 'netherlands',
  coteivoire: 'ivory coast',
  'cote d ivoire': 'ivory coast',
  drc: 'dr congo',
  congodr: 'dr congo',
  'congo dr': 'dr congo',
  nz: 'new zealand',
};

export const HOST_TEAMS_2026 = new Set(['united states', 'usa', 'mexico', 'canada']);

export const normalizeTeamName = (name = '') => {
  const s = strip(name);
  const joined = s.replace(/ /g, '');
  return TEAM_ALIASES[s] || TEAM_ALIASES[joined] || s;
};

export const getEloRating = (name = '', fallback = 1750) => {
  const key = normalizeTeamName(name);
  const compact = key.replace(/ /g, '');
  return TEAM_ELO_RATINGS[key] ?? TEAM_ELO_RATINGS[compact] ?? fallback;
};

export const isHostTeam = (name = '') => HOST_TEAMS_2026.has(normalizeTeamName(name));

export const eloExpectedScore = (teamElo, opponentElo, adjustment = 0) => {
  const diff = Number(teamElo || 0) + Number(adjustment || 0) - Number(opponentElo || 0);
  return 1 / (1 + Math.pow(10, -diff / 400));
};

export default {
  TEAM_ELO_RATINGS,
  TEAM_ALIASES,
  HOST_TEAMS_2026,
  normalizeTeamName,
  getEloRating,
  isHostTeam,
  eloExpectedScore,
};
