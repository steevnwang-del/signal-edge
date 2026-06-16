/**
 * News source: RSS + News API + Reddit
 * v3: robust RSS parsing, timeout, Atom support, title translation via aiProvider.
 */

const RSS_FEEDS = {
  espn:        'https://www.espn.com/espn/rss/news',
  bbc_sport:   'https://feeds.bbci.co.uk/sport/rss.xml',
  sky_sports:  'https://www.skysports.com/rss/12040',
  goal:        'https://www.goal.com/feeds/en/news',
  dot_esports: 'https://dotesports.com/feed',
  hltv:        'https://www.hltv.org/rss/news',
};

const SOURCE_LABELS = {
  espn: 'ESPN', bbc_sport: 'BBC Sport', sky_sports: 'Sky Sports', goal: 'Goal.com', dot_esports: 'Dot Esports', hltv: 'HLTV', newsapi: 'NewsAPI', reddit: 'Reddit',
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

const stripTags = (s = '') => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const first = (text, patterns) => {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return decode(m[1]);
  }
  return '';
};

const fetchText = async (url, ms = 8500) => {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { 'User-Agent': 'SignalEdge/1.0 (+https://signal-edge-hews.vercel.app)', 'Accept': 'application/rss+xml, application/xml, text/xml, */*' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally { clearTimeout(t); }
};

const extractUrl = (block) => {
  // RSS normal: <link>https://...</link>
  let url = first(block, [/<link[^>]*>([\s\S]*?)<\/link>/i]);
  // Some feeds put the URL in href="..."
  if (!url || url.includes('<')) url = first(block, [/<link[^>]+href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i]);
  // Some feeds use guid as URL
  if (!url || url.includes('<')) url = first(block, [/<guid[^>]*>([\s\S]*?)<\/guid>/i]);
  // Some feedburner links
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
      return {
        id: `${source}-${idx}-${Buffer.from(title || link || String(idx)).toString('base64').slice(0, 10)}`,
        title,
        url: link,
        publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
        summary,
      };
    }).filter(a => a.title && a.url);
  } catch (e) {
    console.warn(`[News] ${source} failed:`, e.message);
    return [];
  }
};

const detectSport = (title = '') => {
  const t = title.toLowerCase();
  if (/league of legends|\blol\b|msi|worlds|lck|lpl|lec|lcs|valorant|cs2|counter-strike|dota/.test(t)) return '電競';
  if (/world cup|fifa|premier league|champions league|soccer|football|transfer/.test(t)) return '足球';
  if (/nba|basketball|wnba/.test(t)) return 'NBA';
  if (/mlb|baseball|yankees|dodgers|mets|phillies/.test(t)) return 'MLB';
  if (/ufc|mma/.test(t)) return 'UFC';
  return '綜合';
};

const translateArticles = async (articles, env) => {
  if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY) return articles;
  try {
    const aiProvider = (await import('./aiProvider.js')).default;
    const titles = articles.slice(0, 20).map((a, i) => ({ id: a.id || i, en: a.title }));
    const out = await aiProvider.translateTitles({ titles }, env);
    const map = new Map((out.results || []).map(r => [r.id, r.zh]));
    return articles.map(a => ({ ...a, titleZh: map.get(a.id) || null }));
  } catch (e) {
    console.warn('[News] translate skipped:', e.message);
    return articles;
  }
};

export default {
  async getRSS({ source = 'espn', limit = 10, translate = false }, env) {
    const url = RSS_FEEDS[source];
    if (!url) return { error: `Unknown source: ${source}`, available: Object.keys(RSS_FEEDS) };
    let articles = (await parseRSS(url, source)).map(a => ({ ...a, source, sourceLabel: SOURCE_LABELS[source], sport: detectSport(a.title) })).slice(0, limit);
    if (translate) articles = await translateArticles(articles, env);
    return { articles, source, total: articles.length };
  },

  async getLatest({ limit = 30, sources, translate = true }, env) {
    const targetSources = sources?.length ? sources : Object.keys(RSS_FEEDS);
    const all = await Promise.all(targetSources.map(async source => {
      const url = RSS_FEEDS[source];
      if (!url) return [];
      const items = await parseRSS(url, source);
      return items.map(i => ({ ...i, source, sourceLabel: SOURCE_LABELS[source], sport: detectSport(i.title) }));
    }));
    let merged = all.flat()
      .filter(a => a.title && a.url)
      .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
      .slice(0, limit);
    if (translate) merged = await translateArticles(merged, env);
    return { articles: merged, total: merged.length, sources: targetSources };
  },

  async getByTeam({ teams = [], limit = 5, translate = true }, env) {
    const keys = teams.map(t => String(t).toLowerCase()).filter(Boolean);
    const all = await Promise.all(Object.entries(RSS_FEEDS).map(async ([source, url]) => {
      const items = await parseRSS(url, source);
      return items.filter(i => keys.some(t => i.title.toLowerCase().includes(t))).map(i => ({ ...i, source, sourceLabel: SOURCE_LABELS[source], sport: detectSport(i.title) }));
    }));
    let articles = all.flat().slice(0, limit);
    if (translate) articles = await translateArticles(articles, env);
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
