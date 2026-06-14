/**
 * Gemini AI 分析源
 * actions: analyze, batch
 */
const PROMPT_TEMPLATES = {
  match:   (p) => `你是專業體育數據分析師。根據以下數據，用繁體中文生成200字以內的賽前分析。以數據說話，不做輸贏保證，不提供投注建議。\n\n${p}`,
  player:  (p) => `你是專業運動數據分析師。根據以下選手統計數據，用繁體中文生成150字以內的客觀分析。以數據事實描述優勢與弱點，不做主觀評語。\n\n${p}`,
  team:    (p) => `你是專業戰術分析師。根據以下隊伍資料，用繁體中文生成200字以內的戰術分析。不做賽果保證。\n\n${p}`,
  news:    (p) => `將以下英文體育新聞標題翻譯成繁體中文，保持精簡準確，20字以內。只輸出翻譯結果。\n\n${p}`,
  compare: (p) => `根據以下兩方統計數據，用繁體中文生成200字以內的客觀比較分析。不做預測保證。\n\n${p}`,
  general: (p) => p,
};

const callGemini = async (prompt, env, maxTokens = 600) => {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
      }),
    }
  );
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

export default {
  // 單次分析
  async analyze({ prompt, type = 'general' }, env) {
    const templateFn = PROMPT_TEMPLATES[type] || PROMPT_TEMPLATES.general;
    const text = await callGemini(templateFn(prompt), env);
    return { analysis: text, type, chars: text.length };
  },

  // 批量分析（多場賽事一次處理）
  async batch({ items = [] }, env) {
    const results = [];
    for (const item of items) {
      try {
        const templateFn = PROMPT_TEMPLATES[item.type] || PROMPT_TEMPLATES.general;
        const text = await callGemini(templateFn(item.prompt), env, 400);
        results.push({ id: item.id, success: true, analysis: text });
        await new Promise(r => setTimeout(r, 500)); // rate limit
      } catch (err) {
        results.push({ id: item.id, success: false, error: err.message });
      }
    }
    return { results, total: items.length, success: results.filter(r=>r.success).length };
  },

  // 翻譯新聞標題列表
  async translateTitles({ titles = [] }, env) {
    const results = [];
    for (const t of titles) {
      const zh = await callGemini(PROMPT_TEMPLATES.news(t.en), env, 50);
      results.push({ id: t.id, en: t.en, zh: zh.trim() });
      await new Promise(r => setTimeout(r, 300));
    }
    return { results };
  },
};
