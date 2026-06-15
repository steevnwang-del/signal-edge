/**
 * Gemini AI Source
 * - 用 ListModels API 動態抓可用模型，不寫死
 * - 支援 AIzaSy... 和 AQ.Ab8... 兩種 key 格式
 * - diagnose() 不洩漏任何 key 片段
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Module-level 快取（同一個 serverless instance 內有效）
let _modelCache = null;
let _modelCacheAt = 0;
const CACHE_TTL = 3600_000; // 1小時

// 判斷 key 格式，建立對應 headers/URL
const buildAuth = (key) => {
  const isBearer = !key.startsWith('AIza');
  return {
    url: (model) => isBearer
      ? `${BASE}/models/${model}:generateContent`
      : `${BASE}/models/${model}:generateContent?key=${key}`,
    headers: isBearer
      ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'x-goog-api-key': key }
      : { 'Content-Type': 'application/json' },
    listUrl: isBearer
      ? `${BASE}/models`
      : `${BASE}/models?key=${key}`,
    listHeaders: isBearer
      ? { 'Authorization': `Bearer ${key}`, 'x-goog-api-key': key }
      : {},
  };
};

// 動態取得支援 generateContent 的 flash 模型清單
const listFlashModels = async (key) => {
  if (_modelCache && Date.now() - _modelCacheAt < CACHE_TTL) return _modelCache;
  try {
    const auth = buildAuth(key);
    const r = await fetch(auth.listUrl, { headers: auth.listHeaders });
    if (!r.ok) return null;
    const data = await r.json();
    const models = (data.models || [])
      .filter(m =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        !m.name.includes('embedding') &&
        !m.name.includes('aqa') &&
        (m.name.includes('flash') || m.name.includes('lite'))
      )
      .map(m => m.name.replace('models/', ''))
      .sort((a, b) => {
        // 排序：版本號降序，lite 在同版本排後面
        const ver = n => { const m = n.match(/(\d+)[\.-](\d+)/); return m ? parseFloat(`${m[1]}.${m[2]}`) : 0; };
        const vA = ver(a), vB = ver(b);
        if (vA !== vB) return vB - vA;
        if (a.includes('lite') && !b.includes('lite')) return 1;
        if (!a.includes('lite') && b.includes('lite')) return -1;
        return 0;
      });
    _modelCache = models.length > 0 ? models : null;
    _modelCacheAt = Date.now();
    return _modelCache;
  } catch { return null; }
};

// FALLBACK 靜態候選（ListModels 失敗時用）
const STATIC_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const PROMPTS = {
  match:   p => `你是專業體育數據分析師。根據以下 DATA_BLOCK，用繁體中文生成200字以內的賽前分析。不做投注保證，不使用「穩」「必中」「保證」。\n\n${p}`,
  player:  p => `你是運動數據分析師。根據以下選手統計數據，用繁體中文生成150字以內的客觀分析，以數據說話。\n\n${p}`,
  team:    p => `你是戰術分析師。根據以下隊伍資料，用繁體中文生成200字以內的戰術分析，不做預測保證。\n\n${p}`,
  news:    p => `將以下英文體育新聞標題翻譯成繁體中文，20字以內，只輸出翻譯結果。\n\n${p}`,
  general: p => p,
};

// 核心呼叫函式
const callGemini = async (prompt, key, model, maxTokens = 600) => {
  const auth = buildAuth(key);
  const r = await fetch(auth.url(model), {
    method: 'POST',
    headers: auth.headers,
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    let msg = body;
    try { msg = JSON.parse(body)?.error?.message || body; } catch {}
    throw Object.assign(new Error(`Gemini ${r.status}: ${msg.slice(0, 200)}`), { status: r.status });
  }
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini 回傳空白');
  return text;
};

// 取候選模型清單（動態 + 靜態合併去重）
const getCandidateModels = async (key) => {
  const envModel = process.env.GEMINI_MODEL;
  if (envModel) return [envModel]; // 環境變數優先

  const dynamic = await listFlashModels(key);
  const combined = [...new Set([...(dynamic || []), ...STATIC_FALLBACKS])];
  return combined.slice(0, 6); // 最多試 6 個
};

// 帶重試的分析呼叫
const analyze_ = async (prompt, key, maxTokens) => {
  const models = await getCandidateModels(key);
  let lastError;
  for (const model of models) {
    try {
      const text = await callGemini(prompt, key, model, maxTokens);
      return { text, model };
    } catch (e) {
      lastError = e;
      console.warn(`[Gemini] ${model} failed (${e.status || '?'}): ${e.message.slice(0, 80)}`);
      // 401/403 = key 問題，不用試其他模型
      if (e.status === 401 || e.status === 403) break;
      // 429 = rate limit，等 2 秒
      if (e.status === 429) await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw lastError || new Error('All Gemini models failed');
};

export default {
  async analyze({ prompt, type = 'general' }, env) {
    const key = env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY 未設定');
    const fullPrompt = (PROMPTS[type] || PROMPTS.general)(prompt);
    const { text, model } = await analyze_(fullPrompt, key, 600);
    return { analysis: text, model, provider: 'gemini' };
  },

  async batch({ items = [] }, env) {
    const key = env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY 未設定');
    const results = [];
    for (const item of items) {
      try {
        const tFn = PROMPTS[item.type] || PROMPTS.general;
        const { text } = await analyze_(tFn(item.prompt), key, 400);
        results.push({ id: item.id, success: true, analysis: text });
      } catch (e) {
        results.push({ id: item.id, success: false, error: e.message });
      }
      await new Promise(r => setTimeout(r, 600));
    }
    return { results, total: items.length, success: results.filter(r => r.success).length };
  },

  async translateTitles({ titles = [] }, env) {
    const key = env.GEMINI_API_KEY;
    if (!key) return { results: titles.map(t => ({ ...t, zh: t.en })) };
    const results = [];
    for (const t of titles) {
      try {
        const { text } = await analyze_(PROMPTS.news(t.en), key, 50);
        results.push({ id: t.id, en: t.en, zh: text.trim() });
      } catch {
        results.push({ id: t.id, en: t.en, zh: t.en });
      }
      await new Promise(r => setTimeout(r, 400));
    }
    return { results };
  },

  async diagnose({}, env) {
    const key = env.GEMINI_API_KEY;
    if (!key) return { ok: false, error: 'GEMINI_API_KEY 未設定', provider: 'gemini' };

    // 動態模型清單
    const dynamicModels = await listFlashModels(key);
    const candidates = await getCandidateModels(key);

    let lastError;
    for (const model of candidates.slice(0, 3)) {
      try {
        await callGemini('回覆數字1', key, model, 5);
        return {
          ok: true,
          provider: 'gemini',
          active_model: model,
          available_models: dynamicModels || [],
          candidate_models: candidates,
        };
      } catch (e) {
        lastError = e;
        if (e.status === 401 || e.status === 403) break;
      }
    }

    return {
      ok: false,
      provider: 'gemini',
      error: lastError?.message?.slice(0, 200) || 'Unknown error',
      error_status: lastError?.status,
      candidate_models: candidates,
      available_models: dynamicModels || [],
      hint: lastError?.status === 401 || lastError?.status === 403
        ? 'API Key 無效或格式不正確，請重新到 aistudio.google.com 取得 AIzaSy... 格式的 key'
        : '模型可能全部 404，請確認 key 有效後 Redeploy',
    };
  },
};
