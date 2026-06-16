/**
 * 新聞數據源
 * RSS Feeds（免費） + News API + Reddit
 * actions: getRSS, getByTeam, getLatest, getNewsAPI, getReddit
 */

import aiProvider from './aiProvider.js';

const RSS_FEEDS = {
  espn:        'https://www.espn.com/espn/rss/news',
  bbc_sport:   'https://feeds.bbci.co.uk/sport/rss.xml',
  sky_sports:  'https://www.skysports.com/rss/12040',
  goal:        'https://www.goal.com/feeds/en/news',
  dot_esports: 'https://dotesports.com/feed',
  hltv:        'https://www.hltv.org/rss/news',
  odds_action: 'https://www.oddsshark.com/rss.xml',
};

const decodeHtml = (s = '') => String(s)
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&#x27;/g, "'")
  .replace(/&#x2F;/g, '/')
  .replace(/&apos;/g, "'")
  .trim();

const stripTags = (s = '') => decodeHtml(String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));

const getTag = (xml, tag) => {
  const m = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? decodeHtml(m[1]) : '';
};

const getAttr = (xml, tag, attr) => {
  const re = new RegExp(`<${tag}\\b[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, 'i');
  return decodeHtml(xml.match(re)?.[1] || '');
};

const normalizeUrl = (url = '') => {
  const u = decodeHtml(url).replace(/\s+/g, '').trim();
  if (!u) return '';
  if (u.startsWith('//')) return `https:${u}`;
  if (/^https?:\/\//i.test(u)) return u;
  return '';
};

const getLink = (item) => {
  // RSS standard: <link>https://...</link>
  let link = getTag(item, 'link');

  // Atom style: <link href="https://..." />
  if (!link || link.includes('<')) link = getAttr(item, 'link', 'href');

  // Some feeds render: <link/>https://example.com
  if (!link) {
    const m = item.match(/<link\b[^>]*\/>\s*([^<\s][^<]*)/i);
    if (m) link = m[1];
  }

  // Fallback to guid only if it is an actual URL
  if (!normalizeUrl(link)) {
    const guid = getTag(item, 'guid');
    if (normalizeUrl(guid)) link = guid;
  }

  // Fallback: first URL inside item block
  if (!normalizeUrl(link)) {
    const m = item.match(/https?:\/\/[^\s<"']+/i);
    if (m) link = m[0];
  }

  return normalizeUrl(link);
};

const parseRSS = async (url) => {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'SignalEdge/1.0 (+https://signal-edge-hews.vercel.app)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    if (!r.ok) return [];
    const text = await r.text();
    const blocks = [];

    const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    const entryRegex = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
    let match;
    while ((match = itemRegex.exec(text)) !== null) blocks.push(match[1]);
    while ((match = entryRegex.exec(text)) !== null) blocks.push(match[1]);

    return blocks.map((item, idx) => {
      const rawTitle = getTag(item, 'title') || getTag(item, 'media:title');
      const title = stripTags(rawTitle);
      const url = getLink(item);
      const pub = getTag(item, 'pubDate') || getTag(item, 'published') || getTag(item, 'updated') || getTag(item, 'dc:date');
      const description = stripTags(getTag(item, 'description') || getTag(item, 'summary')).slice(0, 240);
      return { id: `${Date.now()}-${idx}`, title, url, publishedAt: pub, description };
    }).filter(i => i.title);
  } catch (e) {
    console.warn('[news] parseRSS failed:', e.message);
    return [];
  }
};

const translateArticles = async (articles, env) => {
  if (!articles.length) return articles;
  if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY) return articles;
  try {
    const payload = articles.slice(0, 24).map((a, idx) => ({ id: String(idx), en: a.title }));
    const translated = await aiProvider.translateTitles({ titles: payload }, env);
    const map = new Map((translated.results || []).map(r => [String(r.id), r.zh]));
    return articles.map((a, idx) => ({ ...a, titleZh: map.get(String(idx)) || a.titleZh || null }));
  } catch (e) {
    console.warn('[news] translate failed:', e.message);
    return articles;
  }
};

export default {
  async getRSS({ source = 'espn', limit = 10, translate = false }, env) {
    const url = RSS_FEEDS[source];
    if (!url) return { error: `Unknown source: ${source}`, available: Object.keys(RSS_FEEDS) };
    let articles = (await parseRSS(url)).slice(0, limit).map(a => ({ ...a, source }));
    if (translate) articles = await translateArticles(articles, env);
    return { articles, source };
  },

  async getLatest({ limit = 20, sources, translate = false }, env) {
    const targetSources = sources || Object.keys(RSS_FEEDS);
    const all = await Promise.all(
      targetSources.map(async s => {
        const items = await parseRSS(RSS_FEEDS[s]);
        return items.map(i => ({ ...i, source: s }));
      })
    );
    let merged = all.flat()
      .filter(a => a.title)
      .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
      .slice(0, limit);
    if (translate) merged = await translateArticles(merged, env);
    return { articles: merged, total: merged.length };
  },

  async getByTeam({ teams = [], limit = 5, translate = false }, env) {
    const keys = teams.map(t => String(t).toLowerCase()).filter(Boolean);
    const all = await Promise.all(
      Object.entries(RSS_FEEDS).map(async ([source, url]) => {
        const items = await parseRSS(url);
        return items
          .filter(i => keys.some(t => i.title.toLowerCase().includes(t)))
          .map(i => ({ ...i, source }));
      })
    );
    let articles = all.flat().slice(0, limit);
    if (translate) articles = await translateArticles(articles, env);
    return { articles, teams };
  },

  async getNewsAPI({ query, category = 'sports', lang = 'en', limit = 10 }, env) {
    if (!env.NEWS_API_KEY) return { error: 'NEWS_API_KEY not configured' };
    const q = query || category;
    const r = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${lang}&pageSize=${limit}&sortBy=publishedAt&apiKey=${env.NEWS_API_KEY}`);
    const data = await r.json();
    return {
      articles: (data.articles || []).map(a => ({ title: a.title, url: a.url, source: a.source?.name, publishedAt: a.publishedAt })),
    };
  },

  async getReddit({ subreddit = 'soccer', sort = 'hot', limit = 10 }, env) {
    const r = await fetch(`https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`, {
      headers: { 'User-Agent': 'SignalEdge/1.0' },
    });
    const data = await r.json();
    const posts = (data.data?.children || []).map(p => ({
      title: p.data.title,
      url: `https://reddit.com${p.data.permalink}`,
      score: p.data.score,
      comments: p.data.num_comments,
    }));
    return { posts, subreddit };
  },
};
