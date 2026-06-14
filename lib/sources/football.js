/**
 * 足球數據源
 * 整合 football-data.org + API-Football
 * actions: getMatches, getTeam, getPlayer, getStandings, getH2H
 */
const FD_BASE  = 'https://api.football-data.org/v4';
const APF_BASE = 'https://v3.football.api-sports.io';

const fdFetch = async (path, env) => {
  const r = await fetch(`${FD_BASE}${path}`, { headers: { 'X-Auth-Token': env.FOOTBALL_DATA_KEY } });
  return r.json();
};
const apfFetch = async (path, env) => {
  const r = await fetch(`${APF_BASE}${path}`, { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } });
  return r.json();
};

export default {
  // 取得指定聯賽近期賽事
  async getMatches({ competition = 'WC', status = 'SCHEDULED', limit = 10 }, env) {
    const data = await fdFetch(`/competitions/${competition}/matches?status=${status}&limit=${limit}`, env);
    return { matches: data.matches || [], competition };
  },

  // 隊伍資料
  async getTeam({ teamId }, env) {
    const [team, matches] = await Promise.all([
      fdFetch(`/teams/${teamId}`, env),
      fdFetch(`/teams/${teamId}/matches?limit=10&status=FINISHED`, env),
    ]);
    const recentMatches = matches.matches || [];
    const form = recentMatches.slice(0,5).map(m => {
      const isHome = m.homeTeam.id === teamId;
      const homeScore = m.score.fullTime.home;
      const awayScore = m.score.fullTime.away;
      if (isHome) return homeScore > awayScore ? 'W' : homeScore < awayScore ? 'L' : 'D';
      return awayScore > homeScore ? 'W' : awayScore < homeScore ? 'L' : 'D';
    });
    const goalsFor = recentMatches.reduce((s,m) => {
      const isHome = m.homeTeam.id === teamId;
      return s + (isHome ? m.score.fullTime.home : m.score.fullTime.away);
    }, 0);
    return {
      team,
      form: form.join(' '),
      recentMatches: recentMatches.length,
      avgGoalsFor: recentMatches.length ? +(goalsFor/recentMatches.length).toFixed(2) : 0,
    };
  },

  // 世界杯排名/積分榜
  async getStandings({ competition = 'WC' }, env) {
    const data = await fdFetch(`/competitions/${competition}/standings`, env);
    return { standings: data.standings || [] };
  },

  // 兩隊交鋒記錄
  async getH2H({ teamId1, teamId2, limit = 10 }, env) {
    const data = await apfFetch(`/fixtures/headtohead?h2h=${teamId1}-${teamId2}&last=${limit}`, env);
    return { h2h: data.response || [] };
  },

  // 選手搜尋
  async searchPlayer({ name, teamId }, env) {
    const query = teamId ? `&team=${teamId}` : '';
    const data = await apfFetch(`/players?search=${encodeURIComponent(name)}${query}`, env);
    return { players: (data.response || []).slice(0, 5) };
  },
};
