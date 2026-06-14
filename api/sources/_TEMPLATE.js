/**
 * ============================================
 * 新增數據源模板
 * ============================================
 * 
 * 如何新增一個新的數據源：
 * 
 * 1. 複製這個檔案，命名為 yourSource.js
 * 2. 在 api/gateway.js 的 SOURCES 物件加一行：
 *    yourSource: () => import('./sources/yourSource.js'),
 * 3. 在 src/services/apiGateway.js 加便捷方法
 * 
 * 就完成了，不需要修改其他任何檔案。
 */

export default {
  // 每個 action 接收 (params, env) 兩個參數
  // params = 前端傳來的參數
  // env = process.env（包含所有 Vercel 環境變數）
  
  async getData({ id, limit = 10 }, env) {
    const apiKey = env.YOUR_API_KEY;
    if (!apiKey) return { error: 'YOUR_API_KEY not configured in Vercel env vars' };
    
    const r = await fetch(`https://your-api.com/endpoint?id=${id}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await r.json();
    return { data, id };
  },

  async search({ query }, env) {
    const r = await fetch(`https://your-api.com/search?q=${encodeURIComponent(query)}`);
    return r.json();
  },
};
