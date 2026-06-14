export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ ok: false, error: 'Key 不存在' });

  const models = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-pro',
  ];

  const results = [];
  for (const model of models) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: '回覆數字1' }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        }
      );
      const status = r.status;
      const body = await r.text();
      if (r.ok) {
        const data = JSON.parse(body);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '無回覆';
        results.push({ model, status, ok: true, response: text });
        break; // 成功了就停
      } else {
        results.push({ model, status, ok: false, error: body.slice(0, 300) });
      }
    } catch (e) {
      results.push({ model, ok: false, error: e.message });
    }
  }

  res.json({ key_prefix: key.slice(0,8)+'...', results });
}
