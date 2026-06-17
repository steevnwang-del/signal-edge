/**
 * V6F Foreign Masters Directory
 *
 * This is a curated directory of public / semi-public international analyst,
 * data and editorial sources. It is NOT a copied data set and not a claim that
 * every source publishes a live pick. The ingestion layer may fetch only public
 * RSS / open metadata. Paid content, login-only content and full-text copying are
 * intentionally excluded.
 */

export const SUPPORTED_SPORTS = ['足球', 'LOL', 'NBA', 'MLB', '網球', 'F1'];

export const SPORT_ALIASES = {
  '世界杯': '足球',
  '足球': '足球',
  '英超': '足球',
  '歐冠': '足球',
  '西甲': '足球',
  '德甲': '足球',
  '義甲': '足球',
  '法甲': '足球',
  'MSI 2026': 'LOL',
  'LOL 電競': 'LOL',
  'LCK': 'LOL',
  'LPL': 'LOL',
  '電競': 'LOL',
  'NBA': 'NBA',
  'MLB': 'MLB',
  '網球': '網球',
  'Tennis': '網球',
  'F1': 'F1',
  'Formula 1': 'F1',
};

export const normalizeSportFamily = (sport = '') => SPORT_ALIASES[sport] || SPORT_ALIASES[String(sport).trim()] || String(sport || '綜合');

const common = {
  allowedUse: 'summary_with_link_only',
  copyrightMode: 'no_full_text_no_paywall',
  displayMode: 'source_link_short_excerpt_own_summary',
};

