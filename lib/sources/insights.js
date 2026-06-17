/**
 * International insights + analyst radar source for V6D.
 *
 * Important design rule:
 * - RSS articles are current international news/context.
 * - analystRadar is a curated source map, NOT live picks. It tells the app which
 *   international analysts/data desks to check and what each source is useful for.
 * - AI may cite only matched RSS article text as current news. It may mention
 *   analystRadar only as a verification checklist unless an article/pick is also
 *   present in DATA_BLOCK.
 */

const FEEDS = [
  { id: 'fifa', label: 'FIFA', sport: '世界杯', url: 'https://www.fifa.com/en/rss/articles' },
  { id: 'bbc_football', label: 'BBC Football', sport: '足球', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml' },
  { id: 'espn_soccer', label: 'ESPN Soccer', sport: '足球', url: 'https://www.espn.com/espn/rss/soccer/news' },
  { id: 'espn_mlb', label: 'ESPN MLB', sport: 'MLB', url: 'https://www.espn.com/espn/rss/mlb/news' },
  { id: 'espn_nba', label: 'ESPN NBA', sport: 'NBA', url: 'https://www.espn.com/espn/rss/nba/news' },
  { id: 'dot_esports_lol', label: 'Dot Esports', sport: '電競', url: 'https://dotesports.com/league-of-legends/feed' },
];

const ANALYST_RADAR = [
  {
    id: 'opta_analyst_football',
    name: 'Opta Analyst',
    sourceLabel: 'Opta Analyst',
    sport: '足球',
    category: '數據模型',
    tier: 'A',
    region: 'International',
    url: 'https://theanalyst.com/',
    focusZh: '球隊強弱、xG、賽前數據趨勢、戰術與賽事背景。',
    useForZh: '用來補足模型前提、攻防效率與比賽節奏，不直接當下注結論。',
    doNotUseForZh: '不可把文章語氣轉成勝率、EV 或保證比分。',
    signalChecklist: ['xG 趨勢', '射門品質', '壓迫與控球', '歷史對戰', '賽前敘事'],
    keywords: ['world cup', 'fifa', 'soccer', 'football', 'premier league', 'champions league', 'la liga', 'bundesliga', 'serie a'],
  },
  {
    id: 'statsbomb_football',
    name: 'StatsBomb',
    sourceLabel: 'StatsBomb',
    sport: '足球',
    category: '進階數據',
    tier: 'A',
    region: 'International',
    url: 'https://statsbomb.com/',
    focusZh: 'xG、傳球網、壓迫、射門位置與球隊風格資料。',
    useForZh: '用來檢查 Elo/Poisson 是否與球隊真實攻防型態一致。',
    doNotUseForZh: '沒有命中到具體文章或資料時，不可聲稱 StatsBomb 看好某隊。',
    signalChecklist: ['xG 差值', '高位壓迫', '射門地圖', '傳球結構', '防線高度'],
    keywords: ['world cup', 'fifa', 'soccer', 'football', 'premier league', 'champions league'],
  },
  {
    id: 'tifo_athletic_football',
    name: 'The Athletic / Tifo Football',
    sourceLabel: 'Tifo / The Athletic',
    sport: '足球',
    category: '戰術觀點',
    tier: 'A-',
    region: 'UK / International',
    url: 'https://www.nytimes.com/athletic/football/',
    focusZh: '戰術配置、教練思路、對位弱點與賽前敘事。',
    useForZh: '用來補模型無法看見的戰術對位，但要與市場價格分開處理。',
    doNotUseForZh: '不可把戰術評論直接轉成投注建議。',
    signalChecklist: ['陣型對位', '邊路優劣', '中場控制', '定位球', '教練調整'],
    keywords: ['world cup', 'fifa', 'soccer', 'football', 'premier league', 'champions league'],
  },
  {
    id: 'fangraphs_mlb',
    name: 'FanGraphs',
    sourceLabel: 'FanGraphs',
    sport: 'MLB',
    category: '棒球數據',
    tier: 'A',
    region: 'US',
    url: 'https://blogs.fangraphs.com/',
    focusZh: '投打進階數據、先發投手、牛棚、打線與球隊真實實力。',
    useForZh: '用來確認投手、打線與球場因素；沒有先發投手資料時必須降級。',
    doNotUseForZh: '不可自行補先發投手、傷病或 lineup。',
    signalChecklist: ['先發投手', '牛棚疲勞', 'wRC+', 'xFIP', '球場因素'],
    keywords: ['mlb', 'baseball', 'pitcher', 'bullpen'],
  },
  {
    id: 'baseball_savant_mlb',
    name: 'Baseball Savant',
    sourceLabel: 'Baseball Savant',
    sport: 'MLB',
    category: '官方追蹤數據',
    tier: 'A',
    region: 'US',
    url: 'https://baseballsavant.mlb.com/',
    focusZh: 'Statcast、球速、擊球初速、xwOBA、投手球種與近期品質。',
    useForZh: '用來做投手與打者品質確認，適合放在賽前確認清單。',
    doNotUseForZh: '沒有資料餵入 DATA_BLOCK 時，AI 不可編造數字。',
    signalChecklist: ['xwOBA', 'Barrel%', 'Pitch mix', 'Exit velocity', 'Hard-hit%'],
    keywords: ['mlb', 'baseball', 'statcast', 'pitcher'],
  },
  {
    id: 'cleaning_the_glass_nba',
    name: 'Cleaning the Glass',
    sourceLabel: 'Cleaning the Glass',
    sport: 'NBA',
    category: '籃球進階數據',
    tier: 'A',
    region: 'US',
    url: 'https://cleaningtheglass.com/',
    focusZh: '半場效率、四因素、垃圾時間修正、陣容與球隊型態。',
    useForZh: '用來檢查市場是否高估近期戰績或低估效率差。',
    doNotUseForZh: '不可自行補傷病、輪休或先發名單。',
    signalChecklist: ['四因素', '半場效率', '籃板率', '失誤率', '陣容效率'],
    keywords: ['nba', 'basketball'],
  },
  {
    id: 'basketball_reference_nba',
    name: 'Basketball Reference / Stathead',
    sourceLabel: 'Basketball Reference',
    sport: 'NBA',
    category: '歷史與球員資料',
    tier: 'A-',
    region: 'US',
    url: 'https://www.basketball-reference.com/',
    focusZh: '球員數據、球隊歷史、對戰與基礎效率。',
    useForZh: '用來做基礎資料核對與長期表現參照。',
    doNotUseForZh: '不可用歷史平均直接取代當日傷病/輪休資訊。',
    signalChecklist: ['球員效率', '使用率', '對戰樣本', '球隊節奏', '長期均值'],
    keywords: ['nba', 'basketball'],
  },
  {
    id: 'oracles_elixir_lol',
    name: "Oracle's Elixir",
    sourceLabel: "Oracle's Elixir",
    sport: '電競',
    category: 'LOL 數據',
    tier: 'A',
    region: 'International',
    url: 'https://oracleselixir.com/',
    focusZh: 'LOL 職業賽戰隊與選手數據、版本環境、賽區強度與比賽節奏。',
    useForZh: '用來確認隊伍強弱、版本適性與選手資料。',
    doNotUseForZh: '沒有賠率時不能計算 EV；沒有版本資料時不能編造 meta。',
    signalChecklist: ['版本', '藍紅方', '選手名單', '賽區強度', '前期節奏'],
    keywords: ['lol', 'league of legends', 'msi', 'worlds', 'lck', 'lpl', 'lec', 'lcs', 'esports'],
  },
  {
    id: 'leaguepedia_lol',
    name: 'Leaguepedia',
    sourceLabel: 'Leaguepedia',
    sport: '電競',
    category: '賽程與名單',
    tier: 'A-',
    region: 'International',
    url: 'https://lol.fandom.com/wiki/League_of_Legends_Esports_Wiki',
    focusZh: '賽程、賽制、選手名單、隊伍異動與國際賽資訊。',
    useForZh: '用來做 MSI / Worlds 名單與賽制核對。',
    doNotUseForZh: '不可把百科資料轉成勝率或下注方向。',
    signalChecklist: ['賽程', '賽制', '名單', '替補', '隊伍異動'],
    keywords: ['lol', 'league of legends', 'msi', 'worlds', 'lck', 'lpl', 'lec', 'lcs', 'esports'],
  },
  {
    id: 'golgg_lol',
    name: 'gol.gg',
    sourceLabel: 'gol.gg',
    sport: '電競',
    category: 'LOL 比賽資料',
    tier: 'A-',
    region: 'International',
    url: 'https://gol.gg/',
    focusZh: '英雄 BP、選手數據、戰隊近期比賽與版本樣本。',
    useForZh: '用來驗證 BP 傾向與選手近期狀態。',
    doNotUseForZh: '沒有當前版本資料時，不可推斷強勢英雄或 BP。',
    signalChecklist: ['BP 傾向', '英雄池', '版本樣本', 'KDA/CS', '一血/一塔'],
    keywords: ['lol', 'league of legends', 'msi', 'worlds', 'lck', 'lpl', 'lec', 'lcs', 'esports'],
  },
  {
    id: 'manual_foreign_analysts_lol',
    name: 'LOL 國外分析師手動觀察池',
    sourceLabel: 'Manual Analyst Pool',
    sport: '電競',
    category: '人類觀點',
    tier: 'Manual',
    region: 'International',
    url: 'https://lolesports.com/',
    focusZh: '國外主播、前教練、分析台與社群分析師對版本、BP、隊伍狀態的觀察。',
    useForZh: '只作為人工複核入口；需要管理員把具體文章、影片或摘錄放入快取後，AI 才能引用。',
    doNotUseForZh: '不可在沒有具體來源摘錄時聲稱某位分析師看好哪隊。',
    signalChecklist: ['版本解讀', 'BP 對位', '選手狀態', '訓練賽傳聞需排除', '名單確認'],
    keywords: ['lol', 'league of legends', 'msi', 'worlds', 'lck', 'lpl', 'lec', 'lcs', 'esports'],
  },
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

const eventHaystack = (event = {}) => [event.home_team, event.away_team, event.sport_title, event.sport_key]
  .filter(Boolean)
  .join(' ')
  .toLowerCase();

export const getAnalystRadar = ({ sport = null, limit = 50 } = {}) => {
  const selected = sport ? ANALYST_RADAR.filter(a => a.sport === sport) : ANALYST_RADAR;
  return selected.slice(0, limit).map(a => ({ ...a }));
};

export const matchAnalystsToEvent = (analysts = ANALYST_RADAR, event = {}) => {
  const hay = eventHaystack(event);
  const sportHint = detectSport(hay, null);
  return analysts.filter(a => {
    if (sportHint && a.sport === sportHint) return true;
    return (a.keywords || []).some(k => hay.includes(String(k).toLowerCase()));
  }).slice(0, 5).map(a => ({
    id: a.id,
    name: a.name,
    sourceLabel: a.sourceLabel,
    sport: a.sport,
    category: a.category,
    tier: a.tier,
    url: a.url,
    focusZh: a.focusZh,
    useForZh: a.useForZh,
    doNotUseForZh: a.doNotUseForZh,
    signalChecklist: a.signalChecklist || [],
    note: '此為國外分析師/數據源雷達，不是即時預測；除非 DATA_BLOCK 同時有文章或摘錄，AI 不可聲稱該來源看好任何一方。',
  }));
};

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
    const analystRadar = getAnalystRadar({ limit: 50 });
    const bySport = finalArticles.reduce((acc, a) => {
      acc[a.sport] = (acc[a.sport] || 0) + 1;
      return acc;
    }, {});
    const analystBySport = analystRadar.reduce((acc, a) => {
      acc[a.sport] = (acc[a.sport] || 0) + 1;
      return acc;
    }, {});

    return {
      source: 'international-rss-cache-plus-analyst-radar',
      refreshedAt: new Date().toISOString(),
      count: finalArticles.length,
      bySport,
      analystCount: analystRadar.length,
      analystBySport,
      analystRadar,
      articles: finalArticles,
      failures: settled.filter(r => r.status === 'rejected').length,
    };
  },
  getAnalystRadar,
  matchAnalystsToEvent({ analysts = ANALYST_RADAR, event = {} } = {}) {
    return { analysts: matchAnalystsToEvent(analysts, event) };
  },
  matchInsightsToEvent({ articles = [], event = {} } = {}) {
    return { articles: matchInsightsToEvent(articles, event) };
  },
};
