/**
 * Gemini AI Source
 * - 動態 ListModels，不硬寫過期模型
 * - 產出更完整的 SignalEdge 分析，不再強制 150/200 字短文
 * - LLM 只負責敘述，不自行發明 EV / 勝率 / 賠率
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

let _modelCache = null;
let _modelCacheAt = 0;
const CACHE_TTL = 3600_000;

const buildAuth = (key) => {
  const isBearer = !key.startsWith('AIza');
  return {
    url: (model) => isBearer
      ? `${BASE}/models/${model}:generateContent`
      : `${BASE}/models/${model}:generateContent?key=${key}`,
    headers: isBearer
      ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'x-goog-api-key': key }
      : { 'Content-Type': 'application/json' },
    listUrl: isBearer ? `${BASE}/models` : `${BASE}/models?key=${key}`,
    listHeaders: isBearer ? { 'Authorization': `Bearer ${key}`, 'x-goog-api-key': key } : {},
  };
};

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
        (m.name.includes('flash') || m.name.includes('pro') || m.name.includes('lite'))
      )
      .map(m => m.name.replace('models/', ''))
      .sort((a, b) => {
        const score = (n) => {
          let s = 0;
          const m = n.match(/(\d+)[\.-](\d+)/);
          if (m) s += Number(m[1]) * 100 + Number(m[2]);
          if (n.includes('pro')) s += 20;
          if (n.includes('flash')) s += 10;
          if (n.includes('lite')) s -= 5;
          return s;
        };
        return score(b) - score(a);
      });
    _modelCache = models.length ? models : null;
    _modelCacheAt = Date.now();
    return _modelCache;
  } catch {
    return null;
  }
};

const STATIC_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const CORE_RULES = `
你是 SignalEdge 的繁體中文運動數據 Narrative Agent。
你的任務是把後端已計算好的 DATA_BLOCK 轉成清楚、保守、可讀的分析。

硬性規則：
1. 不得自行創造 DATA_BLOCK 沒有提供的勝率、EV、賠率、比分或球員數據。
2. 不得使用「穩」「必中」「保證」「鎖單」「必下」「重注」「上車」等字眼。
3. 不承諾獲利，不鼓勵投注，只能描述「模型傾向、價格價值、風險、觀察條件」。
4. 如果 DATA_BLOCK 顯示 EV <= 0、資料不足、陣容未確認或決策 WAIT/NO BET，必須明確提醒。
5. 用繁體中文，語氣像專業分析師，不要像廣告文。
`;

const PROMPTS = {
  match: p => `${CORE_RULES}
請根據下方 DATA_BLOCK 寫一份完整賽前分析，長度約 320-520 字。

輸出格式請固定為：
【一句話結論】
【模型解讀】說明市場去水、模型傾向或目前價格意義。
【關鍵風險】列出至少 2 個需要注意的風險或不確定因素。
【賽前確認】說明開賽前應確認什麼，例如首發、傷病、輪換、盤口是否達標。
【SignalEdge 判斷】用 BET / LEAN / WAIT / NO BET 的語氣說明，但不得保證結果。

${p}`,

  player: p => `${CORE_RULES}
請根據下方選手 DATA_BLOCK，寫 220-360 字繁體中文分析。
必須包含：數據亮點、弱點/風險、近期趨勢、適合觀察的指標。

${p}`,

  team: p => `${CORE_RULES}
請根據下方隊伍 DATA_BLOCK，寫 260-420 字繁體中文戰術與實力分析。
必須包含：隊伍定位、強項、弱點、關鍵球員/位置、資料限制。

${p}`,

  news: p => `將以下英文體育新聞標題翻成自然的繁體中文新聞標題。
規則：只輸出翻譯，不加引號，不加解釋，保留必要隊名/人名。
英文標題：${p}`,

  general: p => `${CORE_RULES}
請優先遵守使用者提供的格式與要求。若內容是 DATA_BLOCK，請只根據 DATA_BLOCK 分析，不要自行發明數字。

${p}`,
};

const tokenBudget = (type) => {
  if (type === 'news') return 80;
  if (type === 'player') return 900;
  if (type === 'team') return 1000;
  if (type === 'match') return 1200;
  return 1400;
};

const callGemini = async (prompt, key, model, maxTokens = 1200, temperature = 0.55) => {
  const auth = buildAuth(key);
  const r = await fetch(auth.url(model), {
    method: 'POST',
    headers: auth.headers,
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    let msg = body;
    try { msg = JSON.parse(body)?.error?.message || body; } catch {}
    throw Object.assign(new Error(`Gemini ${r.status}: ${String(msg).slice(0, 220)}`), { status: r.status });
  }
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
  if (!text) throw new Error('Gemini 回傳空白');
  return text;
};

const getCandidateModels = async (key, env = process.env) => {
  const envModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL;
  if (envModel) return [envModel];
  const dynamic = await listFlashModels(key);
  return [...new Set([...(dynamic || []), ...STATIC_FALLBACKS])].slice(0, 6);
};

const analyze_ = async (prompt, key, maxTokens, env, temperature) => {
  const models = await getCandidateModels(key, env);
  let lastError;
  for (const model of models) {
    try {
      const text = await callGemini(prompt, key, model, maxTokens, temperature);
      return { text, model };
    } catch (e) {
      lastError = e;
      console.warn(`[Gemini] ${model} failed (${e.status || '?'}): ${e.message.slice(0, 100)}`);
      if (e.status === 401 || e.status === 403) break;
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
    const { text, model } = await analyze_(fullPrompt, key, tokenBudget(type), env, type === 'news' ? 0.2 : 0.55);
    return { analysis: text, model, provider: 'gemini' };
  },

  async batch({ items = [] }, env) {
    const key = env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY 未設定');
    const results = [];
    for (const item of items) {
      try {
        const tFn = PROMPTS[item.type] || PROMPTS.general;
        const { text, model } = await analyze_(tFn(item.prompt), key, tokenBudget(item.type || 'general'), env, item.type === 'news' ? 0.2 : 0.55);
        results.push({ id: item.id, success: true, analysis: text, model });
      } catch (e) {
        results.push({ id: item.id, success: false, error: e.message });
      }
      await new Promise(r => setTimeout(r, 450));
    }
    return { results, total: items.length, success: results.filter(r => r.success).length };
  },

  async translateTitles({ titles = [] }, env) {
    const key = env.GEMINI_API_KEY;
    if (!key) return { results: titles.map(t => ({ ...t, zh: t.en || t.title || '' })) };
    const results = [];
    for (const t of titles) {
      const en = t.en || t.title || '';
      try {
        const { text } = await analyze_(PROMPTS.news(en), key, tokenBudget('news'), env, 0.2);
        results.push({ id: t.id, en, zh: text.replace(/^['"「」]+|['"「」]+$/g, '').trim() });
      } catch {
        results.push({ id: t.id, en, zh: en });
      }
      await new Promise(r => setTimeout(r, 250));
    }
    return { results };
  },

  async diagnose({}, env) {
    const key = env.GEMINI_API_KEY;
    if (!key) return { ok: false, error: 'GEMINI_API_KEY 未設定', provider: 'gemini' };
    const dynamicModels = await listFlashModels(key);
    const candidates = await getCandidateModels(key, env);
    let lastError;
    for (const model of candidates.slice(0, 3)) {
      try {
        await callGemini('回覆數字1', key, model, 5, 0.1);
        return { ok: true, provider: 'gemini', active_model: model, available_models: dynamicModels || [], candidate_models: candidates };
      } catch (e) {
        lastError = e;
        if (e.status === 401 || e.status === 403) break;
      }
    }
    return {
      ok: false,
      provider: 'gemini',
      error: lastError?.message?.slice(0, 220) || 'Unknown error',
      error_status: lastError?.status,
      candidate_models: candidates,
      available_models: dynamicModels || [],
      hint: lastError?.status === 401 || lastError?.status === 403
        ? 'API Key 無效或權限不足，請重新到 Google AI Studio 建立 key'
        : '模型呼叫失敗，請檢查 GEMINI_MODEL 或執行 ListModels 診斷',
    };
  },
};
