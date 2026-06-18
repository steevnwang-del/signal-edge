import { getForeignMastersDirectory, normalizeSportFamily } from './foreignMastersDirectory.js';
import { detectSportFamilyFromText, matchTextToEvent } from '../core/eventMatcher.js';
import { normalizeStance, scoreMasterItem, scoreSource, buildMasterConsensus } from '../core/sourceScoring.js';

const htmlDecode = (str = '') => String(str)
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");

const stripHtml = (value = '') => htmlDecode(String(value || ''))
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const truncate = (value = '', max = 320) => {
  const text = stripHtml(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const getTag = (xml = '', tag = '') => {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? stripHtml(m[1]) : '';
};

const getLink = (item = '') => {
  const direct = getTag(item, 'link');
  if (direct && !direct.includes('\n')) return direct.trim();
  const href = item.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
  return (href || direct || '').trim();
};

const fetchText = async (url, timeoutMs = 9000) => {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'SignalEdgeBot/1.0 (+public RSS metadata only)' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally { clearTimeout(timer); }
};

const makeId = (sourceId, value, idx = 0) => {
  const base = Buffer.from(String(value || `${sourceId}-${idx}`)).toString('base64').slice(0, 18).replace(/[^a-zA-Z0-9]/g, '');
  return `${sourceId}-${idx}-${base}`;
};

const inferStance = ({ title = '', summary = '', event = null } = {}) => {
  const text = `${title} ${summary}`.toLowerCase();
  if (/\bover\b|high scoring|goals expected|runs expected|pace up|shootout/.test(text)) return 'over';
  if (/\bunder\b|low scoring|defensive|slow pace|pitchers duel|tight match/.test(text)) return 'under';
  if (!event) return 'watch';
  const home = String(event.home_team || '').toLowerCase();
  const away = String(event.away_team || '').toLowerCase();
  const positive = /(favou?rite|edge|advantage|back|pick|beat|win|upset|stronger|value)/;
  if (home && text.includes(home) && positive.test(text)) return 'lean_home';
  if (away && text.includes(away) && positive.test(text)) return 'lean_away';
  return 'watch';
};

const localSummary = (item = {}, source = {}) => {
  const title = item.title || '未命名文章';
  const summary = item.summary || '';
  const hint = source.useForZh || '作為國外分析大師對照訊號。';
  return truncate(`${source.brand || source.name} 發布與「${title}」相關的公開內容。${summary ? `重點摘錄：${summary}` : ''} SignalEdge 用途：${hint}`, 260);
};

const parseRSSItems = (xml = '', source = {}, limit = 8) => {
  const blocks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) || [];
  return blocks.slice(0, limit).map((block, idx) => {
    const title = getTag(block, 'title');
    const description = getTag(block, 'description') || getTag(block, 'summary') || getTag(block, 'content') || '';
    const link = getLink(block);
    const publishedRaw = getTag(block, 'pubDate') || getTag(block, 'updated') || getTag(block, 'published') || null;
    const publishedAt = publishedRaw ? new Date(publishedRaw).toISOString() : new Date().toISOString();
    const sportFamily = detectSportFamilyFromText(`${title} ${description} ${source.sport} ${(source.keywords || []).join(' ')}`, source.sport);
    return {
      id: makeId(source.id, title || link, idx),
      sourceId: source.id,
      sourceName: source.name,
      sourceLabel: source.brand || source.name,
      sourceTier: source.tier,
      sourceWeight: scoreSource(source),
      sourceType: source.sourceType,
      sport: normalizeSportFamily(sportFamily),
      title: truncate(title, 180),
      url: link || source.url,
      shortExcerpt: truncate(description, 300),
      summaryZh: localSummary({ title, summary: description }, source),
      stance: inferStance({ title, summary: description }),
      confidence: source.tier?.startsWith?.('A') ? 'medium' : '未評級',
      publishedAt,
      topics: source.topics || [],
      eventKeywords: source.keywords || [],
      copyrightMode: source.copyrightMode || 'summary_with_link_only',
      allowedUse: source.allowedUse || 'summary_with_link_only',
      usableInModel: true,
      note: '自動抓取公開 RSS/metadata；只保留短摘錄、連結與 SignalEdge 自行摘要，不搬運全文。',
      sourceMeta: source,
    };
  }).filter(x => x.title && x.url);
};

const templatePublishedAt = (hoursAgo = 1) => new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();

const makeTemplatePost = (source = {}, idx = 0) => {
  const sport = normalizeSportFamily(source.sport || '綜合');
  const topicText = (source.topics || []).slice(0, 4).join(' / ');
  const useFor = source.useForZh || '作為國外分析大師對照訊號。';
  const sportKeyword = { 足球: 'football world cup soccer', LOL: 'league of legends msi worlds lck lpl', NBA: 'nba basketball', MLB: 'mlb baseball', 網球: 'tennis atp wta grand slam', F1: 'formula 1 f1 grand prix' }[sport] || sport;
  return {
    id: `bootstrap-${source.id || idx}`,
    sourceId: source.id || `bootstrap_source_${idx}`,
    sourceName: source.name || source.brand || 'Foreign Master',
    sourceLabel: source.brand || source.name || 'Foreign Master',
    sourceTier: source.tier || 'A',
    sourceWeight: scoreSource(source),
    sourceType: source.sourceType || 'source_reference',
    sport,
    title: `${source.name || source.brand || '國外分析大師'}｜${sport} 賽前對照情報卡`,
    url: source.url || '',
    shortExcerpt: truncate(`${source.brand || source.name || '該來源'} 可用於核對 ${topicText || '賽前資料、模型前提與市場背景'}。本卡為 SignalEdge 預載的來源對照摘要；正式分析會優先使用公開 RSS / metadata 抓到的新文章與管理員補強觀點。`, 300),
    summaryZh: truncate(`【${sport}】${source.name || source.brand} 已列入國外分析大師情報庫。主要用途：${useFor} 系統會把這類來源與賠率、fair odds、EV、Elo/Poisson、新聞風險一起交叉判斷，不會直接複製全文或宣稱來源給出未出現在資料中的推薦。`, 300),
    signalEdgeInterpretation: truncate(`SignalEdge 二次分析用途：用來檢查「模型方向、市場價格、國外觀點」是否一致。若只命中項目層級而沒有明確隊伍/車手/球員，系統會降低模型權重，只作背景參考。`, 280),
    stance: 'market_context',
    confidence: source.tier?.startsWith?.('A') ? 'medium' : 'low',
    publishedAt: templatePublishedAt(idx + 1),
    topics: source.topics || [],
    eventKeywords: [...(source.keywords || []), sportKeyword].filter(Boolean),
    copyrightMode: 'bootstrap_summary_with_source_link_only',
    allowedUse: 'summary_with_link_only',
    usableInModel: true,
    isBootstrap: true,
    note: 'V6F-2 bootstrap intelligence：用於避免空畫面，也讓每場賽事可先有來源對照訊號；不是付費內容搬運。',
  };
};

const fallbackPosts = (directory = []) => {
  const preferred = ['足球', 'LOL', 'NBA', 'MLB', '網球', 'F1'];
  const selected = [];
  for (const sp of preferred) {
    const source = directory.find(x => normalizeSportFamily(x.sport) === sp && String(x.tier || '').startsWith('A'))
      || directory.find(x => normalizeSportFamily(x.sport) === sp);
    if (source) selected.push(source);
  }
  const extras = directory.filter(x => !selected.includes(x)).slice(0, 6);
  const base = [...selected, ...extras].slice(0, 12);
  return base.length ? base.map(makeTemplatePost) : [{
    id: 'fallback-quality-engine', sourceId: 'signaledge_quality_engine', sourceName: 'SignalEdge Source Directory', sourceLabel: 'SignalEdge', sourceTier: 'System', sourceWeight: 0.45,
    sourceType: 'system_notice', sport: '綜合', title: '國外分析大師引擎等待公開來源快取', url: '', shortExcerpt: '',
    summaryZh: '若外部 RSS 暫時無法抓取，系統仍會保留來源雷達、資料完整度、賠率與模型框架；不會假裝取得大師即時推薦。',
    stance: 'watch', confidence: '未評級', publishedAt: new Date().toISOString(), topics: ['quality'], eventKeywords: [], usableInModel: false,
    copyrightMode: 'system_generated', allowedUse: 'internal_notice', note: '系統 fallback。',
  }];
};

export const normalizeManualMasterItem = (item = {}, idx = 0) => {
  const sport = normalizeSportFamily(item.sport || detectSportFamilyFromText(`${item.title || ''} ${item.summaryZh || ''} ${item.excerpt || ''}`, '綜合'));
  return {
    id: item.id || `manual-master-${Date.now()}-${idx}`,
    sourceId: item.sourceId || 'manual_foreign_master',
    sourceName: truncate(item.sourceName || item.analystName || item.name || item.sourceLabel || '國外分析大師', 80),
    sourceLabel: truncate(item.sourceLabel || item.platform || item.sourceName || item.analystName || 'Foreign Master', 80),
    sourceTier: item.sourceTier || item.tier || 'Manual-A',
    sourceWeight: Number(item.sourceWeight || item.weight || 0.75),
    sourceType: item.sourceType || 'manual_private_analyst',
    sport,
    title: truncate(item.title || '國外分析大師觀點', 160),
    url: String(item.url || item.link || '').trim(),
    shortExcerpt: truncate(item.shortExcerpt || item.excerpt || item.quote || '', 320),
    summaryZh: truncate(item.summaryZh || item.summary || item.ourSummary || '', 280),
    signalEdgeInterpretation: truncate(item.signalEdgeInterpretation || item.ourInterpretation || item.interpretation || '', 280),
    stance: normalizeStance(item.stance || item.direction || 'watch'),
    confidence: item.confidence || item.confidenceLevel || 'medium',
    eventKeywords: Array.isArray(item.eventKeywords) ? item.eventKeywords : String(item.eventKeywords || item.keywords || item.teams || '').split(/[，,|/\n]/).map(x => x.trim()).filter(Boolean),
    publishedAt: item.publishedAt || item.date || item.addedAt || new Date().toISOString(),
    addedAt: item.addedAt || new Date().toISOString(),
    copyrightMode: item.copyrightMode || 'short_excerpt_with_link_only',
    allowedUse: item.allowedUse || 'summary_with_link_only',
    usableInModel: item.usableInModel !== false,
    note: item.note || '人工加入的短摘錄/摘要；可作對照訊號，不可取代 SignalEdge 模型或宣稱保證結果。',
  };
};

export const matchForeignMastersToEvent = (items = [], event = {}, { limit = 12 } = {}) => {
  return items
    .map((raw, idx) => {
      const item = raw.sourceType === 'manual_private_analyst' || raw.analystName ? normalizeManualMasterItem(raw, idx) : raw;
      const match = matchTextToEvent(item, event);
      const masterScore = scoreMasterItem(item, match);
      return {
        id: item.id || `matched-master-${idx}`,
        sourceName: item.sourceName || item.analystName || item.sourceLabel,
        sourceLabel: item.sourceLabel || item.sourceName,
        sourceType: item.sourceType,
        sourceTier: item.sourceTier || item.tier,
        sport: item.sport,
        title: item.title,
        url: item.url,
        shortExcerpt: item.shortExcerpt || item.excerpt || '',
        summaryZh: item.summaryZh || item.summary || '',
        signalEdgeInterpretation: item.signalEdgeInterpretation || item.ourInterpretation || '',
        stance: normalizeStance(item.stance || item.direction),
        confidence: item.confidence || '未評級',
        publishedAt: item.publishedAt || item.addedAt || null,
        eventKeywords: item.eventKeywords || [],
        eventMatchScore: match.score,
        matchReasons: match.matchedTerms || [],
        sourceWeight: item.sourceWeight || scoreSource(item),
        masterScore,
        usableInModel: item.usableInModel !== false && match.usable,
        copyrightMode: item.copyrightMode || 'summary_with_link_only',
        note: item.note || '公開短摘錄/自行摘要，只供對照與模型輔助。',
      };
    })
    .filter(x => x.eventMatchScore >= 0.33 || x.usableInModel)
    .sort((a, b) => (b.usableInModel - a.usableInModel) || b.masterScore - a.masterScore || b.eventMatchScore - a.eventMatchScore)
    .slice(0, limit);
};

export const buildForeignMasterConsensus = (items = []) => buildMasterConsensus(items);

export default {
  async getLatest({ limit = 80, sports = [] } = {}, env = {}) {
    const directory = getForeignMastersDirectory({ sports });
    const ingestible = getForeignMastersDirectory({ sports, ingestibleOnly: true });
    const settled = await Promise.allSettled(ingestible.map(async source => {
      const xml = await fetchText(source.feedUrl);
      return parseRSSItems(xml, source, 8);
    }));
    const fetched = settled.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    const seen = new Set();
    const posts = [];
    for (const p of fetched.sort((a,b)=>new Date(b.publishedAt || 0)-new Date(a.publishedAt || 0))) {
      const key = `${p.sourceId}:${p.title}`.toLowerCase().slice(0, 180);
      if (seen.has(key)) continue;
      seen.add(key);
      posts.push(p);
      if (posts.length >= limit) break;
    }
    const finalPosts = posts.length >= 6 ? posts : [...posts, ...fallbackPosts(directory)].slice(0, Math.max(limit, 12));
    const bySport = finalPosts.reduce((acc, p) => { acc[p.sport] = (acc[p.sport] || 0) + 1; return acc; }, {});
    const directoryBySport = directory.reduce((acc, p) => { acc[normalizeSportFamily(p.sport)] = (acc[normalizeSportFamily(p.sport)] || 0) + 1; return acc; }, {});
    return {
      source: 'foreign-masters-public-rss-directory-v6f',
      refreshedAt: new Date().toISOString(),
      count: finalPosts.length,
      sourceCount: directory.length,
      ingestibleCount: ingestible.length,
      bySport,
      directoryBySport,
      supportedSports: ['足球', 'LOL', 'NBA', 'MLB', '網球', 'F1'],
      directory: directory.map(({ sourceMeta, ...x }) => x),
      posts: finalPosts.map(({ sourceMeta, ...x }) => x),
      failures: settled.filter(r => r.status === 'rejected').map((r, i) => ({ source: ingestible[i]?.id, error: r.reason?.message || String(r.reason) })),
      legalMode: 'public_metadata_short_excerpt_own_summary_only',
      note: 'Only public RSS / metadata is fetched. Full articles, paywalled content and login-only content are not copied.',
    };
  },
  matchForeignMastersToEvent,
  buildForeignMasterConsensus,
  normalizeManualMasterItem,
};
