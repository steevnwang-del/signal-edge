// V6G Cron / Admin manual trigger
// Data first: normalize upcoming odds into canonical events, run deterministic model, then ask AI only to narrate DATA_BLOCK.

import aiProvider from '../../lib/sources/aiProvider.js';
import predictionsSource, { getApiFootballKey } from '../../lib/sources/predictions.js';
import { matchInsightsToEvent, matchAnalystsToEvent, matchAnalystPicksToEvent } from '../../lib/sources/insights.js';
import foreignMastersSource, { matchForeignMastersToEvent, buildForeignMasterConsensus } from '../../lib/sources/foreignMasters.js';
import { getAdminDB, getAdminInitStatus, adminTimestamp } from '../../lib/server/firebaseAdmin.js';
import { buildAnalysisFromOddsEvent, buildPromptFromDataBlock, fallbackNarrative, SPORT_MAP } from '../../lib/core/analysisBuilder.js';
import { taipeiWindow, taipeiDateKey } from '../../lib/core/timeBuckets.js';

// ─── 球隊背景資料（API-Football + football-data.org）───────────────────────
// 每場比賽嘗試抓近期戰績和傷兵，增厚 DATA_BLOCK 讓 AI 有料可寫
const WC_TEAM_IDS = {
  'France': 2, 'Brazil': 6, 'Argentina': 26, 'Spain': 9, 'England': 10,
  'Germany': 25, 'Portugal': 27, 'Netherlands': 1, 'Morocco': 31,
  'USA': 2415, 'Mexico': 16, 'Japan': 47, 'Uruguay': 38,
  'Senegal': 67, 'Croatia': 3, 'Switzerland': 15, 'Poland': 24,
  'Australia': 97, 'South Korea': 48, 'Saudi Arabia': 116, 'Canada': 107,
  'Ecuador': 40, 'Ghana': 96, 'Cameroon': 65, 'Serbia': 14,
  'Denmark': 21, 'Belgium': 4, 'Tunisia': 62, 'Iran': 55,
  'Qatar': 164, 'Costa Rica': 100, 'Colombia': 39, 'Venezuela': 79,
  'Panama': 168, 'Chile': 34, 'Paraguay': 37,
};

const fetchTeamContext = async (homeTeamEn, awayTeamEn, sport, env) => {
  if (!getApiFootballKey(env)) return null;
  const isSoccer = ['世界杯','英超','歐冠','西甲','德甲','義甲','法甲'].includes(sport);
  if (!isSoccer) return null;

  try {
    const homeId = WC_TEAM_IDS[homeTeamEn];
    const awayId = WC_TEAM_IDS[awayTeamEn];
    if (!homeId || !awayId) return null;

    const BASE = 'https://v3.football.api-sports.io';
    const headers = { 'x-apisports-key': getApiFootballKey(env) };
    
    // Fetch last 5 matches for both teams + H2H (parallel)
    const [homeFixtures, awayFixtures, h2h] = await Promise.all([
      fetch(`${BASE}/fixtures?team=${homeId}&last=5&status=FT`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${BASE}/fixtures?team=${awayId}&last=5&status=FT`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${BASE}/fixtures/headtohead?h2h=${homeId}-${awayId}&last=5`, { headers }).then(r => r.json()).catch(() => null),
    ]);

    const parseForm = (fixtures, teamId) => {
      if (!fixtures?.response) return 'N/A';
      return fixtures.response.slice(0, 5).map(f => {
        const isHome = f.teams?.home?.id === teamId;
        const homeGoals = f.goals?.home ?? 0;
        const awayGoals = f.goals?.away ?? 0;
        if (isHome) return homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D';
        return awayGoals > homeGoals ? 'W' : awayGoals < homeGoals ? 'L' : 'D';
      }).join('');
    };

    const parseGoals = (fixtures, teamId) => {
      if (!fixtures?.response) return null;
      const goals = fixtures.response.map(f => {
        const isHome = f.teams?.home?.id === teamId;
        return isHome ? (f.goals?.home ?? 0) : (f.goals?.away ?? 0);
      });
      return goals.length ? (goals.reduce((s,g) => s+g, 0) / goals.length).toFixed(1) : null;
    };

    const parseH2H = (h2h) => {
      if (!h2h?.response?.length) return null;
      const matches = h2h.response.slice(0, 5);
      return matches.map(f => {
        const h = f.goals?.home ?? 0;
        const a = f.goals?.away ?? 0;
        return `${f.teams?.home?.name} ${h}-${a} ${f.teams?.away?.name}`;
      }).join(' | ');
    };

    return {
      homeForm: parseForm(homeFixtures, homeId),
      awayForm: parseForm(awayFixtures, awayId),
      homeGoalsAvg: parseGoals(homeFixtures, homeId),
      awayGoalsAvg: parseGoals(awayFixtures, awayId),
      h2h: parseH2H(h2h),
      source: 'api-football',
    };
  } catch (e) {
    console.warn('[fetchTeamContext] failed:', e.message);
    return null;
  }
};

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

