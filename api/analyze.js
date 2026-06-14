export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt, type = 'general' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const PROMPTS = {
    player: `你是專業運動數據分析師。根據以下選手統計數據，用繁體中文生成150字以內的客觀分析，以數據說話，描述優勢、弱點與近期趨勢。直接輸出內容。\n\n${prompt}`,
    team: `你是專業戰術分析師。根據以下隊伍資料，用繁體中文生成200字以內的戰術分析，包含戰術風格、核心球員、優勢與弱點。直接輸出內容。\n\n${prompt}`,
    match: `你是體育分析師。根據以下賽事資料，用繁體中文生成200字以內的賽前分析，不做輸贏保證，以數據為基礎。直接輸出內容。\n\n${prompt}`,
    news: `將以下英文體育新聞翻譯整理成繁體中文，約100字，保留關鍵數據，語氣專業。\n\n${prompt}`,
    compare: `根據以下兩位選手/隊伍的統計數據，用繁體中文生成200字以內的比較分析，客觀指出各自優勢與差異。直接輸出內容。\n\n${prompt}`,
  };

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPTS[type] || prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
        }),
      }
    );
    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '分析生成失敗，請稍後再試。';
    res.json({ analysis: text });
  } catch (err) {
    res.status(500).json({ error: 'AI分析服務暫時無法使用' });
  }
}
