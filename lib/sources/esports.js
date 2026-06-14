/**
 * 電競數據源
 * Riot Games API + OpenDota + PandaScore + Liquipedia
 * actions: lolPlayer, dota2Player, getMatches, getTeam
 */
export default {
  // LOL 選手數據（需 Riot API Key）
  async lolPlayer({ summonerName, region = 'kr' }, env) {
    const base = `https://${region}.api.riotgames.com`;
    const headers = { 'X-Riot-Token': env.RIOT_API_KEY };
    const summoner = await fetch(`${base}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`, { headers }).then(r=>r.json());
    if (summoner.status) return { error: summoner.status.message };
    const ranked = await fetch(`${base}/lol/league/v4/entries/by-summoner/${summoner.id}`, { headers }).then(r=>r.json());
    const soloQ = ranked.find(r=>r.queueType==='RANKED_SOLO_5x5');
    return { summoner, ranked: soloQ || null };
  },

  // Dota2 選手（完全免費）
  async dota2Player({ accountId }, env) {
    const [player, recent, heroes] = await Promise.all([
      fetch(`https://api.opendota.com/api/players/${accountId}`).then(r=>r.json()),
      fetch(`https://api.opendota.com/api/players/${accountId}/recentMatches`).then(r=>r.json()),
      fetch(`https://api.opendota.com/api/players/${accountId}/heroes?limit=5`).then(r=>r.json()),
    ]);
    const winRate = recent.length ? Math.round(recent.filter(m=>m.radiant_win===(m.player_slot<128)).length/recent.length*100) : 0;
    return { player, winRate, topHeroes: heroes.slice(0,5), recentGames: recent.length };
  },

  // 電競賽事（PandaScore，需key）
  async getMatches({ sport = 'lol', status = 'upcoming', limit = 10 }, env) {
    const r = await fetch(`https://api.pandascore.co/${sport}/matches/${status}?per_page=${limit}`, {
      headers: { 'Authorization': `Bearer ${env.PANDASCORE_KEY}` }
    });
    const data = await r.json();
    return { matches: data || [], sport };
  },

  // Liquipedia 隊伍資料（完全免費）
  async getTeam({ teamName, game = 'leagueoflegends' }, env) {
    const r = await fetch(`https://liquipedia.net/${game}/api.php?action=parse&page=${encodeURIComponent(teamName)}&prop=text&format=json&origin=*`);
    const data = await r.json();
    return { page: data.parse?.title, game };
  },

  // CS2 排名（HLTV unofficial）
  async cs2Rankings({}, env) {
    return { note: 'CS2 rankings available via HLTV scraping - contact admin for setup', teams: [] };
  },
};
