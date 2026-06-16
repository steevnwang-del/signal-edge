/**
 * News source: RSS + News API + Reddit
 * v4: no browser CORS, safer RSS timeouts, allSettled feeds, bounded translation.
 */

const RSS_FEEDS = {
  // 英文主流體育
  espn:          'https://www.espn.com/espn/rss/news',
  bbc_sport:     'https://feeds.bbci.co.uk/sport/rss.xml',
  sky_sports:    'https://www.skysports.com/rss/12040',
  goal:          'https://www.goal.com/feeds/en/news',
  yahoo_sports:  'https://sports.yahoo.com/rss/',
  yahoo_soccer:  'https://sports.yahoo.com/soccer/rss',
  // 電競
  dot_esports:   'https://dotesports.com/feed',
  hltv:          'https://www.hltv.org/rss/news',
  // 世界杯專區
  fifa_news:     'https://www.fifa.com/feeds/news/en',
  goal_wc:       'https://www.goal.com/feeds/en/news?tag=2026-world-cup',
  // 中文體育（繁體）
  udn_sports:    'https://sports.udn.com/sports/rss/news',
  ctv_sports:    'https://www.ctvnews.ca/rss/sports',
};

// 哪些 source 屬於世界杯專區
const WC_SOURCES = ['fifa_news', 'goal_wc'];
// 哪些 source 是中文
const ZH_SOURCES = ['udn_sports'];

const SOURCE_LABELS = {
  espn: 'ESPN', bbc_sport: 'BBC Sport', sky_sports: 'Sky Sports', goal: 'Goal.com',
  yahoo_sports: 'Yahoo Sports', yahoo_soccer: 'Yahoo Soccer',
  dot_esports: 'Dot Esports', hltv: 'HLTV',
  fifa_news: 'FIFA', goal_wc: 'Goal WC',
  udn_sports: '聯合新聞網', ctv_sports: 'CTV Sports',
  newsapi: 'NewsAPI', reddit: 'Reddit', fallback: 'SignalEdge',
};

const decode = (s = '') => String(s)
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .trim();

const stripTags = (s = '') => decode(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const first = (text, patterns) => {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return decode(m[1]);
  }
  return '';
};

const timeoutSignal = (ms, label) => {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(new Error(`${label} timeout`)), ms);
  return { signal: ac.signal, clear: () => clearTimeout(timer) };
};

