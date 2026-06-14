/**
 * SIGNALEDGE 統一 API Gateway
 * 所有數據源走這個入口
 * 新增數據源：在 /api/sources/ 新增一個 js 檔案即可
 * 
 * 呼叫方式：
 * POST /api/gateway
 * { source: 'gemini', action: 'analyze', params: { prompt, type } }
 */

// 動態載入所有數據源 handler
const SOURCES = {
  gemini:    () => import('./sources/gemini.js'),
  odds:      () => import('./sources/odds.js'),
  football:  () => import('./sources/football.js'),
  nba:       () => import('./sources/nba.js'),
  mlb:       () => import('./sources/mlb.js'),
  esports:   () => import('./sources/esports.js'),
  news:      () => import('./sources/news.js'),
  polymarket:() => import('./sources/polymarket.js'),
  // ← 未來新增：只要在這裡加一行 + 新增對應 sources/xxx.js
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // 健康檢查：列出所有可用數據源
    return res.json({
      status: 'ok',
      sources: Object.keys(SOURCES),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { source, action, params = {} } = req.body || {};

  if (!source || !action) {
    return res.status(400).json({ error: 'Missing source or action' });
  }

  if (!SOURCES[source]) {
    return res.status(404).json({
      error: `Unknown source: ${source}`,
      available: Object.keys(SOURCES),
    });
  }

  try {
    const module = await SOURCES[source]();
    const handler = module.default || module;

    if (!handler[action]) {
      return res.status(404).json({
        error: `Unknown action: ${action} for source: ${source}`,
        available: Object.keys(handler),
      });
    }

    const result = await handler[action](params, process.env);
    res.json({ success: true, source, action, result, ts: Date.now() });
  } catch (err) {
    console.error(`[Gateway] ${source}.${action} error:`, err);
    res.status(500).json({ success: false, source, action, error: err.message });
  }
}
