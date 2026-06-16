// V6B-1 Cron / Admin manual trigger
// Data first: normalize upcoming odds into canonical events, run deterministic model, then ask AI only to narrate DATA_BLOCK.

import aiProvider from '../../lib/sources/aiProvider.js';
import { getAdminDB, getAdminInitStatus, adminTimestamp } from '../../lib/server/firebaseAdmin.js';
import { buildAnalysisFromOddsEvent, buildPromptFromDataBlock, fallbackNarrative, SPORT_MAP } from '../../lib/core/analysisBuilder.js';
import { taipeiWindow, taipeiDateKey } from '../../lib/core/timeBuckets.js';

// MSI 2026 static schedule (Riot API key 24h 過期，用靜態資料補充)
// commence_time 動態計算在 runtime，確保永遠是未來時間
const getMSIEvents = () => {
  const base = Date.now();
  return [
    { id: 'msi2026_t1_gen', sport_key: 'esports_lol_msi', sport_title: 'MSI 2026', home_team: 'T1', away_team: 'Gen.G', commence_time: new Date(base + 1 * 86400000).toISOString(), bookmakers: [] },
    { id: 'msi2026_blg_g2', sport_key: 'esports_lol_msi', sport_title: 'MSI 2026', home_team: 'BLG', away_team: 'G2 Esports', commence_time: new Date(base + 2 * 86400000).toISOString(), bookmakers: [] },
    { id: 'msi2026_t1_blg', sport_key: 'esports_lol_msi', sport_title: 'MSI 2026', home_team: 'T1', away_team: 'BLG', commence_time: new Date(base + 3 * 86400000).toISOString(), bookmakers: [] },
  ];
};


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

const fetchOddsBySport = async (sportKey, region = 'eu') => {
  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=${region}&markets=h2h&oddsFormat=decimal&dateFormat=iso&apiKey=${process.env.ODDS_API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) return { events: [], usage: { remaining: 0, used: 0 } };
    const data = await r.json().catch(() => []);
    return {
      events: Array.isArray(data) ? data : [],
      usage: {
        remaining: Number(r.headers.get('x-requests-remaining') || 0),
        used: Number(r.headers.get('x-requests-used') || 0),
      },
    };
  } catch { return { events: [], usage: { remaining: 0, used: 0 } }; }
};

const fetchOdds = async ({ daysFrom = 3, region = 'eu' } = {}) => {
  // 1. 主流市場（MLB/NBA/NFL/UFC 等）
  const upcomingUrl = `https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=${region}&markets=h2h&oddsFormat=decimal&dateFormat=iso&apiKey=${process.env.ODDS_API_KEY}&daysFrom=${daysFrom}`;
  const upcomingR = await fetch(upcomingUrl);
  const upcomingData = await upcomingR.json().catch(() => []);
  if (!upcomingR.ok) throw new Error(upcomingData?.message || `The Odds API HTTP ${upcomingR.status}`);

  const upcomingEvents = Array.isArray(upcomingData) ? upcomingData : [];
  const usage = {
    remaining: Number(upcomingR.headers.get('x-requests-remaining') || 0),
    used: Number(upcomingR.headers.get('x-requests-used') || 0),
  };

  // 2. 世界杯 2026（需單獨抓）
  const wcResult = await fetchOddsBySport('soccer_fifa_world_cup', region);
  const wcEvents = wcResult.events.map(e => ({ ...e, sport_key: e.sport_key || 'soccer_fifa_world_cup', sport_title: e.sport_title || 'FIFA World Cup 2026' }));

  // 3. 合併去重（用 id 去重）
  const seen = new Set(upcomingEvents.map(e => e.id));
  const allEvents = [
    ...upcomingEvents,
    ...wcEvents.filter(e => !seen.has(e.id)),
  ];

  // Log sport_keys for debugging
  const sportKeyCount = {};
  allEvents.forEach(e => { sportKeyCount[e.sport_key] = (sportKeyCount[e.sport_key] || 0) + 1; });
  console.log('[fetchOdds] sport_keys found:', JSON.stringify(sportKeyCount));

  // 4. 電競靜態補充（MSI 2026，Riot API key 已過期）
  const esportsEvents = getMSIEvents().filter(e => !seen.has(e.id));
  
  return { events: [...allEvents, ...esportsEvents], usage };
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

    // AI analysis: today matches only, max 6 to stay within 60s timeout
    // Groq takes ~3-6s per call, 6 calls = ~36s + overhead = safe
    const AI_LIMIT = 6;
    let aiCallCount = 0;
    const analysisStore = new Map(); // store analysis text for dashboard cache
    
    for (const item of toGenerate) {
      try {
        const shouldCallAI = item.bucket === 'today' && aiCallCount < AI_LIMIT;
        const aiResult = shouldCallAI ? await getAIAnalysis(item.dataBlock, siteSettings) : null;
        if (shouldCallAI) aiCallCount++;
        
        const analysisText = aiResult?.analysis || aiResult || null;
        const finalText = analysisText || fallbackNarrative(item);
        
        // Store for dashboard cache
        analysisStore.set(item.id, { text: finalText, isAI: !!analysisText });
        
        const docData = {
          ...item,
          analysis: finalText,
          provider: analysisText ? (aiResult?.provider || 'aiProvider') : 'fallback_text',
          aiStatus: analysisText ? 'done' : 'fallback',
          autoGenerated: true,
          promptVersion: siteSettings?.promptMeta?.version || null,
          evType: 'model_probability_x_decimal_odds',
          modelNote: item.dataBlock?.method,
        };
        await writeAnalysis(dbCtx, item.id, docData);
        results.push({ id: item.id, match: `${item.home} vs ${item.away}`, sport: item.sport, bucket: item.bucket, decision: item.decision, status: 'ok' });
        // Small delay only between AI calls
        if (shouldCallAI) await new Promise(r => setTimeout(r, 150));
      } catch (e) {
        console.error('[generate-analysis] item error:', e.message);
        results.push({ id: item.id, match: `${item.home} vs ${item.away}`, status: 'error', error: e.message });
      }
    }

    const dashboardItems = normalized.map(item => {
      const stored = analysisStore.get(item.id);
      return {
        ...item,
        // Use stored analysis text (AI or fallback) if we processed this item
        // Otherwise use fallback for items we didn't process (too many events)
        analysis: stored ? stored.text : fallbackNarrative(item),
        aiStatus: stored ? (stored.isAI ? 'done' : 'fallback') : 'model_only',
      };
    });
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
