/**
 * Groq AI Source
 * - OpenAI-compatible API
 * - 與 Gemini 使用同一套高品質 SignalEdge prompt 規則
 */

const BASE = 'https://api.groq.com/openai/v1';

const DEFAULT_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
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
【模型解讀】
【關鍵風險】
【賽前確認】
【SignalEdge 判斷】
${p}`,
  player: p => `${CORE_RULES}
請根據下方選手 DATA_BLOCK，寫 220-360 字繁體中文分析，包含數據亮點、弱點/風險、近期趨勢。
${p}`,
  team: p => `${CORE_RULES}
請根據下方隊伍 DATA_BLOCK，寫 260-420 字繁體中文戰術與實力分析，包含隊伍定位、強項、弱點、關鍵球員/位置、資料限制。
${p}`,
  news: p => `將以下英文體育新聞標題翻成自然的繁體中文新聞標題。只輸出翻譯，不加引號，不加解釋，保留必要隊名/人名。英文標題：${p}`,
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

const getModels = (env) => env.GROQ_MODEL ? [env.GROQ_MODEL] : DEFAULT_MODELS;

const callGroq = async (prompt, model, key, maxTokens = 1200, temperature = 0.55) => {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: '你是嚴謹的繁體中文運動數據分析助理。請遵守使用者提供的格式，不得發明數字。' },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    let msg = body;
    try { msg = JSON.parse(body)?.error?.message || body; } catch {}
    throw Object.assign(new Error(`Groq ${r.status}: ${String(msg).slice(0, 220)}`), { status: r.status });
  }
  const data = await r.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Groq 回傳空白');
  return text;
};

const analyze_ = async (prompt, env, maxTokens, temperature) => {
  const key = env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY 未設定');
  const models = getModels(env);
  let lastError;
  for (const model of models) {
    try {
      const text = await callGroq(prompt, model, key, maxTokens, temperature);
      return { text, model };
    } catch (e) {
      lastError = e;
      console.warn(`[Groq] ${model} failed: ${e.message.slice(0, 100)}`);
      if (e.status === 401 || e.status === 403) break;
    }
  }
  throw lastError || new Error('All Groq models failed');
};

export default {
  async analyze({ prompt, type = 'general' }, env) {
    const fullPrompt = (PROMPTS[type] || PROMPTS.general)(prompt);
    const { text, model } = await analyze_(fullPrompt, env, tokenBudget(type), type === 'news' ? 0.2 : 0.55);
    return { analysis: text, model, provider: 'groq' };
  },

  async batch({ items = [] }, env) {
    const results = [];
    for (const item of items) {
      try {
        const tFn = PROMPTS[item.type] || PROMPTS.general;
        const { text, model } = await analyze_(tFn(item.prompt), env, tokenBudget(item.type || 'general'), item.type === 'news' ? 0.2 : 0.55);
        results.push({ id: item.id, success: true, analysis: text, model });
      } catch (e) {
        results.push({ id: item.id, success: false, error: e.message });
      }
      await new Promise(r => setTimeout(r, 200));
    }
    return { results, total: items.length, success: results.filter(r => r.success).length };
  },

  async translateTitles({ titles = [] }, env) {
    const results = [];
    for (const t of titles) {
      const en = t.en || t.title || '';
      try {
        const { text } = await analyze_(PROMPTS.news(en), env, tokenBudget('news'), 0.2);
        results.push({ id: t.id, en, zh: text.replace(/^['"「」]+|['"「」]+$/g, '').trim() });
      } catch {
        results.push({ id: t.id, en, zh: en });
      }
      await new Promise(r => setTimeout(r, 150));
    }
    return { results };
  },

  async diagnose({}, env) {
    const key = env.GROQ_API_KEY;
    if (!key) return { ok: false, error: 'GROQ_API_KEY 未設定', provider: 'groq' };
    const model = getModels(env)[0];
    try {
      await callGroq('回覆數字1', model, key, 5, 0.1);
      return { ok: true, provider: 'groq', active_model: model };
    } catch (e) {
      return { ok: false, provider: 'groq', error: e.message.slice(0, 220), error_status: e.status };
    }
  },
};
