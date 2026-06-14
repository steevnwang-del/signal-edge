// 各運動免費API統一入口
const BASE = {
  NBA: 'https://api.balldontlie.io/v1',
  MLB: 'https://statsapi.mlb.com/api/v1',
  LIQUIPEDIA: 'https://liquipedia.net/leagueoflegends/api.php',
};

export const searchPlayer = async (name, sport) => {
  const r = await fetch(`/api/search-player?name=${encodeURIComponent(name)}&sport=${sport}`);
  return r.json();
};

export const getOdds = async (sport = 'upcoming', region = 'eu') => {
  const r = await fetch(`/api/odds?sport=${sport}&region=${region}`);
  return r.json();
};

export const getNBAPlayers = async (search) => {
  try {
    const r = await fetch(`${BASE.NBA}/players?search=${encodeURIComponent(search)}&per_page=10`);
    const d = await r.json();
    return d.data || [];
  } catch { return []; }
};

export const getNBAPlayerStats = async (playerId, season = 2024) => {
  try {
    const r = await fetch(`${BASE.NBA}/season_averages?season=${season}&player_ids[]=${playerId}`);
    const d = await r.json();
    return d.data?.[0] || null;
  } catch { return null; }
};

export const getMLBPlayer = async (name) => {
  try {
    const r = await fetch(`${BASE.MLB}/people/search?names=${encodeURIComponent(name)}&sportId=1`);
    const d = await r.json();
    return d.people?.[0] || null;
  } catch { return null; }
};

// 計算百分位數（在陣列中的相對位置）
export const calcPercentile = (value, allValues, higher = true) => {
  if (!allValues?.length) return 50;
  const sorted = [...allValues].sort((a, b) => a - b);
  const idx = sorted.findIndex(v => v >= value);
  const pct = Math.round((idx / sorted.length) * 100);
  return higher ? pct : 100 - pct;
};

// NBA 統計轉換為百分位雷達圖數據
export const nbaStatsToRadar = (stats, leagueAverages = {}) => {
  if (!stats) return null;
  return [
    { label: '得分效率', value: Math.min(100, Math.round((stats.fg_pct || 0.45) * 200)), raw: `FG% ${((stats.fg_pct||0)*100).toFixed(1)}%` },
    { label: '進攻貢獻', value: Math.min(100, Math.round((stats.pts || 15) * 2.5)), raw: `${(stats.pts||0).toFixed(1)} PPG` },
    { label: '防守貢獻', value: Math.min(100, Math.round((stats.stl || 0.8) * 50 + (stats.blk || 0.4) * 30)), raw: `抄截 ${(stats.stl||0).toFixed(1)} 蓋帽 ${(stats.blk||0).toFixed(1)}` },
    { label: '籃板控制', value: Math.min(100, Math.round((stats.reb || 5) * 7)), raw: `${(stats.reb||0).toFixed(1)} RPG` },
    { label: '傳球創造', value: Math.min(100, Math.round((stats.ast || 3) * 10)), raw: `${(stats.ast||0).toFixed(1)} APG` },
    { label: '綜合效率', value: Math.min(100, Math.round(((stats.pts||0)+(stats.reb||0)+(stats.ast||0)-(stats.turnover||0)) * 2.5)), raw: `PER估算 ${((stats.pts||0)+(stats.reb||0)+(stats.ast||0)).toFixed(1)}` },
  ];
};
