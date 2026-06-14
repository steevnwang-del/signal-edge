/**
 * 新增數據源範本
 * 複製這個檔案到 lib/sources/yourSource.js
 * 然後在 api/gateway.js 的 SOURCES 加一行：
 *   yourSource: () => import('../lib/sources/yourSource.js'),
 */
export default {
  async getData({ id, limit = 10 }, env) {
    const apiKey = env.YOUR_API_KEY;
    if (!apiKey) return { error: 'YOUR_API_KEY not set in Vercel env vars' };
    const r = await fetch(`https://your-api.com/data?id=${id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    return r.json();
  },
};
