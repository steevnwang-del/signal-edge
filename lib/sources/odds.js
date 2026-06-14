/**
 * 賠率數據源
 * actions: getUpcoming, getBySport, getSports
 */
const BASE = 'https://api.the-odds-api.com/v4';

export default {
  async getUpcoming({ region = 'eu', market = 'h2h', limit = 20 }, env) {
    const r = await fetch(`${BASE}/sports/upcoming/odds/?regions=${region}&markets=${market}&oddsFormat=decimal&apiKey=${env.ODDS_API_KEY}&dateFormat=iso`);
    const data = await r.json();
    const remaining = r.headers.get('x-requests-remaining');
    return { events: data.slice(0, limit), remaining: parseInt(remaining) || 0 };
  },

  async getBySport({ sport, region = 'eu', market = 'h2h' }, env) {
    const r = await fetch(`${BASE}/sports/${sport}/odds/?regions=${region}&markets=${market}&oddsFormat=decimal&apiKey=${env.ODDS_API_KEY}`);
    const data = await r.json();
    return { events: data, sport };
  },

  async getSports({}, env) {
    const r = await fetch(`${BASE}/sports?apiKey=${env.ODDS_API_KEY}`);
    const data = await r.json();
    return { sports: data };
  },

  // 計算隱含概率 & EV
  async calcEV({ homeOdds, awayOdds, drawOdds, modelHome, modelAway, modelDraw }, env) {
    const impliedHome  = 1 / homeOdds;
    const impliedAway  = 1 / awayOdds;
    const impliedDraw  = drawOdds ? 1 / drawOdds : 0;
    const margin = impliedHome + impliedAway + impliedDraw - 1;
    const evHome = (modelHome / 100) * homeOdds - 1;
    const evAway = (modelAway / 100) * awayOdds - 1;
    return {
      implied: { home: +(impliedHome*100).toFixed(1), away: +(impliedAway*100).toFixed(1), draw: +(impliedDraw*100).toFixed(1) },
      margin: +(margin*100).toFixed(2),
      ev: { home: +(evHome*100).toFixed(1), away: +(evAway*100).toFixed(1) },
    };
  },
};
