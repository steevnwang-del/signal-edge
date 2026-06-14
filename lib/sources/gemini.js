const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const PROMPT_TEMPLATES = {
  match:   (p) => `你是專業體育數據分析師。根據以下 DATA_BLOCK，用繁體中文生成200字以內的賽前分析。不做任何投注保證，不使用「穩」「必中」「保證」等字眼。\n\n${p}`,
  player:  (p) => `你是運動數據分析師。根據以下選手統計數據，用繁體中文生成150字以內的客觀分析。以數據說話，不做主觀評語。\n\n${p}`,
  team:    (p) => `你是戰術分析師。根據以下隊伍資料，用繁體中文生成200字以內的戰術分析。不做預測保證。\n\n${p}`,
  news:    (p) => `將以下英文體育新聞標題翻譯成繁體中文，20字以內，只輸出翻譯結果。\n\n${p}`,
  general: (p) => p,
};

const callGemini = async (prompt, key, model, maxTokens = 600) => {
  const r = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
    }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Gemini ${r.status}: ${err.slice(0, 200)}`);
  }
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
};

export default {
  async analyze({ prompt, type = 'general' }, env) {
    const key = env.GEMINI_API_KEY;
    if (!key || key === 'undefined') throw new Error('GEMINI_API_KEY 未設定，請確認 Vercel 環境變數並 Redeploy');
    const templateFn = PROMPT_TEMPLATES[type] || PROMPT_TEMPLATES.general;
    const fullPrompt = templateFn(prompt);
    let lastError;
    for (const model of MODELS) {
      try {
        const text = await callGemini(fullPrompt, key, model);
        return { analysis: text, model };
      } catch (e) {
        lastError = e;
        console.warn(`[Gemini] ${model} failed:`, e.message);
      }
    }
    throw lastError;
  },

  async batch({ items = [] }, env) {
    const key = env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not set');
    const results = [];
    for (const item of items) {
      try {
        const tFn = PROMPT_TEMPLATES[item.type] || PROMPT_TEMPLATES.general;
        const text = await callGemini(tFn(item.prompt), key, MODELS[0], 400);
        results.push({ id: item.id, success: true, analysis: text });
      } catch (e) {
        results.push({ id: item.id, success: false, error: e.message });
      }
      await new Promise(r => setTimeout(r, 500));
    }
    return { results, total: items.length, success: results.filter(r=>r.success).length };
  },

  async translateTitles({ titles = [] }, env) {
    const key = env.GEMINI_API_KEY;
    if (!key) return { results: titles.map(t=>({ ...t, zh: t.en })) };
    const results = [];
    for (const t of titles) {
      try {
        const zh = await callGemini(PROMPT_TEMPLATES.news(t.en), key, MODELS[0], 50);
        results.push({ id: t.id, en: t.en, zh: zh.trim() });
      } catch {
        results.push({ id: t.id, en: t.en, zh: t.en });
      }
      await new Promise(r => setTimeout(r, 300));
    }
    return { results };
  },

  // 診斷工具
  async diagnose({}, env) {
    const key = env.GEMINI_API_KEY;
    if (!key) return { ok: false, error: 'GEMINI_API_KEY 環境變數未設定' };
    const results = [];
    for (const model of MODELS) {
      try {
        const text = await callGemini('回覆「OK」兩個字', key, model, 10);
        results.push({ model, ok: true, response: text.slice(0,20) });
        break;
      } catch (e) {
        results.push({ model, ok: false, error: e.message.slice(0,100) });
      }
    }
    return { key_prefix: key.slice(0,8)+'...', results };
  },
};