const fetchText = async (url, ms = 4500) => {
  const t = timeoutSignal(ms, 'RSS');
  try {
    const r = await fetch(url, {
      signal: t.signal,
      headers: {
        'User-Agent': 'SignalEdge/1.0 (+https://signal-edge-hews.vercel.app)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally { t.clear(); }
};

const extractUrl = (block) => {
  let url = first(block, [/<link[^>]*>([\s\S]*?)<\/link>/i]);
  if (!url || url.includes('<')) url = first(block, [/<link[^>]+href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i]);
  if (!url || url.includes('<')) url = first(block, [/<guid[^>]*isPermaLink=["']true["'][^>]*>([\s\S]*?)<\/guid>/i, /<guid[^>]*>([\s\S]*?)<\/guid>/i]);
  if (!url || url.includes('<')) url = first(block, [/<feedburner:origLink[^>]*>([\s\S]*?)<\/feedburner:origLink>/i]);
  url = stripTags(url);
  if (!/^https?:\/\//i.test(url)) return '';
  return url;
};

const parseRSS = async (url, source = 'rss') => {
  try {
    const text = await fetchText(url);
    const itemBlocks = [];
    const itemRegex = /<item\b[\s\S]*?<\/item>/gi;
    const entryRegex = /<entry\b[\s\S]*?<\/entry>/gi;
    let m;
    while ((m = itemRegex.exec(text))) itemBlocks.push(m[0]);
    while ((m = entryRegex.exec(text))) itemBlocks.push(m[0]);

    return itemBlocks.map((block, idx) => {
      const title = stripTags(first(block, [/<title[^>]*>([\s\S]*?)<\/title>/i]));
      const link = extractUrl(block);
      const pub = stripTags(first(block, [/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i, /<published[^>]*>([\s\S]*?)<\/published>/i, /<updated[^>]*>([\s\S]*?)<\/updated>/i]));
      const summary = stripTags(first(block, [/<description[^>]*>([\s\S]*?)<\/description>/i, /<summary[^>]*>([\s\S]*?)<\/summary>/i]));
      let publishedAt = new Date().toISOString();
      try { if (pub) publishedAt = new Date(pub).toISOString(); } catch {}
      return {
        id: `${source}-${idx}-${Buffer.from(title || link || String(idx)).toString('base64').slice(0, 10)}`,
        title,
        url: link,
        publishedAt,
        summary,
      };
    }).filter(a => a.title && a.url);
  } catch (e) {
    console.warn(`[News] ${source} failed:`, e.name === 'AbortError' ? 'RSS timeout' : e.message);
    return [];
  }
};

const detectSport = (title = '') => {
  const t = title.toLowerCase();
  if (/league of legends|\blol\b|msi|worlds|lck|lpl|lec|lcs|valorant|cs2|counter-strike|dota/.test(t)) return '電競';
  if (/world cup 2026|fifa world cup|2026 世界杯|世界盃/.test(t)) return '世界杯';
  if (/world cup|fifa|premier league|champions league|soccer|football|transfer/.test(t)) return '足球';
  if (/nba|basketball|wnba/.test(t)) return 'NBA';
  if (/mlb|baseball|yankees|dodgers|mets|phillies/.test(t)) return 'MLB';
  if (/ufc|mma/.test(t)) return 'UFC';
  return '綜合';
};

const withTimeout = (promise, ms, fallback) => new Promise(resolve => {
  const timer = setTimeout(() => resolve(fallback), ms);
  promise.then(v => { clearTimeout(timer); resolve(v); }).catch(() => { clearTimeout(timer); resolve(fallback); });
});

const translateArticles = async (articles, env, mode = 'safe') => {
  if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY) return articles;
  const maxTranslate = mode === true ? 40 : 12;
  try {
    const aiProvider = (await import('./aiProvider.js')).default;
    const targets = articles.slice(0, maxTranslate).map((a, i) => ({ id: a.id || i, en: a.title }));
    const fallback = { results: targets.map(t => ({ id: t.id, zh: null })) };
    const out = await withTimeout(aiProvider.translateTitles({ titles: targets }, env), mode === true ? 12000 : 7000, fallback);
    const map = new Map((out.results || []).map(r => [r.id, r.zh]));
    return articles.map(a => ({ ...a, titleZh: map.get(a.id) || null }));
  } catch (e) {
    console.warn('[News] translate skipped:', e.message);
    return articles;
  }
};

const normalizeAndSort = (items, limit) => items
  .filter(a => a.title && a.url)
  .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
  .slice(0, limit);

export default {
  async getRSS({ source = 'espn', limit = 10, translate = 'safe' }, env) {
    const url = RSS_FEEDS[source];
    if (!url) return { error: `Unknown source: ${source}`, available: Object.keys(RSS_FEEDS), articles: [] };
    let articles = (await parseRSS(url, source)).map(a => ({ ...a, source, sourceLabel: SOURCE_LABELS[source], sport: detectSport(a.title) })).slice(0, limit);
    if (translate) articles = await translateArticles(articles, env, translate);
    return { articles, source, total: articles.length };
  },

  // 取得世界杯專區新聞
  async getWorldCup({ limit = 15, translate = 'safe' }, env) {
    const wcSources = ['fifa_news', 'goal_wc', 'espn', 'yahoo_soccer', 'bbc_sport'];
    const all = await Promise.allSettled(wcSources.map(async s => {
      const url = RSS_FEEDS[s]; if (!url) return [];
      const items = await parseRSS(url, s);
      return items.filter(a => /world cup|fifa|2026|mundial/i.test(a.title)).map(i => ({ ...i, source: s, isWorldCup: true }));
    }));
    const merged = all.flatMap(r => r.status === 'fulfilled' ? r.value : [])
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
    let articles = merged;
    if (translate) articles = await translateArticles(articles, env, translate);
    return { articles, source: 'worldcup_aggregated', count: articles.length };
  },

  async getLatest({ limit = 30, sources, translate = 'safe' }, env) {
    const targetSources = sources?.length ? sources : Object.keys(RSS_FEEDS);
    const settled = await Promise.allSettled(targetSources.map(async source => {
      const url = RSS_FEEDS[source];
      if (!url) return [];
      const items = await parseRSS(url, source);
      return items.map(i => ({ ...i, source, sourceLabel: SOURCE_LABELS[source], sport: detectSport(i.title) }));
    }));
    let merged = normalizeAndSort(settled.flatMap(r => r.status === 'fulfilled' ? r.value : []), limit);
    if (translate) merged = await translateArticles(merged, env, translate);
    return { articles: merged, total: merged.length, sources: targetSources };
  },

  async getByTeam({ teams = [], limit = 5, translate = 'safe' }, env) {
    const keys = teams.map(t => String(t).toLowerCase()).filter(Boolean);
    const settled = await Promise.allSettled(Object.entries(RSS_FEEDS).map(async ([source, url]) => {
      const items = await parseRSS(url, source);
      return items.filter(i => keys.some(t => i.title.toLowerCase().includes(t))).map(i => ({ ...i, source, sourceLabel: SOURCE_LABELS[source], sport: detectSport(i.title) }));
    }));
    let articles = normalizeAndSort(settled.flatMap(r => r.status === 'fulfilled' ? r.value : []), limit);
    if (translate) articles = await translateArticles(articles, env, translate);
    return { articles, teams };
  },

  async getNewsAPI({ query, category = 'sports', lang = 'en', limit = 10 }, env) {
    if (!env.NEWS_API_KEY) return { error: 'NEWS_API_KEY not configured', articles: [] };
    const q = query || category;
    const r = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${lang}&pageSize=${limit}&sortBy=publishedAt&apiKey=${env.NEWS_API_KEY}`);
    const data = await r.json();
    return { articles: (data.articles || []).map((a, i) => ({ id: `newsapi-${i}`, title: a.title, url: a.url, source: 'newsapi', sourceLabel: a.source?.name || 'NewsAPI', publishedAt: a.publishedAt, sport: detectSport(a.title) })) };
  },

  async getReddit({ subreddit = 'soccer', sort = 'hot', limit = 10 }, env) {
    const r = await fetch(`https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`, { headers: { 'User-Agent': 'SignalEdge/1.0' } });
    const data = await r.json();
    const posts = (data.data?.children || []).map(p => ({ title: p.data.title, url: `https://reddit.com${p.data.permalink}`, score: p.data.score, comments: p.data.num_comments }));
    return { posts, subreddit };
  },
};

