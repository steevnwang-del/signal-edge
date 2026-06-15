/**
 * SIGNALEDGE API Gateway
 * 唯一 serverless 入口，所有 source 放 lib/（不計入 Vercel function 上限）
 *
 * 新增：
 * - source: 'groq'        → lib/sources/groq.js
 * - source: 'aiProvider'  → lib/sources/aiProvider.js (自動 fallback)
 * 維持向後相容：
 * - source: 'gemini' 仍然有效，但內部已支援動態模型
 */

const SOURCES = {
  gemini:     () => import('../lib/sources/gemini.js'),
  groq:       () => import('../lib/sources/groq.js'),
  aiProvider: () => import('../lib/sources/aiProvider.js'),
  odds:       () => import('../lib/sources/odds.js'),
  football:   () => import('../lib/sources/football.js'),
  nba:        () => import('../lib/sources/nba.js'),
  mlb:        () => import('../lib/sources/mlb.js'),
  esports:    () => import('../lib/sources/esports.js'),
  news:       () => import('../lib/sources/news.js'),
  polymarket: () => import('../lib/sources/polymarket.js'),
  apisports:  () => import('../lib/sources/apisports.js'),
  // ← 未來新增只加這一行
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.json({ status: 'ok', sources: Object.keys(SOURCES), version: '2.2.0' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { source, action, params = {} } = req.body || {};

  if (!source || !action) {
    return res.status(400).json({ error: 'Missing source or action', example: { source: 'aiProvider', action: 'diagnose', params: {} } });
  }

  if (!SOURCES[source]) {
    return res.status(404).json({ error: `Unknown source: ${source}`, available: Object.keys(SOURCES) });
  }

  try {
    const mod = await SOURCES[source]();
    const h = mod.default || mod;
    if (!h[action]) {
      return res.status(404).json({ error: `Unknown action: ${action} for source: ${source}`, available: Object.keys(h) });
    }
    const result = await h[action](params, process.env);
    res.json({ success: true, source, action, result, ts: Date.now() });
  } catch (err) {
    console.error(`[Gateway] ${source}.${action}:`, err.message);
    res.status(500).json({
      success: false, source, action,
      error: err.message,
      hint: source === 'gemini' || source === 'aiProvider'
        ? '請執行 source=aiProvider, action=diagnose 查看詳細 AI 診斷'
        : undefined,
    });
  }
}
