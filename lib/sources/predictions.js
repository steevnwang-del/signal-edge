/**
 * 外部預測數據源
 * 1. BSD (Bzzoiro Sports Data) - 免費 CatBoost ML 預測
 *    → 需要 BSD_API_KEY（免費：sports.bzzoiro.com/register）
 * 2. API-Football /predictions - 你已有 API_SPORTS_KEY
 *    → 每日 100 次免費
 * 3. Fallback: 根據賠率去水計算基礎預測
 */

const BSD_BASE = 'https://sports.bzzoiro.com/api';
const APF_BASE = 'https://v3.football.api-sports.io';

// BSD ML 預測（免費，無限請求）
const getBSDPredictions = async (env, { limit = 20 } = {}) => {
  if (!env.BSD_API_KEY) return [];
  try {
    const r = await fetch(`${BSD_BASE}/predictions/?page_size=${limit}`, {
      headers: { 'Authorization': `Token ${env.BSD_API_KEY}` },
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.results || []).map(p => ({
      source: 'BSD_CatBoost',
      homeTeam: p.event?.home_team,
      awayTeam: p.event?.away_team,
      league: p.event?.league?.name,
      commenceTime: p.event?.event_date,
      predictions: {
        homeWin: p.home_win_probability,
        draw: p.draw_probability,
        awayWin: p.away_win_probability,
      },
      advice: p.prediction || null,
      confidence: p.confidence || null,
    }));
  } catch { return []; }
};

// API-Football predictions（你已有 key）
const getAPIFootballPredictions = async (env, { fixtureId } = {}) => {
  if (!env.API_SPORTS_KEY) return null;
  try {
    const url = fixtureId
      ? `${APF_BASE}/predictions?fixture=${fixtureId}`
      : `${APF_BASE}/fixtures?live=all`;
    const r = await fetch(url, {
      headers: { 'x-apisports-key': env.API_SPORTS_KEY },
    });
    if (!r.ok) return null;
    const data = await r.json();
    const resp = data.response?.[0];
    if (!resp) return null;
    return {
      source: 'API-Football',
      winner: resp.predictions?.winner?.name,
      winnerComment: resp.predictions?.winner?.comment,
      advice: resp.predictions?.advice,
      percent: resp.predictions?.percent,
      homeForm: resp.teams?.home?.last_5?.form,
      awayForm: resp.teams?.away?.last_5?.form,
    };
  } catch { return null; }
};

// 取得今日足球預測（批次，for Cron）
const getTodayPredictions = async (env, { leagueId = 1 } = {}) => {
  if (!env.API_SPORTS_KEY) return [];
  try {
    const today = new Date().toISOString().split('T')[0];
    const r = await fetch(`${APF_BASE}/fixtures?date=${today}&league=${leagueId}&season=2026`, {
      headers: { 'x-apisports-key': env.API_SPORTS_KEY },
    });
    if (!r.ok) return [];
    const data = await r.json();
    const fixtures = data.response || [];

    // 對每場比賽抓預測（最多5場，節省配額）
    const results = [];
    for (const fix of fixtures.slice(0, 5)) {
      try {
        const pr = await fetch(`${APF_BASE}/predictions?fixture=${fix.fixture.id}`, {
          headers: { 'x-apisports-key': env.API_SPORTS_KEY },
        });
        if (!pr.ok) continue;
        const pd = await pr.json();
        const pred = pd.response?.[0];
        if (pred) {
          results.push({
            fixtureId: fix.fixture.id,
            homeTeam: fix.teams?.home?.name,
            awayTeam: fix.teams?.away?.name,
            commenceTime: fix.fixture?.date,
            source: 'API-Football',
            advice: pred.predictions?.advice,
            winner: pred.predictions?.winner?.name,
            percent: pred.predictions?.percent,
            homeForm: pred.teams?.home?.last_5?.form,
            awayForm: pred.teams?.away?.last_5?.form,
          });
        }
        await new Promise(r => setTimeout(r, 300));
      } catch {}
    }
    return results;
  } catch { return []; }
};

// 世界杯 2026 預測（league id = 1 for WC）
const getWorldCupPredictions = async (env) => {
  return getTodayPredictions(env, { leagueId: 1 });
};

export default {
  // BSD ML 預測
  async getBSDPredictions({ limit = 20 }, env) {
    const preds = await getBSDPredictions(env, { limit });
    return { predictions: preds, source: 'BSD_CatBoost', count: preds.length };
  },

  // API-Football 單場預測
  async getFixturePrediction({ fixtureId }, env) {
    const pred = await getAPIFootballPredictions(env, { fixtureId });
    return pred || { error: 'No prediction available', fixtureId };
  },

  // 今日世界杯預測
  async getWorldCupPredictions({}, env) {
    const preds = await getWorldCupPredictions(env);
    return { predictions: preds, count: preds.length };
  },

  // 所有來源合併（for Cron 增強分析用）
  async getAll({ leagueId = 1 }, env) {
    const [bsd, apf] = await Promise.all([
      getBSDPredictions(env, { limit: 30 }).catch(() => []),
      getTodayPredictions(env, { leagueId }).catch(() => []),
    ]);
    return {
      bsd: { count: bsd.length, predictions: bsd },
      apf: { count: apf.length, predictions: apf },
      total: bsd.length + apf.length,
    };
  },
};
