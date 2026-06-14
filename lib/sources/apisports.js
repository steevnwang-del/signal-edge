/**
 * API-Sports 統一狀態/使用量查詢
 * 一個 key 涵蓋：Football, Basketball, Baseball, AFL, F1
 */
const ENDPOINTS = {
  football:   'https://v3.football.api-sports.io',
  basketball: 'https://v1.basketball.api-sports.io',
  baseball:   'https://v1.baseball.api-sports.io',
  afl:        'https://v1.afl.api-sports.io',
  formula1:   'https://v1.formula-1.api-sports.io',
};

const apiCall = async (sport, path, env) => {
  const base = ENDPOINTS[sport] || ENDPOINTS.football;
  const r = await fetch(`${base}${path}`, {
    headers: { 'x-apisports-key': env.API_SPORTS_KEY }
  });
  return r.json();
};

export default {
  // 取得帳號使用量（所有運動共用 key，此 endpoint 回傳今日使用數）
  async getUsage({}, env) {
    const data = await apiCall('football', '/status', env);
    const requests = data?.response?.requests || {};
    return {
      used: requests.current || 0,
      total: requests.limit_day || 100,
      remaining: (requests.limit_day || 100) - (requests.current || 0),
      percent: Math.round((requests.current||0) / (requests.limit_day||100) * 100),
      plan: data?.response?.subscription?.plan || 'Free',
      sports: Object.keys(ENDPOINTS),
    };
  },

  // 足球賽事
  async getFootballFixtures({ league, season=2026, next=10 }, env) {
    return apiCall('football', `/fixtures?league=${league}&season=${season}&next=${next}`, env);
  },

  // NBA 比賽
  async getBasketballGames({ league='standard', season='2025-2026', date }, env) {
    const d = date || new Date().toISOString().split('T')[0];
    return apiCall('basketball', `/games?league=${league}&season=${season}&date=${d}`, env);
  },

  // 棒球比賽
  async getBaseballGames({ league=1, date }, env) {
    const d = date || new Date().toISOString().split('T')[0];
    return apiCall('baseball', `/games?league=${league}&date=${d}`, env);
  },

  // F1 賽程
  async getF1Schedule({ season=2026 }, env) {
    return apiCall('formula1', `/races?season=${season}`, env);
  },
};
