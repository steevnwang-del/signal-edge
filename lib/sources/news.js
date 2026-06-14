/**
 * 新聞數據源
 * RSS Feeds（免費無限） + News API + Reddit
 * actions: getRSS, getByTeam, getLatest, getReddit
 */

const RSS_FEEDS = {
  espn:       'https://www.espn.com/espn/rss/news',
  bbc_sport:  'https://feeds.bbci.co.uk/sport/rss.xml',
  sky_sports: 'https://www.skysports.com/rss/12040',
  goal:       'https://www.goal.com/feeds/en/news',
  dot_esports:'https://dotesports.com/feed',
  hltv:       'https://www.hltv.org/rss/news',
  odds_action:'https://www.oddsshark.com/rss.xml',
};

const parseRSS = async (url) => {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'SignalEdge/1.0' } });
    const text = await r.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1];
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link  = item.match(/<link>(.*?)<\/link>/)?.[1] || item.match(/<guid>(.*?)<\/guid>/)?.[1] || '';
      const pub   = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      if (title) items.push({ title: title.trim(), url: link.trim(), publishedAt: pub });
    }
    return items;
  } catch { return []; }
};

export default {
  // 拉取指定來源 RSS
  async getRSS({ source = 'espn', limit = 10 }, env) {
    const url = RSS_FEEDS[source];
    if (!url) return { error: `Unknown source: ${source}`, available: Object.keys(RSS_FEEDS) };
    const items = await parseRSS(url);
    return { articles: items.slice(0, limit), source };
  },

  // 拉取全部 RSS 來源並合併
  async getLatest({ limit = 20, sources }, env) {
    const targetSources = sources || Object.keys(RSS_FEEDS);
    const all = await Promise.all(
      targetSources.map(async s => {
        const items = await parseRSS(RSS_FEEDS[s]);
        return items.map(i => ({ ...i, source: s }));
      })
    );
    const merged = all.flat().sort((a,b) => new Date(b.publishedAt)-new Date(a.publishedAt));
    return { articles: merged.slice(0, limit), total: merged.length };
  },

  // 依關鍵字搜尋（用於賽事頁面顯示相關新聞）
  async getByTeam({ teams = [], limit = 5 }, env) {
    const all = await Promise.all(
      Object.entries(RSS_FEEDS).map(async ([source, url]) => {
        const items = await parseRSS(url);
        return items.filter(i => teams.some(t => i.title.toLowerCase().includes(t.toLowerCase()))).map(i=>({...i,source}));
      })
    );
    return { articles: all.flat().slice(0, limit), teams };
  },

  // News API（需key，每天100次免費）
  async getNewsAPI({ query, category = 'sports', lang = 'en', limit = 10 }, env) {
    if (!env.NEWS_API_KEY) return { error: 'NEWS_API_KEY not configured' };
    const q = query || category;
    const r = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${lang}&pageSize=${limit}&sortBy=publishedAt&apiKey=${env.NEWS_API_KEY}`);
    const data = await r.json();
    return { articles: (data.articles||[]).map(a => ({ title:a.title, url:a.url, source:a.source.name, publishedAt:a.publishedAt })) };
  },

  // Reddit 體育討論（免費）
  async getReddit({ subreddit = 'soccer', sort = 'hot', limit = 10 }, env) {
    const r = await fetch(`https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`, { headers: { 'User-Agent': 'SignalEdge/1.0' } });
    const data = await r.json();
    const posts = (data.data?.children||[]).map(p=>({ title:p.data.title, url:`https://reddit.com${p.data.permalink}`, score:p.data.score, comments:p.data.num_comments }));
    return { posts, subreddit };
  },
};
