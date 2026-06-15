/**
 * Groq AI Source
 * OpenAI-compatible API，速度快、免費額度大
 * 環境變數：GROQ_API_KEY, GROQ_MODEL
 */

const BASE = 'https://api.groq.com/openai/v1';

// 候選模型（從快到好）
const DEFAULT_MODELS = [
  'llama-3.3-70b-versatile',   // 最強，支援繁中
  'llama-3.1-70b-versatile',   // 備用
  'llama-3.1-8b-instant',      // 快速，適合翻譯
];

const PROMPTS = {
  match:   p => `你是專業體育數據分析師。根據以下 DATA_BLOCK，用繁體中文生成200字以內的賽前分析。不做投注保證，不使用「穩」「必中」「保證」。\n\n${p}`,
  player:  p => `你是運動數據分析師。根據以下選手統計數據，用繁體中文生成150字以內的客觀分析，以數據說話。\n\n${p}`,
  team:    p => `你是戰術分析師。根據以下隊伍資料，用繁體中文生成200字以內的戰術分析。\n\n${p}`,
  news:    p => `將以下英文體育新聞標題翻譯成繁體中文，20字以內，只輸出翻譯結果。\n\n${p}`,
  general: p => p,
};

const callGroq = async (prompt, model, key, maxTokens = 600) => {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    let msg = body;
    try { msg = JSON.parse(body)?.error?.message || body; } catch {}
    throw Object.assign(new Error(`Groq ${r.status}: ${msg.slice(0, 200)}`), { status: r.status });
  }
  const data = await r.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq 回傳空白');
  return text;
};

const getModels = (env) => {
  const envModel = env.GROQ_MODEL;
  return envModel ? [envModel] : DEFAULT_MODELS;
};

const analyze_ = async (prompt, env, maxTokens) => {
  const key = env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY 未設定');
  const models = getModels(env);
  let lastError;
  for (const model of models) {
    try {
      const text = await callGroq(prompt, model, key, maxTokens);
      return { text, model };
    } catch (e) {
      lastError = e;
      console.warn(`[Groq] ${model} failed: ${e.message.slice(0, 80)}`);
      if (e.status === 401 || e.status === 403) break;
    }
  }
  throw lastError || new Error('All Groq models failed');
};

export default {
  async analyze({ prompt, type = 'general' }, env) {
    const fullPrompt = (PROMPTS[type] || PROMPTS.general)(prompt);
    const { text, model } = await analyze_(fullPrompt, env, 600);
    return { analysis: text, model, provider: 'groq' };
  },

  async batch({ items = [] }, env) {
    const results = [];
    for (const item of items) {
      try {
        const tFn = PROMPTS[item.type] || PROMPTS.general;
        const { text } = await analyze_(tFn(item.prompt), env, 400);
        results.push({ id: item.id, success: true, analysis: text });
      } catch (e) {
        results.push({ id: item.id, success: false, error: e.message });
      }
      await new Promise(r => setTimeout(r, 300));
    }
    return { results, total: items.length, success: results.filter(r => r.success).length };
  },

  async translateTitles({ titles = [] }, env) {
    const results = [];
    for (const t of titles) {
      try {
        const { text } = await analyze_(PROMPTS.news(t.en), env, 50);
        results.push({ id: t.id, en: t.en, zh: text.trim() });
      } catch {
        results.push({ id: t.id, en: t.en, zh: t.en });
      }
      await new Promise(r => setTimeout(r, 200));
    }
    return { results };
  },

  async diagnose({}, env) {
    const key = env.GROQ_API_KEY;
    if (!key) return { ok: false, error: 'GROQ_API_KEY 未設定', provider: 'groq' };
    const model = getModels(env)[0];
    try {
      await callGroq('回覆數字1', model, key, 5);
      return { ok: true, provider: 'groq', active_model: model };
    } catch (e) {
      return { ok: false, provider: 'groq', error: e.message.slice(0, 200), error_status: e.status };
    }
  },
};
