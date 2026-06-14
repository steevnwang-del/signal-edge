/**
 * MLB 官方數據（完全免費）
 * actions: getSchedule, getPlayer, getTeamStats
 */
const BASE = 'https://statsapi.mlb.com/api/v1';

export default {
  async getSchedule({ date, teamId }, env) {
    const d = date || new Date().toISOString().split('T')[0];
    const team = teamId ? `&teamId=${teamId}` : '';
    const r = await fetch(`${BASE}/schedule?sportId=1&date=${d}${team}&hydrate=team,linescore`);
    const data = await r.json();
    return { games: data.dates?.[0]?.games || [], date: d };
  },

  async getPlayer({ name }, env) {
    const r = await fetch(`${BASE}/people/search?names=${encodeURIComponent(name)}&sportId=1`);
    const data = await r.json();
    return { players: data.people || [] };
  },

  async getTeamStats({ teamId, season = 2024 }, env) {
    const r = await fetch(`${BASE}/teams/${teamId}/stats?stats=season&season=${season}&group=hitting,pitching`);
    const data = await r.json();
    return { stats: data.stats || [], teamId };
  },
};
