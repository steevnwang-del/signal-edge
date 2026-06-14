// NBA 數據 - ESPN Unofficial API（完全免費，不需要key）
// Ball Don't Lie 從2024年起需要key，改用更穩定的ESPN unofficial
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
const ESPN_STATS = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba';
const BDL = 'https://api.balldontlie.io/v1';

export default {
  async getGames({ date }, env) {
    const d = date || new Date().toISOString().split('T')[0];
    try {
      const r = await fetch(`${ESPN}/scoreboard?dates=${d.replace(/-/g,'')}`);
      const data = await r.json();
      const games = (data.events || []).map(ev => ({
        id: ev.id, date: d,
        home: ev.competitions?.[0]?.competitors?.find(c=>c.homeAway==='home')?.team?.displayName,
        away: ev.competitions?.[0]?.competitors?.find(c=>c.homeAway==='away')?.team?.displayName,
        status: ev.status?.type?.description,
        score: ev.competitions?.[0]?.competitors?.map(c=>({ team:c.team?.displayName, score:c.score })),
      }));
      return { games, source: 'espn', date: d };
    } catch(e) {
      return { games: [], error: e.message };
    }
  },

  async searchPlayer({ name }, env) {
    try {
      // 嘗試 BDL（如果有key更好）
      const headers = env.BDL_API_KEY ? { 'Authorization': env.BDL_API_KEY } : {};
      const r = await fetch(`${BDL}/players?search=${encodeURIComponent(name)}&per_page=5`, { headers });
      if (r.ok) {
        const data = await r.json();
        return { players: data.data || [], source: 'balldontlie' };
      }
    } catch {}
    // Fallback: ESPN 搜尋
    try {
      const r = await fetch(`${ESPN_STATS}/athletes?limit=10&active=true&search=${encodeURIComponent(name)}`);
      const data = await r.json();
      const athletes = (data.athletes || []).map(a => ({
        id: a.id, first_name: a.firstName, last_name: a.lastName,
        position: a.position?.abbreviation,
        team: { full_name: a.team?.displayName, abbreviation: a.team?.abbreviation },
      }));
      return { players: athletes, source: 'espn' };
    } catch(e) {
      return { players: [], error: e.message };
    }
  },

  async getPlayerStats({ playerId, season = 2024 }, env) {
    try {
      const headers = env.BDL_API_KEY ? { 'Authorization': env.BDL_API_KEY } : {};
      const r = await fetch(`${BDL}/season_averages?season=${season}&player_ids[]=${playerId}`, { headers });
      if (r.ok) {
        const data = await r.json();
        return { stats: data.data?.[0] || null, source: 'balldontlie' };
      }
    } catch {}
    return { stats: null, note: '需要 BDL_API_KEY 取得詳細統計。請至 balldontlie.io 免費註冊取得 key' };
  },

  async getNews({}, env) {
    try {
      const r = await fetch(`${ESPN}/news`);
      const data = await r.json();
      return {
        articles: (data.articles || []).slice(0,10).map(a => ({
          title: a.headline, url: a.links?.web?.href, time: a.published,
        })),
        source: 'espn'
      };
    } catch(e) {
      return { articles: [], error: e.message };
    }
  },
};
