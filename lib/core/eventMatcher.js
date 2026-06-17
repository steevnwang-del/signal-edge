import { normalizeSportFamily } from '../sources/foreignMastersDirectory.js';

const ALIASES = {
  'usa': ['united states', 'usmnt', 'u.s.', 'u s a'],
  'united states': ['usa', 'usmnt', 'u.s.', 'u s a'],
  'south korea': ['korea republic', 'korea', 'kor'],
  'czechia': ['czech republic'],
  'ivory coast': ['cote d ivoire', "côte d'ivoire"],
  'dr congo': ['congo dr', 'drc', 'democratic republic of congo'],
  't1': ['sk telecom t1', 'skt', 'skt t1'],
  'gen.g': ['geng', 'gen g', 'gen-g'],
  'blg': ['bilibili gaming'],
  'g2 esports': ['g2'],
  'f1': ['formula 1', 'formula one'],
};

export const normalizeText = (value = '') => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[🇦-🇿🏴]/gu, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-zA-Z0-9. ]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const expandAliases = (term = '') => {
  const n = normalizeText(term);
  const arr = [n, ...(ALIASES[n] || [])].filter(Boolean).map(normalizeText);
  return [...new Set(arr)];
};

export const eventTerms = (event = {}) => {
  const raw = [event.home_team, event.away_team, event.homeEn, event.awayEn, event.sport_title, event.sport_key, event.league, event.sport].filter(Boolean);
  const base = raw.flatMap(expandAliases);
  const tokens = raw.flatMap(v => normalizeText(v).split(' ').filter(t => t.length >= 3));
  return [...new Set([...base, ...tokens].filter(t => t.length >= 2))];
};

export const textHasTerm = (text = '', term = '') => {
  const hay = normalizeText(text);
  const needle = normalizeText(term);
  if (!needle) return false;
  if (needle.length <= 3) return hay.split(' ').includes(needle);
  return hay.includes(needle);
};

export const detectSportFamilyFromText = (text = '', fallback = '綜合') => {
  const hay = normalizeText(text);
  if (/world cup|fifa|premier league|champions league|la liga|bundesliga|serie a|ligue 1|soccer|football/.test(hay)) return '足球';
  if (/league of legends|\blol\b|msi|worlds|lck|lpl|lec|lcs|esports/.test(hay)) return 'LOL';
  if (/\bnba\b|basketball|hoops/.test(hay)) return 'NBA';
  if (/\bmlb\b|baseball|pitcher|bullpen|statcast/.test(hay)) return 'MLB';
  if (/tennis|\batp\b|\bwta\b|grand slam|wimbledon|roland garros|us open|australian open/.test(hay)) return '網球';
  if (/formula 1|formula one|\bf1\b|grand prix|qualifying|race strategy|paddock/.test(hay)) return 'F1';
  return normalizeSportFamily(fallback);
};

export const matchTextToEvent = (item = {}, event = {}) => {
  const itemText = [item.title, item.titleZh, item.summary, item.summaryZh, item.excerpt, item.shortExcerpt, item.sourceName, item.sourceLabel, item.brand, item.sport, item.eventKeywords?.join?.(' '), item.teams?.join?.(' ')]
    .filter(Boolean)
    .join(' ');
  const hay = normalizeText(itemText);
  const terms = eventTerms(event);
  const matchedTerms = terms.filter(t => textHasTerm(hay, t));
  const itemSport = detectSportFamilyFromText(itemText, item.sport || '綜合');
  const eventSport = detectSportFamilyFromText([event.sport, event.sport_title, event.sport_key].filter(Boolean).join(' '), event.sport || '綜合');
  const sportMatch = itemSport === eventSport || itemSport === normalizeSportFamily(event.sport) || eventSport === normalizeSportFamily(item.sport);
  const keywordScore = Math.min(0.65, matchedTerms.length * 0.22);
  const sportScore = sportMatch ? 0.25 : 0;
  const exactTeams = [event.home_team, event.away_team].filter(Boolean).map(normalizeText).filter(t => matchedTerms.includes(t)).length;
  const directScore = exactTeams >= 2 ? 0.2 : exactTeams === 1 ? 0.08 : 0;
  const score = Math.min(1, keywordScore + sportScore + directScore);
  return {
    score: Number(score.toFixed(2)),
    sportMatch,
    itemSport,
    eventSport,
    matchedTerms: matchedTerms.slice(0, 8),
    usable: score >= 0.33 || (sportMatch && matchedTerms.length >= 1),
  };
};

export default { normalizeText, eventTerms, detectSportFamilyFromText, matchTextToEvent };
