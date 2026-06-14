/**
 * SIGNALEDGE 統一 API Gateway
 * 唯一的 serverless function 入口
 * 數據源放在 /lib/sources/（不計入 serverless function 數量）
 * 
 * 新增數據源：
 * 1. 在 /lib/sources/ 新增 yourSource.js
 * 2. 在下方 SOURCES 加一行即可
 */
const SOURCES = {
  gemini:     () => import('../lib/sources/gemini.js'),
  odds:       () => import('../lib/sources/odds.js'),
  football:   () => import('../lib/sources/football.js'),
  nba:        () => import('../lib/sources/nba.js'),
  mlb:        () => import('../lib/sources/mlb.js'),
  esports:    () => import('../lib/sources/esports.js'),
  news:       () => import('../lib/sources/news.js'),
  polymarket: () => import('../lib/sources/polymarket.js'),
  // ← 未來新增只加這一行
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.json({ status:'ok', sources: Object.keys(SOURCES), version:'2.0.0' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { source, action, params = {} } = req.body || {};
  if (!source || !action) return res.status(400).json({ error: 'Missing source or action' });
  if (!SOURCES[source]) return res.status(404).json({ error: `Unknown source: ${source}`, available: Object.keys(SOURCES) });

  try {
    const mod = await SOURCES[source]();
    const handler = mod.default || mod;
    if (!handler[action]) return res.status(404).json({ error: `Unknown action: ${action}`, available: Object.keys(handler) });
    const result = await handler[action](params, process.env);
    res.json({ success: true, source, action, result, ts: Date.now() });
  } catch (err) {
    console.error(`[Gateway] ${source}.${action}:`, err.message);
    res.status(500).json({ success: false, source, action, error: err.message });
  }
}
