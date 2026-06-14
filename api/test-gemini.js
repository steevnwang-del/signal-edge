export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;

  // 1. 確認 key 存在
  if (!key) return res.json({ step: 1, ok: false, error: 'GEMINI_API_KEY 環境變數不存在，請在 Vercel 設定後 Redeploy' });

  res.json({ step: 1, ok: true, key_prefix: key.slice(0,8) + '...' + key.slice(-4) });

  // 注意：這個 endpoint 只回傳 key 是否存在
  // 完整測試請看下方 test-gemini-full
}
