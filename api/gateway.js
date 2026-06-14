const SOURCES = {
  gemini:     () => import('../lib/sources/gemini.js'),
  odds:       () => import('../lib/sources/odds.js'),
  football:   () => import('../lib/sources/football.js'),
  nba:        () => import('../lib/sources/nba.js'),
  mlb:        () => import('../lib/sources/mlb.js'),
  esports:    () => import('../lib/sources/esports.js'),
  news:       () => import('../lib/sources/news.js'),
  polymarket: () => import('../lib/sources/polymarket.js'),
  apisports:  () => import('../lib/sources/apisports.js'),
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status:'ok', sources:Object.keys(SOURCES), v:'2.1.0' });
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });

  const { source, action, params = {} } = req.body || {};
  if (!source || !action) return res.status(400).json({ error:'Missing source or action' });
  if (!SOURCES[source]) return res.status(404).json({ error:`Unknown source: ${source}`, available:Object.keys(SOURCES) });

  try {
    const mod = await SOURCES[source]();
    const h = mod.default || mod;
    if (!h[action]) return res.status(404).json({ error:`Unknown action: ${action}`, available:Object.keys(h) });
    const result = await h[action](params, process.env);
    res.json({ success:true, source, action, result, ts:Date.now() });
  } catch (err) {
    console.error(`[Gateway] ${source}.${action}:`, err.message);
    res.status(500).json({ success:false, source, action, error:err.message });
  }
}