const readCache = async (ctx, id) => {
  if (!ctx?.db) return null;
  const snap = await ctx.db.collection('cache').doc(id).get();
  return snap.exists ? snap.data() : null;
};

const writeAnalysis = async (ctx, id, data) => {
  if (!ctx?.db || !id) throw new Error('Firestore Admin DB 未初始化');
  await ctx.db.collection('analyses').doc(id).set({ ...data, updatedAt: adminTimestamp(), createdAt: data.createdAt || adminTimestamp() }, { merge: true });
  return id;
};

const isAuthorized = (req) => {
  const auth = req.headers.authorization || req.headers.Authorization;
  const ua = String(req.headers['user-agent'] || req.headers['User-Agent'] || '');
  const isVercelCron = req.method === 'GET' && ua.includes('vercel-cron');
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (!process.env.CRON_SECRET && isVercelCron) return true;
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

  // 3. 補抓 V6F 六大項目中 upcoming 可能漏掉的市場（失敗時回空陣列，不中斷）
  const extraSportKeys = ['tennis_atp', 'tennis_wta', 'motorsport_formula1', 'motorsport_f1'];
  const extraResults = await Promise.all(extraSportKeys.map(k => fetchOddsBySport(k, region).catch(() => ({ events: [] }))));
  const extraEvents = extraResults.flatMap(r => r.events || []);

  // 4. 合併去重（用 id 去重）
  const seen = new Set(upcomingEvents.map(e => e.id));
  const allEvents = [
    ...upcomingEvents,
    ...wcEvents.filter(e => !seen.has(e.id)),
    ...extraEvents.filter(e => !seen.has(e.id)),
  ];

  // Log sport_keys for debugging
  const sportKeyCount = {};
  allEvents.forEach(e => { sportKeyCount[e.sport_key] = (sportKeyCount[e.sport_key] || 0) + 1; });
  console.log('[fetchOdds] sport_keys found:', JSON.stringify(sportKeyCount));

  // 5. 電競靜態補充（MSI 2026，Riot API key 已過期）
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


const normalizeName = (value = '') => String(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[🇦-🇿🏴]/gu, '')
  .replace(/[^a-zA-Z0-9 ]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const namesMatch = (a = '', b = '') => {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  const compactX = x.replace(/ /g, '');
  const compactY = y.replace(/ /g, '');
  return compactX === compactY || compactX.includes(compactY) || compactY.includes(compactX);
};

const flattenPredictions = (bundle = {}) => [
  ...(bundle?.bsd?.predictions || []),
  ...(bundle?.apf?.predictions || []),
  ...(bundle?.predictions || []),
].filter(Boolean);

const findPredictionForEvent = (event = {}, predictions = []) => {
  const exact = predictions.find(p =>
    namesMatch(p.homeTeam, event.home_team) && namesMatch(p.awayTeam, event.away_team)
  );
  if (exact) return exact;

  return predictions.find(p => {
    const teams = [p.homeTeam, p.awayTeam, p.winner].filter(Boolean);
    return teams.some(t => namesMatch(t, event.home_team) || namesMatch(t, event.away_team));
  }) || null;
};

const buildSections = (analyses = []) => {
  const today = analyses.filter(a => a.bucket === 'today').sort(sortForDashboard);
  const future = analyses.filter(a => a.bucket === 'future').sort((a,b)=>new Date(a.commence_time)-new Date(b.commence_time)).slice(0, 24);
  const past = analyses.filter(a => a.bucket === 'past').sort((a,b)=>new Date(b.commence_time)-new Date(a.commence_time)).slice(0, 12);
  return {
    today,
    future,
    past,
    highProbability: today.filter(a => Number(a.probabilityScore || a.dataBlock?.probabilityScore || 0) >= 68),
    value: today.filter(a => Number(a.valueScore || a.dataBlock?.valueScore || 0) >= 68 || ['BET','LEAN'].includes(a.decision)),
    watch: today.filter(a => a.decision === 'WAIT' || a.beginnerLane?.status === 'WAIT' || a.advancedLane?.status === 'WATCH_PRICE'),
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

    const [predictionBundle, insightsCache, foreignMastersCache] = await Promise.all([
      predictionsSource.getAll({ leagueId: 1 }, process.env).catch(e => ({ error: e.message, bsd: { predictions: [] }, apf: { predictions: [] }, total: 0 })),
      readCache(dbCtx, 'insights').catch(() => null),
      readCache(dbCtx, 'foreignMasters').catch(() => null),
    ]);
    const allPredictions = flattenPredictions(predictionBundle);
    const insightArticles = insightsCache?.articles || [];
    const analystRadar = insightsCache?.analystRadar || [];
    const analystPicks = insightsCache?.analystPicks || insightsCache?.foreignAnalystPicks || [];
    const autoMasterPosts = foreignMastersCache?.posts || [];
    const manualMasterPosts = foreignMastersCache?.manualItems || foreignMastersCache?.manualPosts || [];
    const allForeignMasterPosts = [...manualMasterPosts, ...autoMasterPosts];

    const normalized = odds.events
      .map(ev => {
        const matchedMasters = matchForeignMastersToEvent(allForeignMasterPosts, ev, { limit: 12 });
        const masterConsensus = buildForeignMasterConsensus(matchedMasters);
        return buildAnalysisFromOddsEvent(ev, {
          now,
          externalPrediction: findPredictionForEvent(ev, allPredictions),
          insights: matchInsightsToEvent(insightArticles, ev),
          analystSignals: matchAnalystsToEvent(analystRadar, ev),
          analystPicks: matchAnalystPicksToEvent(analystPicks, ev),
          foreignMasters: matchedMasters,
          foreignMasterConsensus: masterConsensus,
        });
      })
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
        // Fetch team context to enrich DATA_BLOCK (only for today's soccer matches)
        let enrichedDataBlock = item.dataBlock;
        if (item.bucket === 'today' && ['世界杯','英超','歐冠','西甲'].includes(item.sport)) {
          const ctx = await fetchTeamContext(item.homeEn || item.home, item.awayEn || item.away, item.sport, process.env);
          if (ctx) {
            enrichedDataBlock = {
              ...item.dataBlock,
              homeForm: ctx.homeForm,
              awayForm: ctx.awayForm,
              homeGoalsAvg: ctx.homeGoalsAvg,
              awayGoalsAvg: ctx.awayGoalsAvg,
              h2h: ctx.h2h,
              contextSource: ctx.source,
            };
          }
        }
        
        const shouldCallAI = item.bucket === 'today' && aiCallCount < AI_LIMIT;
        const aiResult = shouldCallAI ? await getAIAnalysis(enrichedDataBlock, siteSettings) : null;
        if (shouldCallAI) aiCallCount++;
        
        const analysisText = aiResult?.analysis || aiResult || null;
        const finalText = analysisText || fallbackNarrative({ ...item, dataBlock: enrichedDataBlock });
        
        // Store for dashboard cache
        analysisStore.set(item.id, { text: finalText, isAI: !!analysisText });
        
        const docData = {
          ...item,
          dataBlock: enrichedDataBlock,
          sourceCoverage: enrichedDataBlock.sourceCoverage,
          externalPrediction: enrichedDataBlock.externalPrediction || null,
          internationalInsights: enrichedDataBlock.internationalInsights || [],
          analystSignals: enrichedDataBlock.analystSignals || [],
          foreignAnalystPicks: enrichedDataBlock.foreignAnalystPicks || [],
          foreignMasters: enrichedDataBlock.foreignMasters || [],
          foreignMasterConsensus: enrichedDataBlock.foreignMasterConsensus || null,
          signalFusion: enrichedDataBlock.signalFusion || null,
          contentQuality: enrichedDataBlock.contentQuality || null,
          decisionEngine: enrichedDataBlock.decisionEngine || null,
          beginnerLane: enrichedDataBlock.beginnerLane || null,
          advancedLane: enrichedDataBlock.advancedLane || null,
          bettingConditions: enrichedDataBlock.bettingConditions || null,
          probabilityScore: enrichedDataBlock.probabilityScore || null,
          valueScore: enrichedDataBlock.valueScore || null,
          riskScore: enrichedDataBlock.riskScore || null,
          decisionTags: enrichedDataBlock.decisionTags || [],
          qualityScore: enrichedDataBlock.qualityScore || null,
          signalAlignmentScore: enrichedDataBlock.signalAlignmentScore || null,
          qualityTags: enrichedDataBlock.qualityTags || [],
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
      source: 'v6g-decision-cache',
      sourceCoverage: { odds: true, predictions: allPredictions.length > 0, internationalInsights: insightArticles.length > 0, analystRadar: analystRadar.length > 0, foreignMasters: allForeignMasterPosts.length > 0, football: Boolean(getApiFootballKey(process.env)), nba: true, mlb: true, esports: true, tennis: true, f1: true },
      modelVersion: 'v6g-decision-engine-quality-master-wall',
      oddsUsage: odds.usage,
      sections: cleanSections,
      items: cleanItems,
      generatedAt: now.toISOString(),
      note: 'V6G：今日賽事只包含台灣時間今日至隔日凌晨 04:00；支援足球、LOL、NBA、MLB、網球、F1；每場帶高機率分數、價值分數、風險分數、下注條件、內容質量與國外分析大師牆。',
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
      modelVersion: 'v6g-decision-engine-quality-master-wall',
      time: now.toISOString(),
      results,
    });
  } catch (e) {
    console.error('[generate-analysis]', e);
    res.status(500).json({ success: false, error: e.message, firestore: dbCtx?.type || 'none', adminStatus: getAdminInitStatus(process.env), results });
  }
}
