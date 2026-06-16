// V6B-1 Cron / Admin manual trigger
// Data first: normalize upcoming odds into canonical events, run deterministic model, then ask AI only to narrate DATA_BLOCK.

import aiProvider from '../../lib/sources/aiProvider.js';
import { getAdminDB, getAdminInitStatus, adminTimestamp } from '../../lib/server/firebaseAdmin.js';
import { buildAnalysisFromOddsEvent, buildPromptFromDataBlock, fallbackNarrative, SPORT_MAP } from '../../lib/core/analysisBuilder.js';
import { taipeiWindow, taipeiDateKey } from '../../lib/core/timeBuckets.js';


const removeUndefined = (obj) => {
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)])
    );
  }
  return obj;
};

const getWritableDB = () => {
  const adminDb = getAdminDB(process.env);
  if (adminDb) return { type: 'admin', db: adminDb, adminStatus: getAdminInitStatus(process.env) };
  return { type: 'none', db: null, adminStatus: getAdminInitStatus(process.env) };
};

const requireWritableDB = () => {
  const ctx = getWritableDB();
  if (!ctx.db) {
    throw new Error(`Firebase Admin 未啟用，無法寫入快取。${ctx.adminStatus?.lastError || '請確認 Vercel Production 的 FIREBASE_SERVICE_ACCOUNT_JSON，設定後重新 Deploy。'}`);
  }
  return ctx;
};

const readSiteSettings = async (ctx) => {
  try {
    if (!ctx?.db) return {};
    if (ctx.type === 'admin') {
      const snap = await ctx.db.collection('settings').doc('site').get();
      return snap.exists ? snap.data() : {};
    }
    return {};
  } catch (e) { console.warn('[Cron] read settings skipped:', e.message); return {}; }
};

const writeCache = async (ctx, id, data) => {
  if (!ctx?.db) throw new Error('Firestore Admin DB 未初始化');
  await ctx.db.collection('cache').doc(id).set({ ...data, updatedAt: adminTimestamp() }, { merge: true });
};

const writeAnalysis = async (ctx, id, data) => {
  if (!ctx?.db || !id) throw new Error('Firestore Admin DB 未初始化');
  await ctx.db.collection('analyses').doc(id).set({ ...data, updatedAt: adminTimestamp(), createdAt: data.createdAt || adminTimestamp() }, { merge: true });
  return id;
};

