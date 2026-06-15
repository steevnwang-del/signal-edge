/**
 * AI Provider - 統一介面
 * 自動 fallback：Gemini → Groq
 * 環境變數：AI_PROVIDER=auto|gemini|groq
 *
 * 用法（在 cron/其他地方直接用這個，不用管哪個 AI）：
 *   import aiProvider from '../../lib/sources/aiProvider.js';
 *   const { analysis, provider, model } = await aiProvider.analyze({ prompt, type }, process.env);
 */

import gemini from './gemini.js';
import groq   from './groq.js';

const getProvider = (env) => (env.AI_PROVIDER || 'auto').toLowerCase();

// 根據設定決定嘗試順序
const getProviders = (env) => {
  const p = getProvider(env);
  if (p === 'gemini') return [gemini];
  if (p === 'groq')   return [groq];
  // auto：Gemini 有 key 就先試，否則直接用 Groq
  const order = [];
  if (env.GEMINI_API_KEY) order.push(gemini);
  if (env.GROQ_API_KEY)   order.push(groq);
  return order;
};

const withFallback = async (method, params, env) => {
  const providers = getProviders(env);
  if (providers.length === 0) {
    throw new Error('無可用 AI provider，請設定 GEMINI_API_KEY 或 GROQ_API_KEY');
  }
  let lastError;
  for (const provider of providers) {
    try {
      const result = await provider[method](params, env);
      return result;
    } catch (e) {
      console.warn(`[aiProvider] ${provider === gemini ? 'Gemini' : 'Groq'} failed: ${e.message.slice(0, 100)}`);
      lastError = e;
    }
  }
  throw lastError;
};

export default {
  async analyze(params, env)        { return withFallback('analyze', params, env); },
  async batch(params, env)          { return withFallback('batch', params, env); },
  async translateTitles(params, env){ return withFallback('translateTitles', params, env); },

  async diagnose({}, env) {
    const geminiResult = env.GEMINI_API_KEY ? await gemini.diagnose({}, env) : { ok: false, error: '未設定', provider: 'gemini' };
    const groqResult   = env.GROQ_API_KEY   ? await groq.diagnose({}, env)   : { ok: false, error: '未設定', provider: 'groq'   };

    const activeProvider = geminiResult.ok ? 'gemini' : groqResult.ok ? 'groq' : null;

    return {
      ok: activeProvider !== null,
      active_provider: activeProvider,
      configured_provider: getProvider(env),
      gemini: geminiResult,
      groq:   groqResult,
      // 不洩漏任何 key 資訊
    };
  },
};