export const FOREIGN_MASTERS_DIRECTORY = [
  // ─── Soccer / Football ───────────────────────────────────────────────────
  {
    id: 'opta_analyst_soccer', name: 'Opta Analyst', brand: 'Opta Analyst', sport: '足球',
    sourceType: 'data_editorial', tier: 'A', weight: 0.9, language: 'en', region: 'International',
    url: 'https://theanalyst.com/', feedUrl: null,
    topics: ['xG', 'team strength', 'match prediction', 'tactical trend'],
    keywords: ['football', 'soccer', 'world cup', 'premier league', 'champions league', 'la liga', 'bundesliga', 'serie a'],
    useForZh: '核對 xG、球隊強弱、賽前數據趨勢與戰術背景。',
    modelUse: 'context_and_model_validation', ...common,
  },
  {
    id: 'statsbomb_soccer', name: 'StatsBomb', brand: 'StatsBomb', sport: '足球',
    sourceType: 'data_research', tier: 'A', weight: 0.88, language: 'en', region: 'International',
    url: 'https://statsbomb.com/', feedUrl: 'https://statsbomb.com/feed/',
    topics: ['xG', 'pressing', 'shot quality', 'team style'],
    keywords: ['football', 'soccer', 'xg', 'statsbomb', 'world cup'],
    useForZh: '核對進階數據、攻防型態與模型前提。', modelUse: 'context_and_model_validation', ...common,
  },
  {
    id: 'michael_caley_expect_goals', name: 'Michael Caley', brand: 'Expecting Goals', sport: '足球',
    sourceType: 'private_analyst', tier: 'A-', weight: 0.84, language: 'en', region: 'US/UK',
    url: 'https://www.expectinggoals.com/', feedUrl: null,
    topics: ['xG', 'forecasting', 'team strength'],
    keywords: ['expecting goals', 'xg', 'football', 'soccer', 'world cup'],
    useForZh: '參考 xG 與球隊強度的思路，不能直接複製付費內容。', modelUse: 'private_analyst_benchmark', ...common,
  },
  {
    id: 'mark_taylor_power_goals', name: 'Mark Taylor', brand: 'The Power of Goals', sport: '足球',
    sourceType: 'private_analyst', tier: 'B+', weight: 0.76, language: 'en', region: 'UK',
    url: 'https://thepowerofgoals.blogspot.com/', feedUrl: 'https://thepowerofgoals.blogspot.com/feeds/posts/default?alt=rss',
    topics: ['xG method', 'match state', 'football analytics'],
    keywords: ['football', 'soccer', 'goals', 'expected goals'],
    useForZh: '參考方法論與足球數據分析框架。', modelUse: 'method_reference', ...common,
  },
  {
    id: 'zonal_marking_tactics', name: 'Zonal Marking', brand: 'Zonal Marking', sport: '足球',
    sourceType: 'tactical_analyst', tier: 'B+', weight: 0.74, language: 'en', region: 'UK',
    url: 'https://www.zonalmarking.net/', feedUrl: 'https://www.zonalmarking.net/feed/',
    topics: ['tactics', 'formations', 'matchups'],
    keywords: ['football', 'soccer', 'tactics', 'formation'],
    useForZh: '補足模型難以捕捉的戰術對位與陣型思路。', modelUse: 'tactical_context', ...common,
  },

  // ─── LOL / Esports ──────────────────────────────────────────────────────
  {
    id: 'oracles_elixir_lol', name: "Oracle's Elixir", brand: "Oracle's Elixir", sport: 'LOL',
    sourceType: 'data_site', tier: 'A', weight: 0.88, language: 'en', region: 'International',
    url: 'https://oracleselixir.com/', feedUrl: null,
    topics: ['team stats', 'player stats', 'league strength', 'LoL esports'],
    keywords: ['league of legends', 'lol', 'msi', 'worlds', 'lck', 'lpl', 'lec', 'lcs'],
    useForZh: '核對 LOL 職業賽隊伍、選手、版本與賽區強度。', modelUse: 'data_validation', ...common,
  },
  {
    id: 'leaguepedia_lol', name: 'Leaguepedia', brand: 'Leaguepedia', sport: 'LOL',
    sourceType: 'wiki_data', tier: 'A-', weight: 0.76, language: 'en', region: 'International',
    url: 'https://lol.fandom.com/wiki/League_of_Legends_Esports_Wiki', feedUrl: null,
    topics: ['schedule', 'roster', 'format', 'teams'],
    keywords: ['leaguepedia', 'league of legends', 'lol', 'msi', 'worlds', 'lck', 'lpl'],
    useForZh: '核對賽程、賽制、名單、替補與國際賽資訊。', modelUse: 'schedule_roster_validation', ...common,
  },
  {
    id: 'golgg_lol', name: 'gol.gg', brand: 'gol.gg', sport: 'LOL',
    sourceType: 'data_site', tier: 'A-', weight: 0.78, language: 'en', region: 'International',
    url: 'https://gol.gg/', feedUrl: null,
    topics: ['draft', 'champions', 'team stats', 'player stats'],
    keywords: ['league of legends', 'lol', 'msi', 'worlds', 'lck', 'lpl', 'draft'],
    useForZh: '核對 BP、英雄池、選手數據與版本樣本。', modelUse: 'data_validation', ...common,
  },
  {
    id: 'dot_esports_lol', name: 'Dot Esports League of Legends', brand: 'Dot Esports', sport: 'LOL',
    sourceType: 'news_editorial', tier: 'B', weight: 0.66, language: 'en', region: 'International',
    url: 'https://dotesports.com/league-of-legends', feedUrl: 'https://dotesports.com/league-of-legends/feed',
    topics: ['news', 'rosters', 'patch', 'LoL esports'],
    keywords: ['league of legends', 'lol', 'msi', 'worlds', 'lck', 'lpl', 'lec', 'lcs'],
    useForZh: '補足版本、名單、賽事新聞與社群討論熱度。', modelUse: 'news_context', ...common,
  },

  // ─── NBA ────────────────────────────────────────────────────────────────
  {
    id: 'cleaning_the_glass_nba', name: 'Cleaning the Glass', brand: 'Cleaning the Glass', sport: 'NBA',
    sourceType: 'data_site', tier: 'A', weight: 0.86, language: 'en', region: 'US',
    url: 'https://cleaningtheglass.com/', feedUrl: null,
    topics: ['four factors', 'lineup efficiency', 'garbage time adjustment'],
    keywords: ['nba', 'basketball', 'four factors', 'efficiency'],
    useForZh: '核對半場效率、四因素、垃圾時間修正與陣容型態。', modelUse: 'data_validation', ...common,
  },
  {
    id: 'dunks_and_threes_epm', name: 'Dunks & Threes', brand: 'Estimated Plus-Minus', sport: 'NBA',
    sourceType: 'data_site', tier: 'A-', weight: 0.78, language: 'en', region: 'US',
    url: 'https://dunksandthrees.com/epm', feedUrl: null,
    topics: ['EPM', 'player impact', 'team strength'],
    keywords: ['nba', 'basketball', 'epm', 'estimated plus-minus'],
    useForZh: '核對球員影響力與陣容強度，避免只看近期戰績。', modelUse: 'data_validation', ...common,
  },
  {
    id: 'basketball_intelligence', name: 'Basketball Intelligence', brand: 'Basketball Intelligence', sport: 'NBA',
    sourceType: 'newsletter_editorial', tier: 'B+', weight: 0.72, language: 'en', region: 'US',
    url: 'https://www.basketballintelligence.net/', feedUrl: 'https://www.basketballintelligence.net/feed',
    topics: ['NBA reporting', 'analysis', 'injury context', 'matchups'],
    keywords: ['nba', 'basketball'],
    useForZh: '補足 NBA 每日情報與國外觀點，但不能直接搬運全文。', modelUse: 'news_context', ...common,
  },
  {
    id: 'espn_nba_news', name: 'ESPN NBA', brand: 'ESPN', sport: 'NBA',
    sourceType: 'news_editorial', tier: 'B', weight: 0.62, language: 'en', region: 'US',
    url: 'https://www.espn.com/nba/', feedUrl: 'https://www.espn.com/espn/rss/nba/news',
    topics: ['NBA news', 'injury reports', 'transactions'], keywords: ['nba', 'basketball'],
    useForZh: '補足新聞風險與市場熱度。', modelUse: 'news_context', ...common,
  },

  // ─── MLB ────────────────────────────────────────────────────────────────
  {
    id: 'fangraphs_mlb', name: 'FanGraphs', brand: 'FanGraphs', sport: 'MLB',
    sourceType: 'data_editorial', tier: 'A', weight: 0.9, language: 'en', region: 'US',
    url: 'https://blogs.fangraphs.com/', feedUrl: 'https://blogs.fangraphs.com/feed/',
    topics: ['pitching', 'batting', 'projections', 'bullpen', 'wRC+'],
    keywords: ['mlb', 'baseball', 'pitcher', 'bullpen', 'fangraphs'],
    useForZh: '核對先發投手、牛棚、打線與球隊真實實力。', modelUse: 'data_validation', ...common,
  },
  {
    id: 'baseball_savant_mlb', name: 'Baseball Savant', brand: 'MLB Statcast', sport: 'MLB',
    sourceType: 'official_data', tier: 'A', weight: 0.88, language: 'en', region: 'US',
    url: 'https://baseballsavant.mlb.com/', feedUrl: null,
    topics: ['Statcast', 'xwOBA', 'pitch mix', 'exit velocity'],
    keywords: ['mlb', 'baseball', 'statcast', 'baseball savant'],
    useForZh: '核對 Statcast、投手球種、擊球品質與近期指標。', modelUse: 'data_validation', ...common,
  },
  {
    id: 'baseball_prospectus', name: 'Baseball Prospectus', brand: 'Baseball Prospectus', sport: 'MLB',
    sourceType: 'data_editorial', tier: 'B+', weight: 0.74, language: 'en', region: 'US',
    url: 'https://www.baseballprospectus.com/', feedUrl: 'https://www.baseballprospectus.com/feed/',
    topics: ['analysis', 'prospects', 'pitching', 'PECOTA'], keywords: ['mlb', 'baseball'],
    useForZh: '作為棒球深度文章與模型思路參考，不搬運付費內容。', modelUse: 'context_and_model_validation', ...common,
  },
  {
    id: 'espn_mlb_news', name: 'ESPN MLB', brand: 'ESPN', sport: 'MLB',
    sourceType: 'news_editorial', tier: 'B', weight: 0.62, language: 'en', region: 'US',
    url: 'https://www.espn.com/mlb/', feedUrl: 'https://www.espn.com/espn/rss/mlb/news',
    topics: ['MLB news', 'lineup', 'injuries'], keywords: ['mlb', 'baseball'],
    useForZh: '補足 MLB 新聞與市場風險。', modelUse: 'news_context', ...common,
  },

  // ─── Tennis ─────────────────────────────────────────────────────────────
  {
    id: 'tennis_abstract', name: 'Jeff Sackmann / Tennis Abstract', brand: 'Tennis Abstract', sport: '網球',
    sourceType: 'data_analyst', tier: 'A-', weight: 0.82, language: 'en', region: 'International',
    url: 'https://www.tennisabstract.com/', feedUrl: 'https://www.tennisabstract.com/blog/feed/',
    topics: ['elo', 'player stats', 'serve/return', 'surface'],
    keywords: ['tennis', 'atp', 'wta', 'grand slam', 'elo', 'surface'],
    useForZh: '核對網球 Elo、球員數據、場地適性與發接發品質。', modelUse: 'data_validation', ...common,
  },
  {
    id: 'atp_tour_news', name: 'ATP Tour', brand: 'ATP Tour', sport: '網球',
    sourceType: 'official_editorial', tier: 'B+', weight: 0.68, language: 'en', region: 'International',
    url: 'https://www.atptour.com/', feedUrl: 'https://www.atptour.com/en/news/rss-feed',
    topics: ['ATP news', 'player form', 'tournament context'], keywords: ['tennis', 'atp'],
    useForZh: '補足 ATP 官方新聞、賽事背景與球員狀態。', modelUse: 'news_context', ...common,
  },
  {
    id: 'wta_news', name: 'WTA', brand: 'WTA', sport: '網球',
    sourceType: 'official_editorial', tier: 'B+', weight: 0.68, language: 'en', region: 'International',
    url: 'https://www.wtatennis.com/', feedUrl: 'https://www.wtatennis.com/rss',
    topics: ['WTA news', 'player form', 'tournament context'], keywords: ['tennis', 'wta'],
    useForZh: '補足 WTA 官方新聞、賽事背景與球員狀態。', modelUse: 'news_context', ...common,
  },
  {
    id: 'tennis_com_news', name: 'Tennis.com', brand: 'Tennis.com', sport: '網球',
    sourceType: 'news_editorial', tier: 'B', weight: 0.6, language: 'en', region: 'International',
    url: 'https://www.tennis.com/', feedUrl: 'https://www.tennis.com/news/rss/',
    topics: ['tennis news', 'match context', 'player form'], keywords: ['tennis', 'atp', 'wta'],
    useForZh: '補足網球新聞與賽前敘事。', modelUse: 'news_context', ...common,
  },

  // ─── Formula 1 ──────────────────────────────────────────────────────────
  {
    id: 'openf1_data', name: 'OpenF1', brand: 'OpenF1', sport: 'F1',
    sourceType: 'open_data_api', tier: 'A-', weight: 0.8, language: 'en', region: 'International',
    url: 'https://openf1.org/', feedUrl: null,
    topics: ['lap timing', 'sessions', 'drivers', 'telemetry-like public data'],
    keywords: ['formula 1', 'f1', 'grand prix', 'qualifying', 'race'],
    useForZh: '核對 F1 賽程、練習/排位/正賽資料與車手表現。', modelUse: 'data_validation', ...common,
  },
  {
    id: 'the_race_f1', name: 'The Race F1', brand: 'The Race', sport: 'F1',
    sourceType: 'analysis_editorial', tier: 'A-', weight: 0.78, language: 'en', region: 'International',
    url: 'https://www.the-race.com/formula-1/', feedUrl: 'https://www.the-race.com/formula-1/feed/',
    topics: ['F1 analysis', 'technical upgrades', 'race strategy'],
    keywords: ['formula 1', 'f1', 'grand prix', 'qualifying', 'race'],
    useForZh: '補足車隊升級、排位節奏、策略與長距離速度觀點。', modelUse: 'analysis_context', ...common,
  },
  {
    id: 'autosport_f1', name: 'Autosport F1', brand: 'Autosport', sport: 'F1',
    sourceType: 'news_editorial', tier: 'B+', weight: 0.7, language: 'en', region: 'International',
    url: 'https://www.autosport.com/f1/', feedUrl: 'https://www.autosport.com/rss/f1/news/',
    topics: ['F1 news', 'driver quotes', 'team context'], keywords: ['formula 1', 'f1', 'grand prix'],
    useForZh: '補足 F1 新聞、車隊與車手臨場資訊。', modelUse: 'news_context', ...common,
  },
  {
    id: 'motorsport_f1', name: 'Motorsport.com F1', brand: 'Motorsport.com', sport: 'F1',
    sourceType: 'news_editorial', tier: 'B', weight: 0.64, language: 'en', region: 'International',
    url: 'https://www.motorsport.com/f1/', feedUrl: 'https://www.motorsport.com/rss/f1/news/',
    topics: ['F1 news', 'technical updates', 'strategy'], keywords: ['formula 1', 'f1', 'grand prix'],
    useForZh: '補足賽事新聞與策略背景。', modelUse: 'news_context', ...common,
  },
];

export const getForeignMastersDirectory = ({ sports = [], ingestibleOnly = false } = {}) => {
  const wanted = new Set((sports || []).map(normalizeSportFamily));
  return FOREIGN_MASTERS_DIRECTORY
    .filter(src => !wanted.size || wanted.has(normalizeSportFamily(src.sport)))
    .filter(src => !ingestibleOnly || Boolean(src.feedUrl))
    .map(src => ({ ...src, sportFamily: normalizeSportFamily(src.sport) }));
};

export default FOREIGN_MASTERS_DIRECTORY;
