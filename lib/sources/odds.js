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
    const r = await fetch(`${BASE}/sports/${sport}/odds/?regions=${region}&markets=${market}&oddsFormat=decimal&apiKey=${env.ODDS_API_KEY}`);
    const data = await r.json();
    return { events: Array.isArray(data) ? data : [], sport };
  },

  async getSports({}, env) {
    const r = await fetch(`${BASE}/sports?apiKey=${env.ODDS_API_KEY}`);
    const data = await r.json();
    return { sports: Array.isArray(data) ? data : [] };
  },

  // 取得使用量（不消耗額度的輕量請求）
  async getUsage({}, env) {
    const r = await fetch(`${BASE}/sports?apiKey=${env.ODDS_API_KEY}`);
    await r.json();
    const remaining = parseInt(r.headers.get('x-requests-remaining')) || 0;
    const used = parseInt(r.headers.get('x-requests-used')) || 0;
    const total = 500; // 免費方案月配額
    return { remaining, used, total, percent: Math.round(used/total*100) };
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
