/**
 * MLB 官方數據（完全免費）
 * 透過 /api/gateway server-side 呼叫，避免前端 CORS / 不穩定問題。
 */
const BASE = 'https://statsapi.mlb.com/api/v1';

const safeJson = async (r) => {
  const text = await r.text();
  try { return JSON.parse(text); }
  catch { throw new Error(text.slice(0, 160) || `HTTP ${r.status}`); }
};

const fetchJson = async (url, ms = 9000) => {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(new Error('MLB request timeout')), ms);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { 'Accept': 'application/json, text/plain, */*', 'User-Agent': 'SignalEdge/1.0' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await safeJson(r);
  } finally { clearTimeout(timer); }
};

const normalizeTeam = (t) => ({
  id: `mlb-${t.id}`,
  mlbId: String(t.id),
  name: t.name,
  en: t.name,
  abbr: t.abbreviation || t.teamCode || '',
  lg: t.league?.name || '',
  div: t.division?.name || '',
  sport: 'MLB',
  flag: '',
  color: '#002D62',
  players: [],
});

export default {
  async getTeams({ season }, env) {
    const y = season || new Date().getFullYear();
    const data = await fetchJson(`${BASE}/teams?sportId=1&season=${y}`);
    return {
      teams: (data.teams || []).filter(t => t.active).map(normalizeTeam),
      season: y,
      source: 'mlb-stats-server',
    };
  },

  async getTeamRoster({ teamId, season }, env) {
    if (!teamId) return { players: [] };
    const id = String(teamId).replace('mlb-', '');
    const y = season || new Date().getFullYear();
    const data = await fetchJson(`${BASE}/teams/${id}/roster?season=${y}&rosterType=active`);
    return {
      players: (data.roster || []).slice(0, 20).map(p => ({
        n: p.person?.fullName || '',
        pos: p.position?.abbreviation || p.position?.name || '',
        no: Number(p.jerseyNumber || 0) || 0,
        star: false,
      })).filter(p => p.n),
      teamId: id,
      season: y,
      source: 'mlb-stats-server',
    };
  },

  async getSchedule({ date, teamId }, env) {
    const d = date || new Date().toISOString().split('T')[0];
    const team = teamId ? `&teamId=${teamId}` : '';
    const data = await fetchJson(`${BASE}/schedule?sportId=1&date=${d}${team}&hydrate=team,linescore`);
    return { games: data.dates?.[0]?.games || [], date: d };
  },

  async getPlayer({ name }, env) {
    const data = await fetchJson(`${BASE}/people/search?names=${encodeURIComponent(name)}&sportId=1`);
    return { players: data.people || [] };
  },

  async getTeamStats({ teamId, season = 2024 }, env) {
    const data = await fetchJson(`${BASE}/teams/${teamId}/stats?stats=season&season=${season}&group=hitting,pitching`);
    return { stats: data.stats || [], teamId };
  },
};