const isAuthorized = (req) => {
  if (process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (req.method === 'POST' && req.headers['x-admin-trigger']) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
};

const fetchOdds = async ({ daysFrom = 3, region = 'eu' } = {}) => {
  const url = `https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=${region}&markets=h2h&oddsFormat=decimal&dateFormat=iso&apiKey=${process.env.ODDS_API_KEY}&daysFrom=${daysFrom}`;
  const r = await fetch(url);
  const data = await r.json().catch(() => []);
  if (!r.ok) throw new Error(data?.message || data?.error || `The Odds API HTTP ${r.status}`);
  return {
    events: Array.isArray(data) ? data : [],
    usage: {
      remaining: Number(r.headers.get('x-requests-remaining') || 0),
      used: Number(r.headers.get('x-requests-used') || 0),
    },
  };
};

const getAIAnalysis = async (dataBlock, settings) => {
  try {
    const prompt = buildPromptFromDataBlock(dataBlock, settings);
    const result = await aiProvider.analyze({ prompt, type: 'match' }, process.env);
    return result?.analysis || null;
  } catch (e) {
    console.warn('[Cron] aiProvider failed:', e.message);
    return null;
  }
};

const sortForDashboard = (a, b) => {
  const rank = { BET: 0, LEAN: 1, WAIT: 2, NO_BET: 3 };
  return (rank[a.decision] ?? 9) - (rank[b.decision] ?? 9)
    || (b.ev || 0) - (a.ev || 0)
    || new Date(a.commence_time || 0) - new Date(b.commence_time || 0);
};

const buildSections = (analyses = []) => {
  const today = analyses.filter(a => a.bucket === 'today').sort(sortForDashboard);
  const future = analyses.filter(a => a.bucket === 'future').sort((a,b)=>new Date(a.commence_time)-new Date(b.commence_time)).slice(0, 24);
  const past = analyses.filter(a => a.bucket === 'past').sort((a,b)=>new Date(b.commence_time)-new Date(a.commence_time)).slice(0, 12);
  return {
    today,
    future,
    past,
    value: today.filter(a => ['BET','LEAN'].includes(a.decision)),
    watch: today.filter(a => a.decision === 'WAIT'),
    lowData: today.filter(a => Number(a.dataCompleteness || 0) < 60),
  };
};

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ success: false, error: 'Unauthorized' });
  if (!process.env.ODDS_API_KEY) return res.status(500).json({ success: false, error: 'ODDS_API_KEY 未設定' });

  let dbCtx;
  try { dbCtx = requireWritableDB(); }
  catch (e) { return res.status(500).json({ success: false, error: e.message, adminStatus: getAdminInitStatus(process.env) }); }

  const siteSettings = await readSiteSettings(dbCtx);
  const autoCount = Number(siteSettings?.analysisSettings?.autoGenerateCount || 18);
  const now = new Date();
  const windowTW = taipeiWindow(now);
  const results = [];

  try {
    const odds = await fetchOdds({ daysFrom: 3, region: siteSettings?.analysisSettings?.oddsRegion || 'eu' });
    await writeCache(dbCtx, 'odds', { events: odds.events, source: 'the-odds-api', usage: odds.usage });

    const normalized = odds.events
      .filter(ev => SPORT_MAP[ev.sport_key])
      .map(ev => buildAnalysisFromOddsEvent(ev, { now }))
      .filter(Boolean)
      .sort((a, b) => new Date(a.commence_time || 0) - new Date(b.commence_time || 0));

    const todays = normalized.filter(a => a.bucket === 'today');
    const futures = normalized.filter(a => a.bucket === 'future').slice(0, Math.max(8, autoCount));
    const toGenerate = [...todays, ...futures]
      .slice(0, autoCount)
      .sort(sortForDashboard);

    for (const item of toGenerate) {
      try {
        const analysis = await getAIAnalysis(item.dataBlock, siteSettings);
        const docData = {
          ...item,
          analysis: analysis || fallbackNarrative(item),
          provider: analysis ? 'aiProvider' : 'fallback_text',
          aiStatus: analysis ? 'done' : 'fallback',
          autoGenerated: true,
          promptVersion: siteSettings?.promptMeta?.version || null,
          evType: 'model_probability_x_decimal_odds',
          modelNote: item.dataBlock.method,
        };
        await writeAnalysis(dbCtx, item.id, docData);
        results.push({ id: item.id, match: `${item.home} vs ${item.away}`, sport: item.sport, bucket: item.bucket, decision: item.decision, status: 'ok' });
        await new Promise(r => setTimeout(r, 450));
      } catch (e) {
        results.push({ id: item.id, match: `${item.home} vs ${item.away}`, status: 'error', error: e.message });
      }
    }

    const generatedMap = new Map();
    for (const r of results.filter(x => x.status === 'ok')) generatedMap.set(r.id, true);
    const dashboardItems = normalized.map(item => ({
      ...item,
      analysis: generatedMap.has(item.id) ? null : fallbackNarrative(item),
      aiStatus: generatedMap.has(item.id) ? 'done' : 'model_only',
    }));
    const sections = buildSections(dashboardItems);

    const cleanSections = removeUndefined(sections);
    const cleanItems = removeUndefined([...sections.today, ...sections.future].slice(0, 80));
    await writeCache(dbCtx, 'todayDashboard', {
      dateKey: taipeiDateKey(now),
      window: { start: windowTW.start.toISOString(), end: windowTW.end.toISOString(), timezone: 'Asia/Taipei' },
      source: 'v6b-model-cache',
      sourceCoverage: { odds: true, football: false, nba: false, mlb: false, esports: false },
      modelVersion: 'v6b-1-market-poisson-mvp',
      oddsUsage: odds.usage,
      sections: cleanSections,
      items: cleanItems,
      generatedAt: now.toISOString(),
      note: '今日賽事只包含台灣時間今日至隔日凌晨 04:00；未來賽事與舊資料不混入今日。',
    });

    const failed = results.filter(r => r.status === 'error').length;
    res.json({
      success: true,
      firestore: dbCtx.type,
      generated: results.length - failed,
      failed,
      totalCanonicalEvents: normalized.length,
      todayCount: sections.today.length,
      futureCount: sections.future.length,
      modelVersion: 'v6b-1-market-poisson-mvp',
      time: now.toISOString(),
      results,
    });
  } catch (e) {
    console.error('[generate-analysis]', e);
    res.status(500).json({ success: false, error: e.message, firestore: dbCtx?.type || 'none', adminStatus: getAdminInitStatus(process.env), results });
  }
}
