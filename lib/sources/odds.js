const BASE = 'https://api.the-odds-api.com/v4';

export default {
  async getUpcoming({ region='eu', market='h2h', limit=20 }, env) {
    const r = await fetch(`${BASE}/sports/upcoming/odds/?regions=${region}&markets=${market}&oddsFormat=decimal&apiKey=${env.ODDS_API_KEY}&dateFormat=iso`);
    const data = await r.json();
    return {
      events: (Array.isArray(data) ? data : []).slice(0, limit),
      remaining: parseInt(r.headers.get('x-requests-remaining')) || 0,
      used: parseInt(r.headers.get('x-requests-used')) || 0,
    };
  },

  async getBySport({ sport, region='eu', market='h2h' }, env) {
    const r = await fetch(`${BASE}/sports/${sport}/odds/?regions=${region}&markets=${market}&oddsFormat=decimal&apiKey=${env.ODDS_API_KEY}&dateFormat=iso`);
    const data = await r.json();
    return { events: Array.isArray(data) ? data : [], sport };
  },

  async getSports({}, env) {
    const r = await fetch(`${BASE}/sports?apiKey=${env.ODDS_API_KEY}`);
    const data = await r.json();
    return { sports: Array.isArray(data) ? data : [] };
  },

  // 取得使用量
  async getUsage({}, env) {
    const r = await fetch(`${BASE}/sports?apiKey=${env.ODDS_API_KEY}`);
    await r.json();
    const remaining = parseInt(r.headers.get('x-requests-remaining')) || 0;
    const used = parseInt(r.headers.get('x-requests-used')) || 0;
    const total = 500;
    return { remaining, used, total, percent: Math.round(used/total*100) };
  },

  // Debug: 列出所有有賠率的 sport keys（不消耗額度）
  async debugSportKeys({}, env) {
    const r = await fetch(`${BASE}/sports?apiKey=${env.ODDS_API_KEY}&all=true`);
    const data = await r.json();
    const sports = Array.isArray(data) ? data : [];
    const active = sports.filter(s => s.active);
    const hasOdds = sports.filter(s => s.has_outrights || active.find(a => a.key === s.key));
    return {
      total: sports.length,
      active: active.length,
      soccerKeys: sports.filter(s => s.key.includes('soccer')).map(s => ({ key: s.key, title: s.title, active: s.active })),
      worldCupKeys: sports.filter(s => s.key.includes('world') || s.title?.toLowerCase().includes('world cup')).map(s => ({ key: s.key, title: s.title, active: s.active })),
      allKeys: sports.map(s => `${s.key} (${s.active ? 'active' : 'inactive'})`),
    };
  },

  // 直接抓世界杯賽事
  async getWorldCup({ region='eu' }, env) {
    // 嘗試所有可能的 WC key
    const wcKeys = [
      'soccer_fifa_world_cup',
      'soccer_world_cup',
      'soccer_usa_fifa_world_cup_2026',
      'soccer_fifa_world_cup_2026',
    ];
    const results = {};
    for (const key of wcKeys) {
      try {
        const r = await fetch(`${BASE}/sports/${key}/odds/?regions=${region}&markets=h2h&oddsFormat=decimal&apiKey=${env.ODDS_API_KEY}&dateFormat=iso`);
        const data = await r.json();
        const events = Array.isArray(data) ? data : [];
        results[key] = { count: events.length, error: data?.message || null };
        if (events.length > 0) return { found: true, key, events, results };
      } catch(e) {
        results[key] = { count: 0, error: e.message };
      }
    }
    return { found: false, results, note: '所有 WC key 均無賠率，可能需要升級 Odds API 方案' };
  },

  async calcEV({ homeOdds, awayOdds, drawOdds, modelHome, modelAway }, env) {
    const impliedHome = 1/homeOdds, impliedAway = 1/awayOdds;
    const impliedDraw = drawOdds ? 1/drawOdds : 0;
    const margin = impliedHome + impliedAway + impliedDraw - 1;
    return {
      implied: { home: +(impliedHome*100).toFixed(1), away: +(impliedAway*100).toFixed(1), draw: +(impliedDraw*100).toFixed(1) },
      margin: +(margin*100).toFixed(2),
      ev: { home: +((modelHome/100*homeOdds-1)*100).toFixed(1), away: +((modelAway/100*awayOdds-1)*100).toFixed(1) },
    };
  },
};
