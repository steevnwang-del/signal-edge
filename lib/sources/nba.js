/**
 * NBA 數據源（完全免費）
 * Ball Don't Lie API + ESPN unofficial
 * actions: searchPlayer, getPlayerStats, getGames, getTeamStats
 */
const BDL_BASE = 'https://api.balldontlie.io/v1';
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

export default {
  async searchPlayer({ name }, env) {
    const r = await fetch(`${BDL_BASE}/players?search=${encodeURIComponent(name)}&per_page=5`);
    const data = await r.json();
    return { players: data.data || [] };
  },

  async getPlayerStats({ playerId, season = 2024 }, env) {
    const r = await fetch(`${BDL_BASE}/season_averages?season=${season}&player_ids[]=${playerId}`);
    const data = await r.json();
    const stats = data.data?.[0];
    if (!stats) return null;
    return {
      stats,
      radar: [
        { label:'得分效率', value: Math.min(100,Math.round((stats.fg_pct||0.4)*200)), raw:`FG% ${((stats.fg_pct||0)*100).toFixed(1)}%` },
        { label:'進攻貢獻', value: Math.min(100,Math.round((stats.pts||15)*2.5)),     raw:`${(stats.pts||0).toFixed(1)} PPG` },
        { label:'防守貢獻', value: Math.min(100,Math.round((stats.stl||0.8)*50+(stats.blk||0.4)*30)), raw:`STL ${(stats.stl||0).toFixed(1)} BLK ${(stats.blk||0).toFixed(1)}` },
        { label:'籃板控制', value: Math.min(100,Math.round((stats.reb||5)*7)),        raw:`${(stats.reb||0).toFixed(1)} RPG` },
        { label:'傳球創造', value: Math.min(100,Math.round((stats.ast||3)*10)),       raw:`${(stats.ast||0).toFixed(1)} APG` },
        { label:'綜合效率', value: Math.min(100,Math.round(((stats.pts||0)+(stats.reb||0)+(stats.ast||0))*2)), raw:`PER估算` },
      ],
    };
  },

  async getGames({ date }, env) {
    const d = date || new Date().toISOString().split('T')[0];
    const r = await fetch(`${BDL_BASE}/games?dates[]=${d}&per_page=20`);
    const data = await r.json();
    return { games: data.data || [], date: d };
  },

  async getNews({}, env) {
    const r = await fetch(`${ESPN_BASE}/news`);
    const data = await r.json();
    return { articles: (data.articles || []).slice(0,10).map(a => ({ title: a.headline, url: a.links?.web?.href, time: a.published })) };
  },
};
