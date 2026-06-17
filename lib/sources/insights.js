/**
 * International insights source for V6D.
 * Server-only RSS/lightweight feed aggregation. No AI calls here; this is safe to
 * expose through cache after the cron writes cache/insights.
 */

const FEEDS = [
  { id: 'fifa', label: 'FIFA', sport: '世界杯', url: 'https://www.fifa.com/en/rss/articles' },
  { id: 'bbc_football', label: 'BBC Football', sport: '足球', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml' },
  { id: 'espn_soccer', label: 'ESPN Soccer', sport: '足球', url: 'https://www.espn.com/espn/rss/soccer/news' },
  { id: 'espn_mlb', label: 'ESPN MLB', sport: 'MLB', url: 'https://www.espn.com/espn/rss/mlb/news' },
  { id: 'espn_nba', label: 'ESPN NBA', sport: 'NBA', url: 'https://www.espn.com/espn/rss/nba/news' },
  { id: 'dot_esports_lol', label: 'Dot Esports', sport: '電競', url: 'https://dotesports.com/league-of-legends/feed' },
];

const htmlDecode = (str = '') => String(str)
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const getTag = (xml = '', tag = '') => {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  return htmlDecode(xml.match(re)?.[1] || '');
};

const getLink = (item = '') => {
  const link = getTag(item, 'link');
  if (link) return link;
  const atom = item.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
  return htmlDecode(atom || '');
};

const localZhTitle = (title = '') => {
  let t = String(title || '').trim();
  const pairs = [
    [/World Cup/ig, '世界盃'], [/FIFA/ig, 'FIFA'], [/NBA/ig, 'NBA'], [/MLB/ig, 'MLB'],
    [/League of Legends/ig, '英雄聯盟'], [/LoL/ig, '英雄聯盟'], [/MSI/ig, 'MSI'],
    [/Champions League/ig, '歐冠'], [/Premier League/ig, '英超'], [/transfer/ig, '轉會'],
    [/injury/ig, '傷病'], [/preview/ig, '賽前觀察'], [/prediction/ig, '預測'],
    [/odds/ig, '賠率'], [/coach/ig, '教練'], [/roster/ig, '名單'], [/final/ig, '決賽'],
  ];
  pairs.forEach(([re, zh]) => { t = t.replace(re, zh); });
  return t;
};

const detectSport = (title = '', fallback = '綜合') => {
  const t = title.toLowerCase();
  if (/world cup|fifa|mundial/.test(t)) return '世界杯';
  if (/league of legends|\blol\b|msi|worlds|lck|lpl|lec|lcs|valorant|dota|counter-strike|cs2/.test(t)) return '電競';
  if (/nba|basketball/.test(t)) return 'NBA';
  if (/mlb|baseball/.test(t)) return 'MLB';
  if (/ufc|mma/.test(t)) return 'UFC';
  if (/football|soccer|premier league|champions league|la liga|bundesliga|serie a/.test(t)) return '足球';
  return fallback;
};

const fetchText = async (url, timeoutMs = 7000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'user-agent': 'SignalEdge/1.0 (+international-insights)' },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(timer);
  }
};

const parseRSS = (xml = '', feed) => {
  const itemRe = /<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi;
  const items = xml.match(itemRe) || [];
  return items.slice(0, 12).map((item, idx) => {
    const title = getTag(item, 'title');
    const summary = getTag(item, 'description') || getTag(item, 'summary') || getTag(item, 'content');
    const url = getLink(item);
    const publishedAt = getTag(item, 'pubDate') || getTag(item, 'updated') || getTag(item, 'published') || null;
    const sport = detectSport(`${title} ${summary}`, feed.sport);
    return {
      id: `${feed.id}-${idx}-${Buffer.from(title || url || String(idx)).toString('base64').slice(0, 12).replace(/[^a-zA-Z0-9]/g, '')}`,
      title,
      titleZh: localZhTitle(title),
      summary: summary.slice(0, 260),
      summaryZh: localZhTitle(summary.slice(0, 180)),
      url,
      source: feed.id,
      sourceLabel: feed.label,
      sport,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
    };
  }).filter(x => x.title && x.url);
};

const fallbackInsights = () => ([
  {
    id: 'fallback-worldcup',
    title: 'World Cup 2026 international coverage remains a key context source',
    titleZh: '世界盃 2026 國際報導仍是賽前背景的重要參考',
    summary: 'SignalEdge will refresh cached international sources and match relevant headlines to analysis cards.',
    summaryZh: 'SignalEdge 會刷新國際來源快取，並把相關標題匹配到分析卡片。',
    url: 'https://www.fifa.com/',
    source: 'fallback',
    sourceLabel: 'SignalEdge',
    sport: '世界杯',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-lol',
    title: 'League of Legends international events require version and roster confirmation',
    titleZh: '英雄聯盟國際賽需要確認版本、名單與賽制資訊',
    summary: 'Without market odds, esports matches remain information-only until reliable prices and roster context are available.',
    summaryZh: '若沒有市場賠率，電競賽事只做情報觀察，等待可靠價格與名單資訊。',
    url: 'https://lolesports.com/',
    source: 'fallback',
    sourceLabel: 'SignalEdge',
    sport: '電競',
    publishedAt: new Date().toISOString(),
  },
]);

export const matchInsightsToEvent = (articles = [], event = {}) => {
  const terms = [event.home_team, event.away_team, event.sport_title, event.sport_key]
    .filter(Boolean)
    .map(x => String(x).toLowerCase());
  if (!terms.length) return [];
  return articles.filter(a => {
    const hay = `${a.title} ${a.titleZh} ${a.summary} ${a.summaryZh} ${a.sport}`.toLowerCase();
    return terms.some(t => t && hay.includes(t.toLowerCase()))
      || (/world cup|fifa/i.test(event.sport_title || event.sport_key || '') && a.sport === '世界杯')
      || (/lol|msi|esports/i.test(event.sport_title || event.sport_key || '') && a.sport === '電競');
  }).slice(0, 5);
};

export default {
  async getLatest({ limit = 48, sports = [] } = {}, env = {}) {
    const selectedFeeds = sports?.length
      ? FEEDS.filter(f => sports.includes(f.sport) || sports.includes(f.id))
      : FEEDS;

    const settled = await Promise.allSettled(selectedFeeds.map(async feed => {
      const xml = await fetchText(feed.url);
      return parseRSS(xml, feed);
    }));

    const articles = settled
      .flatMap(r => r.status === 'fulfilled' ? r.value : [])
      .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

    const deduped = [];
    const seen = new Set();
    for (const item of articles) {
      const key = `${item.title}`.toLowerCase().slice(0, 120);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= limit) break;
    }

    const finalArticles = deduped.length ? deduped : fallbackInsights();
    const bySport = finalArticles.reduce((acc, a) => {
      acc[a.sport] = (acc[a.sport] || 0) + 1;
      return acc;
    }, {});

    return {
      source: 'international-rss-cache',
      refreshedAt: new Date().toISOString(),
      count: finalArticles.length,
      bySport,
      articles: finalArticles,
      failures: settled.filter(r => r.status === 'rejected').length,
    };
  },
  matchInsightsToEvent({ articles = [], event = {} } = {}) {
    return { articles: matchInsightsToEvent(articles, event) };
  },
};
