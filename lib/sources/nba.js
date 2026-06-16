// NBA 數據 - ESPN Unofficial API（server-side via /api/gateway）
// 注意：site.api.espn.com 不允許瀏覽器直接跨網域 fetch，所以前端 TeamAnalysis 必須走 gateway。

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
const ESPN_STATS = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba';
const BDL = 'https://api.balldontlie.io/v1';

const safeJson = async (r) => {
  const text = await r.text();
  try { return JSON.parse(text); }
  catch { throw new Error(text.slice(0, 160) || `HTTP ${r.status}`); }
};

const fetchJson = async (url, ms = 9000) => {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(new Error('ESPN request timeout')), ms);
  try {
    const r = await fetch(url, {
      signal: ac.signal,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'SignalEdge/1.0 (+https://signal-edge-hews.vercel.app)',
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await safeJson(r);
  } finally {
    clearTimeout(timer);
  }
};

const normalizeTeam = (raw) => {
  const t = raw.team || raw;
  const color = t.color ? `#${String(t.color).replace('#', '')}` : '#0F3460';
  return {
    id: `nba-${t.id}`,
    espnId: String(t.id),
    name: t.displayName || t.name,
    en: t.displayName || t.name,
    abbr: t.abbreviation,
    color,
    logo: t.logos?.[0]?.href || t.logo || null,
    conf: t.groups?.name || t.groups?.abbreviation || '',
    sport: 'NBA',
    flag: '',
    players: [],
  };
};

const normalizeAthlete = (p) => ({
  n: p.fullName || p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
  pos: p.position?.abbreviation || p.position?.name || '',
  no: Number(p.jersey || p.jerseyNumber || 0) || 0,
  star: Number(p.experience?.years || 0) >= 5,
});

export default {
  async getTeams({}, env) {
    const data = await fetchJson(`${ESPN}/teams`);
    const rows = data.sports?.[0]?.leagues?.[0]?.teams || [];
    return {
      teams: rows.map(normalizeTeam).filter(t => t.name),
      source: 'espn-server',
      note: '由 Vercel /api/gateway server-side 代理取得，避免瀏覽器 CORS。',
    };
  },

  async getTeamRoster({ teamId }, env) {
    if (!teamId) return { players: [] };
    const id = String(teamId).replace('nba-', '');
    const data = await fetchJson(`${ESPN}/teams/${id}/roster`);
    const groups = data.athletes || [];
    const players = groups.flatMap(g => g.items || []).map(normalizeAthlete).filter(p => p.n).slice(0, 18);
    return { players, source: 'espn-server', teamId: id };
  },

  async getGames({ date }, env) {
    const d = date || new Date().toISOString().split('T')[0];
    try {
      const data = await fetchJson(`${ESPN}/scoreboard?dates=${d.replace(/-/g,'')}`);
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
      const headers = env.BDL_API_KEY ? { 'Authorization': env.BDL_API_KEY } : {};
      const r = await fetch(`${BDL}/players?search=${encodeURIComponent(name)}&per_page=5`, { headers });
      if (r.ok) {
        const data = await r.json();
        return { players: data.data || [], source: 'balldontlie' };
      }
    } catch {}
    try {
      const data = await fetchJson(`${ESPN_STATS}/athletes?limit=10&active=true&search=${encodeURIComponent(name)}`);
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
      const data = await fetchJson(`${ESPN}/news`);
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
