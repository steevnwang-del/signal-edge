export default async function handler(req, res) {
  const { sport = 'upcoming', region = 'eu', market = 'h2h' } = req.query;
  try {
    const r = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=${region}&markets=${market}&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`
    );
    const data = await r.json();
    const remaining = r.headers.get('x-requests-remaining');
    res.json({ data, remaining });
  } catch (err) {
    res.status(500).json({ error: '賠率數據暫時無法取得' });
  }
}
