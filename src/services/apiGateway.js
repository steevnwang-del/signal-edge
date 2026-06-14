/**
 * 前端 API Gateway 呼叫服務
 * 所有 API 呼叫統一走這裡
 * 
 * 使用方式：
 * import { gateway } from './apiGateway';
 * const result = await gateway('gemini', 'analyze', { prompt, type });
 * const result = await gateway('odds', 'getUpcoming', { region: 'eu' });
 * const result = await gateway('football', 'getTeam', { teamId: 5 });
 */

const ENDPOINT = '/api/gateway';

export const gateway = async (source, action, params = {}) => {
  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, action, params }),
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error || 'Gateway error');
    return data.result;
  } catch (err) {
    console.error(`[Gateway] ${source}.${action} failed:`, err);
    throw err;
  }
};

// 便捷方法
export const AI = {
  analyze:        (prompt, type)  => gateway('gemini', 'analyze', { prompt, type }),
  translateTitle: (titles)        => gateway('gemini', 'translateTitles', { titles }),
  batch:          (items)         => gateway('gemini', 'batch', { items }),
};

export const Odds = {
  upcoming:       (region)        => gateway('odds', 'getUpcoming', { region }),
  bySport:        (sport, region) => gateway('odds', 'getBySport', { sport, region }),
  calcEV:         (params)        => gateway('odds', 'calcEV', params),
};

export const Football = {
  matches:        (competition)   => gateway('football', 'getMatches', { competition }),
  team:           (teamId)        => gateway('football', 'getTeam', { teamId }),
  standings:      (competition)   => gateway('football', 'getStandings', { competition }),
  h2h:            (id1, id2)      => gateway('football', 'getH2H', { teamId1: id1, teamId2: id2 }),
};

export const NBA = {
  searchPlayer:   (name)          => gateway('nba', 'searchPlayer', { name }),
  playerStats:    (id, season)    => gateway('nba', 'getPlayerStats', { playerId: id, season }),
  games:          (date)          => gateway('nba', 'getGames', { date }),
};

export const MLB = {
  schedule:       (date)          => gateway('mlb', 'getSchedule', { date }),
  player:         (name)          => gateway('mlb', 'getPlayer', { name }),
};

export const Esports = {
  lolPlayer:      (name, region)  => gateway('esports', 'lolPlayer', { summonerName: name, region }),
  dota2Player:    (id)            => gateway('esports', 'dota2Player', { accountId: id }),
  matches:        (sport, status) => gateway('esports', 'getMatches', { sport, status }),
};

export const News = {
  latest:         (limit, sources)=> gateway('news', 'getLatest', { limit, sources }),
  byTeam:         (teams)         => gateway('news', 'getByTeam', { teams }),
  reddit:         (sub)           => gateway('news', 'getReddit', { subreddit: sub }),
  rss:            (source)        => gateway('news', 'getRSS', { source }),
};

export const Market = {
  sports:         ()              => gateway('polymarket', 'getSportsMarkets', {}),
  search:         (keyword)       => gateway('polymarket', 'getByKeyword', { keyword }),
};
