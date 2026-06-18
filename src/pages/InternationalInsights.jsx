import { useEffect, useMemo, useState } from 'react';

const C = {
  navy: '#0F3460', white: '#FFFFFF', dark: '#111827', muted: '#6B7280',
  border: '#D4D8DF', bg: '#ECEEF2', amber: '#D97706', panel: '#F6F7FA',
  green: '#1B5E20', purple: '#7C3AED', blue: '#2563EB', red: '#C9082A'
};
const SC = { 世界杯: '#006400', 足球: '#1B5E20', LOL: '#7C3AED', 電競: '#7C3AED', NBA: '#C9082A', MLB: '#002D72', 網球: '#047857', F1: '#DC2626', UFC: '#D20A0A', 綜合: '#0F3460' };
const SPORTS = ['足球', 'LOL', 'NBA', 'MLB', '網球', 'F1'];

const input = { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 10px', fontSize: 13, outline: 'none', background: C.white };
const label = { fontSize: 11, fontWeight: 900, color: C.muted, marginBottom: 5, display: 'block' };
const emptyManual = { sourceName: '', sourceLabel: '', sport: '足球', title: '', url: '', shortExcerpt: '', summaryZh: '', signalEdgeInterpretation: '', stance: 'watch', confidence: 'medium', eventKeywords: '' };

const timeAgo = (date) => {
  try {
    const d = date?.toDate ? date.toDate() : new Date(date);
    const s = (Date.now() - d.getTime()) / 1000;
    if (!Number.isFinite(s)) return '';
    if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} 分鐘前`;
    if (s < 86400) return `${Math.floor(s / 3600)} 小時前`;
    return d.toLocaleDateString('zh-TW');
  } catch { return ''; }
};
const cut = (v = '', n = 420) => {
  const t = String(v || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const parseKeywords = (v = '') => Array.isArray(v) ? v : String(v || '').split(/[，,\n|/]/).map(x => x.trim()).filter(Boolean).slice(0, 12);
const normSport = (s = '') => ({ '世界杯': '足球', '電競': 'LOL', 'MSI 2026': 'LOL', 'LOL 電競': 'LOL', LCK: 'LOL', LPL: 'LOL' }[s] || s || '綜合');

const FALLBACK_SOURCES = [
  { id: 'fallback-opta', name: 'Opta Analyst', brand: 'Opta Analyst', sourceLabel: 'Opta Analyst', sport: '足球', sourceType: 'data_editorial', tier: 'A', url: 'https://theanalyst.com/', useForZh: '核對 xG、球隊強弱、賽前數據趨勢與戰術背景。', topics: ['xG', 'team strength', 'match prediction'] },
  { id: 'fallback-oracle', name: "Oracle's Elixir", brand: "Oracle's Elixir", sourceLabel: "Oracle's Elixir", sport: 'LOL', sourceType: 'data_site', tier: 'A', url: 'https://oracleselixir.com/', useForZh: '核對 LOL 隊伍、選手、版本與賽區強度。', topics: ['team stats', 'version', 'league strength'] },
  { id: 'fallback-ctg', name: 'Cleaning the Glass', brand: 'Cleaning the Glass', sourceLabel: 'Cleaning the Glass', sport: 'NBA', sourceType: 'data_site', tier: 'A', url: 'https://cleaningtheglass.com/', useForZh: '核對四因素、垃圾時間修正與陣容效率。', topics: ['four factors', 'lineup efficiency'] },
  { id: 'fallback-fangraphs', name: 'FanGraphs', brand: 'FanGraphs', sourceLabel: 'FanGraphs', sport: 'MLB', sourceType: 'data_editorial', tier: 'A', url: 'https://blogs.fangraphs.com/', useForZh: '核對先發投手、牛棚、打線與球隊真實實力。', topics: ['pitching', 'bullpen', 'wRC+'] },
  { id: 'fallback-tennis', name: 'Tennis Abstract', brand: 'Tennis Abstract', sourceLabel: 'Tennis Abstract', sport: '網球', sourceType: 'data_analyst', tier: 'A-', url: 'https://www.tennisabstract.com/', useForZh: '核對網球 Elo、場地適性、發接發品質與球員狀態。', topics: ['elo', 'surface', 'serve/return'] },
  { id: 'fallback-f1', name: 'The Race F1', brand: 'The Race', sourceLabel: 'The Race', sport: 'F1', sourceType: 'analysis_editorial', tier: 'A-', url: 'https://www.the-race.com/formula-1/', useForZh: '核對 F1 車隊升級、排位節奏、策略與長距離速度。', topics: ['strategy', 'upgrades', 'long-run pace'] },
];

const buildBootstrapPosts = (sourceList = []) => {
  const list = sourceList.length ? sourceList : FALLBACK_SOURCES.map(normalizeSource);
  const priority = ['足球', 'LOL', 'NBA', 'MLB', '網球', 'F1'];
  const selected = [];
  for (const sp of priority) {
    const src = list.find(x => normSport(x.sport) === sp && String(x.tier || '').startsWith('A')) || list.find(x => normSport(x.sport) === sp);
    if (src && !selected.some(s => s.id === src.id)) selected.push(src);
  }
  for (const src of list) {
    if (selected.length >= 12) break;
    if (!selected.some(s => s.id === src.id)) selected.push(src);
  }
  return selected.slice(0, 12).map((src, idx) => normalizePost({
    id: `bootstrap-ui-${src.id || idx}`,
    sourceName: src.name,
    sourceLabel: src.sourceLabel || src.brand || src.name,
    sport: normSport(src.sport),
    title: `${src.name || src.sourceLabel}｜${normSport(src.sport)} 賽前對照情報卡`,
    url: src.url || '',
    shortExcerpt: `${src.sourceLabel || src.name} 可用於核對 ${(src.topics || []).slice(0, 4).join(' / ') || '賽前資料、模型前提與市場背景'}。此為 SignalEdge 預載來源摘要；正式更新後會優先顯示公開 RSS / metadata 的新內容。`,
    summaryZh: `【${normSport(src.sport)}】${src.name || src.sourceLabel} 已列入國外分析大師情報庫。主要用途：${src.useForZh || '作為國外分析大師對照訊號。'} 系統會把它與賠率、fair odds、EV、Elo/Poisson、新聞風險一起交叉判斷。`,
    signalEdgeInterpretation: '若只有項目層級訊號，模型會降權作背景參考；只有明確命中隊伍、賽事或市場方向時，才會提高進入分析的權重。',
    stance: 'market_context',
    confidence: String(src.tier || '').startsWith('A') ? 'medium' : 'low',
    publishedAt: new Date(Date.now() - (idx + 1) * 3600 * 1000).toISOString(),
    eventKeywords: [normSport(src.sport), ...(src.topics || [])],
    isBootstrap: true,
  }, idx));
};

const normalizeSource = (x = {}, i = 0) => ({
  ...x,
  id: x.id || `source-${i}`,
  name: x.name || x.sourceName || x.brand || x.sourceLabel || 'Foreign Master',
  sourceLabel: x.sourceLabel || x.brand || x.name || 'Foreign Master',
  sport: normSport(x.sport || x.sportFamily || '綜合'),
  tier: x.tier || x.sourceTier || 'Watch',
  sourceType: x.sourceType || x.category || 'source',
  useForZh: x.useForZh || x.useFor || x.focusZh || '',
  topics: Array.isArray(x.topics) ? x.topics : (x.signalChecklist || []),
});
const normalizePost = (x = {}, i = 0) => ({
  ...x,
  id: x.id || `post-${i}`,
  sourceName: x.sourceName || x.analystName || x.name || x.sourceLabel || '國外分析大師',
  sourceLabel: x.sourceLabel || x.platform || x.sourceName || 'Foreign Master',
  sport: normSport(x.sport || '綜合'),
  title: cut(x.title || '國外分析大師情報', 160),
  url: x.url || '',
  summaryZh: cut(x.summaryZh || x.summary || '', 260),
  shortExcerpt: cut(x.shortExcerpt || x.excerpt || '', 260),
  stance: x.stance || 'watch',
  confidence: x.confidence || '未評級',
  masterScore: x.masterScore || null,
  eventKeywords: parseKeywords(x.eventKeywords || x.keywords || x.teams || []),
  publishedAt: x.publishedAt || x.addedAt || null,
});
const normalizeArticle = (x = {}, i = 0) => ({
  ...x,
  id: x.id || `article-${i}`,
  titleDisplay: x.titleZh || x.titleDisplay || x.title || 'Untitled',
  sourceLabel: x.sourceLabel || x.source || 'International',
  sport: normSport(x.sport || '綜合'),
  summaryDisplay: x.summaryZh || x.summary || '',
});

function Field({ title, children }) { return <div><label style={label}>{title}</label>{children}</div>; }
function Chip({ children, color = C.navy }) { return <span style={{ background: `${color}18`, color, border: `1px solid ${color}22`, fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 999 }}>{children}</span>; }
function Stat({ label, value, color = C.navy }) { return <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}><div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>{label}</div><div style={{ fontSize: 22, color, fontWeight: 950 }}>{value}</div></div>; }

export default function InternationalInsights({ role }) {
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([]);
  const [posts, setPosts] = useState([]);
  const [manual, setManual] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('全部');
  const [mode, setMode] = useState('posts');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(emptyManual);
  const isAdmin = role === 'admin' || role === 'super_admin';

  const loadCache = async () => {
    try {
      const mod = await import('../services/firestore.js');
      const [insights, fm] = await Promise.all([mod.getCachedInsights?.(), mod.getCachedForeignMasters?.()]);
      const nextSources = (fm?.directory || insights?.analystRadar || []).map(normalizeSource);
      const nextPosts = (fm?.posts || []).map(normalizePost);
      const nextManual = (fm?.manualItems || fm?.manualPosts || insights?.analystPicks || insights?.foreignAnalystPicks || []).map(normalizePost);
      const nextArticles = (insights?.articles || []).map(normalizeArticle);
      const effectiveSources = nextSources.length ? nextSources : FALLBACK_SOURCES.map(normalizeSource);
      const effectivePosts = nextPosts.length ? nextPosts : buildBootstrapPosts(effectiveSources);
      setSources(effectiveSources);
      setPosts(effectivePosts);
      setManual(nextManual);
      setArticles(nextArticles);
      const when = fm?.refreshedAt || insights?.refreshedAt || fm?.updatedAt || insights?.updatedAt;
      setNotice(when ? `已載入國外分析大師情報庫，更新時間：${timeAgo(when)}` : '已載入國外分析大師情報庫；目前先顯示預載情報卡，更新後會改顯示公開 RSS / metadata 新內容。');
      return true;
    } catch (e) {
      console.warn('[InternationalInsights] load skipped:', e.message);
      return false;
    }
  };

  const adminRefresh = async () => {
    setRefreshing(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/cron/refresh-insights', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-trigger': '1' } }),
        fetch('/api/cron/refresh-foreign-masters', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-trigger': '1' } }),
      ]);
      const [d1, d2] = await Promise.all([r1.json().catch(() => ({})), r2.json().catch(() => ({}))]);
      if (!r1.ok || d1.success === false) throw new Error(d1.error || `insights HTTP ${r1.status}`);
      if (!r2.ok || d2.success === false) throw new Error(d2.error || `foreign-masters HTTP ${r2.status}`);
      setNotice(`已更新：國際新聞 ${d1.total || 0} 則，自動大師情報 ${d2.total || 0} 則，來源 ${d2.sourceCount || 0} 個。`);
      await loadCache();
    } catch (e) { setNotice('更新失敗：' + e.message); }
    finally { setRefreshing(false); }
  };

  const saveManual = async (next) => {
    const mod = await import('../services/firestore.js');
    const ok = await mod.setCachedForeignMasters?.({ manualItems: next, manualCount: next.length, manualUpdatedAt: new Date().toISOString() });
    if (!ok) throw new Error('Firestore 寫入失敗，請確認目前帳號有 admin 權限');
  };

  const addManual = async () => {
    if (!isAdmin) return;
    const item = normalizePost({ ...form, eventKeywords: parseKeywords(form.eventKeywords), sourceType: 'manual_private_analyst', addedAt: new Date().toISOString() });
    if (!item.summaryZh && !item.shortExcerpt && !item.title) { setNotice('請至少填寫標題、短摘錄或中文摘要。'); return; }
    setSaving(true);
    try {
      const next = [item, ...manual].slice(0, 120);
      await saveManual(next);
      setManual(next);
      setForm(emptyManual);
      setNotice('已新增人工補強觀點；下一次 generate-analysis 會匹配進每場賽事的大師牆。');
    } catch (e) { setNotice('新增失敗：' + e.message); }
    finally { setSaving(false); }
  };

  const deleteManual = async (id) => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const next = manual.filter(x => x.id !== id);
      await saveManual(next);
      setManual(next);
      setNotice('已移除人工補強觀點。');
    } catch (e) { setNotice('移除失敗：' + e.message); }
    finally { setSaving(false); }
  };

  useEffect(() => { (async () => { setLoading(true); const ok = await loadCache(); if (!ok) { setSources(FALLBACK_SOURCES.map(normalizeSource)); setNotice('快取尚未建立，先顯示內建六大項目來源雷達。'); } setLoading(false); })(); }, []);

  const visibleItems = mode === 'sources' ? sources : mode === 'posts' ? posts : mode === 'manual' ? manual : articles;
  const sports = useMemo(() => {
    const all = Array.from(new Set(visibleItems.map(n => normSport(n.sport)).filter(Boolean)));
    const priority = ['足球', 'LOL', 'NBA', 'MLB', '網球', 'F1', '綜合'];
    return ['全部', ...priority.filter(s => all.includes(s)), ...all.filter(s => !priority.includes(s))];
  }, [visibleItems]);
  const filtered = useMemo(() => visibleItems.filter(n => filter === '全部' || normSport(n.sport) === filter), [visibleItems, filter]);
  const setModeAndReset = (next) => { setMode(next); setFilter('全部'); };
  const tabBtn = (key, text) => <button onClick={() => setModeAndReset(key)} style={{ padding: '9px 16px', border: `1px solid ${mode === key ? C.navy : C.border}`, borderRadius: 9, cursor: 'pointer', background: mode === key ? C.navy : C.white, color: mode === key ? C.white : C.dark, fontWeight: 900, fontSize: 13 }}>{text}</button>;

  const sportCoverage = useMemo(() => SPORTS.reduce((acc, sp) => ({ ...acc, [sp]: sources.some(s => normSport(s.sport) === sp) }), {}), [sources]);

  return <div style={{ background: C.bg, minHeight: '100vh' }}><div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 20px' }}>
    <div style={{ background: 'linear-gradient(135deg,#0F3460,#1B5E20)', borderRadius: 16, padding: '22px 24px', color: C.white, marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#FBBF24', marginBottom: 8, textTransform: 'uppercase' }}>Foreign Analyst Masters Intelligence</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 950, margin: '0 0 8px' }}>國外分析大師情報庫</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,.82)', fontSize: 13, lineHeight: 1.75 }}>
            V6G 不是把用戶導去別站，而是把國外分析師、新聞、用戶分享與公開資料整理成 SignalEdge 站內情報。每場賽事會匹配成「賽事情報牆」，用戶先看我們的中文摘要、共識、分歧、下注條件與二次分析。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={loadCache} disabled={refreshing} style={{ padding: '9px 13px', border: '1px solid rgba(255,255,255,.35)', borderRadius: 8, background: 'rgba(255,255,255,.12)', color: C.white, cursor: 'pointer', fontWeight: 800, fontSize: 12 }}>重新載入</button>
          {isAdmin && <button onClick={adminRefresh} disabled={refreshing} style={{ padding: '9px 13px', border: 'none', borderRadius: 8, background: '#E9B44C', color: C.navy, cursor: 'pointer', fontWeight: 900, fontSize: 12 }}>{refreshing ? '更新中...' : '更新情報庫'}</button>}
        </div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginBottom: 14 }}>
      <Stat label="國外來源" value={sources.length} />
      <Stat label="自動情報" value={posts.length} color={C.green} />
      <Stat label="人工補強" value={manual.length} color={C.purple} />
      <Stat label="國際新聞" value={articles.length} color={C.blue} />
      <Stat label="六大項目" value={`${Object.values(sportCoverage).filter(Boolean).length}/6`} color={C.amber} />
    </div>

    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: C.muted, fontWeight: 900, marginBottom: 8 }}>六大項目覆蓋</div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{SPORTS.map(sp => <Chip key={sp} color={sportCoverage[sp] ? (SC[sp] || C.navy) : C.muted}>{sp}{sportCoverage[sp] ? ' 已接' : ' 待補'}</Chip>)}</div>
    </div>

    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
      {tabBtn('sources', '來源庫')}
      {tabBtn('posts', '自動情報流')}
      {tabBtn('manual', '人工補強')}
      {tabBtn('news', '國際新聞')}
    </div>

    {sports.length > 1 && <div style={{ overflowX: 'auto', marginBottom: 14 }}><div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.white, width: 'max-content' }}>{sports.map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', background: filter === s ? C.navy : 'transparent', color: filter === s ? C.white : C.muted, fontSize: 12, fontWeight: 800, borderRight: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{s}</button>)}</div></div>}
    {notice && <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 12px', color: C.navy, fontSize: 12, marginBottom: 14 }}>{notice}</div>}
    {loading && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, textAlign: 'center', color: C.muted }}>載入國外分析大師情報庫...</div>}

    {!loading && mode === 'sources' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
      {filtered.map(a => {
        const sc = SC[normSport(a.sport)] || C.navy;
        return <div key={a.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: C.white, border: `1px solid ${C.border}`, borderTop: `4px solid ${sc}`, borderRadius: 12, padding: '15px 16px', minHeight: 210 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}><div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}><Chip color={sc}>{normSport(a.sport)}</Chip><Chip color={C.muted}>{a.sourceType}</Chip></div><span style={{ fontSize: 10, color: C.amber, fontWeight: 950 }}>Tier {a.tier}</span></div>
          <div style={{ fontSize: 17, fontWeight: 950, color: C.dark, lineHeight: 1.35, marginBottom: 6 }}>{a.name}</div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, marginBottom: 10 }}>{a.sourceLabel}</div>
          <div style={{ fontSize: 12, color: C.dark, lineHeight: 1.65, marginBottom: 10 }}><b>怎麼用：</b>{a.useForZh || '作為國外分析大師對照來源。'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{(a.topics || []).slice(0, 6).map(x => <Chip key={x} color={C.navy}>{x}</Chip>)}</div>
          <div style={{ fontSize: 11, color: C.red, lineHeight: 1.5, marginTop: 10 }}>限制：只可短摘錄 + 連結 + 自行摘要；不可搬運全文或付費內容。</div>
        </div>;
      })}
    </div>}

    {!loading && mode === 'posts' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
      {filtered.map(p => {
        const sc = SC[normSport(p.sport)] || C.navy;
        return <div key={p.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: C.white, border: `1px solid ${C.border}`, borderTop: `4px solid ${sc}`, borderRadius: 12, padding: '15px 16px', minHeight: 205 }}>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}><Chip color={sc}>{normSport(p.sport)}</Chip><Chip color={C.muted}>{p.sourceLabel}</Chip><Chip color={C.amber}>{p.stance}</Chip>{p.isBootstrap && <Chip color={C.green}>預載對照</Chip>}{p.publishedAt && <span style={{ fontSize: 10, color: C.muted, padding: '3px 0' }}>{timeAgo(p.publishedAt)}</span>}</div>
          <div style={{ fontSize: 16, fontWeight: 950, color: C.dark, lineHeight: 1.45, marginBottom: 8 }}>{p.title}</div>
          {p.summaryZh && <div style={{ fontSize: 12, color: C.dark, lineHeight: 1.65, marginBottom: 8 }}>{p.summaryZh}</div>}
          {p.shortExcerpt && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55, padding: 9, background: C.panel, borderRadius: 8 }}>短摘錄：{p.shortExcerpt}</div>}
          {p.signalEdgeInterpretation && <div style={{ fontSize: 11, color: C.dark, lineHeight: 1.55, padding: 9, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, marginTop: 8 }}><b>SignalEdge 二次分析：</b>{p.signalEdgeInterpretation}</div>}
          <div style={{ marginTop: 10, fontSize: 11, color: C.muted, fontWeight: 900 }}>來源已存證於 SignalEdge，不作主要導流</div>
        </div>;
      })}
    </div>}

    {!loading && mode === 'manual' && <div style={{ display: 'grid', gap: 12 }}>
      {isAdmin && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 950, marginBottom: 6 }}>人工補強國外分析大師觀點</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>當某些私人分析師沒有 RSS / API 時，可以手動補短摘錄與來源存證；下一次分析會自動匹配到賽事大師牆，站內呈現 SignalEdge 二次分析。</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          <Field title="分析師 / 來源"><input style={input} value={form.sourceName} onChange={e => setForm(p => ({ ...p, sourceName: e.target.value }))} placeholder="例：Substack 作者 / YouTube 分析師" /></Field>
          <Field title="平台"><input style={input} value={form.sourceLabel} onChange={e => setForm(p => ({ ...p, sourceLabel: e.target.value }))} placeholder="YouTube / X / Substack / Blog" /></Field>
          <Field title="項目"><select style={input} value={form.sport} onChange={e => setForm(p => ({ ...p, sport: e.target.value }))}>{['足球','LOL','NBA','MLB','網球','F1','綜合'].map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field title="傾向"><select style={input} value={form.stance} onChange={e => setForm(p => ({ ...p, stance: e.target.value }))}>{['watch','lean_home','lean_away','lean_draw','over','under','market_context'].map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field title="信心"><select style={input} value={form.confidence} onChange={e => setForm(p => ({ ...p, confidence: e.target.value }))}>{['low','medium','high','未評級'].map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field title="來源連結"><input style={input} value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginTop: 10 }}>
          <Field title="標題"><input style={input} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></Field>
          <Field title="匹配關鍵字"><input style={input} value={form.eventKeywords} onChange={e => setForm(p => ({ ...p, eventKeywords: e.target.value }))} placeholder="France, Brazil, T1, Lakers, Verstappen" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10, marginTop: 10 }}>
          <Field title="短摘錄"><textarea style={{ ...input, minHeight: 82 }} value={form.shortExcerpt} onChange={e => setForm(p => ({ ...p, shortExcerpt: e.target.value }))} /></Field>
          <Field title="中文摘要"><textarea style={{ ...input, minHeight: 82 }} value={form.summaryZh} onChange={e => setForm(p => ({ ...p, summaryZh: e.target.value }))} /></Field>
          <Field title="SignalEdge 對照解讀"><textarea style={{ ...input, minHeight: 82 }} value={form.signalEdgeInterpretation} onChange={e => setForm(p => ({ ...p, signalEdgeInterpretation: e.target.value }))} /></Field>
        </div>
        <button onClick={addManual} disabled={saving} style={{ marginTop: 12, background: C.navy, color: C.white, border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 900, cursor: 'pointer' }}>{saving ? '儲存中...' : '新增人工觀點'}</button>
      </div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>{filtered.map(p => {
        const sc = SC[normSport(p.sport)] || C.navy;
        return <div key={p.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: `4px solid ${sc}`, borderRadius: 12, padding: '15px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 9 }}><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><Chip color={sc}>{normSport(p.sport)}</Chip><Chip color={C.amber}>{p.stance}</Chip><Chip color={C.muted}>{p.confidence}</Chip></div>{isAdmin && <button onClick={() => deleteManual(p.id)} disabled={saving} style={{ border: 'none', background: '#FEE2E2', color: C.red, borderRadius: 6, padding: '4px 7px', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>刪除</button>}</div>
          <div style={{ fontSize: 16, fontWeight: 950, color: C.dark, lineHeight: 1.4 }}>{p.title}</div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, marginTop: 5 }}>{p.sourceName}{p.sourceLabel ? ` · ${p.sourceLabel}` : ''}</div>
          {p.summaryZh && <div style={{ fontSize: 12, color: C.dark, lineHeight: 1.65, marginTop: 10 }}><b>中文摘要：</b>{p.summaryZh}</div>}
          {p.shortExcerpt && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55, marginTop: 8, padding: 9, background: C.panel, borderRadius: 8 }}>短摘錄：{p.shortExcerpt}</div>}
          {p.url && <div style={{ display: 'inline-block', marginTop: 10, fontSize: 11, color: C.muted, fontWeight: 900 }}>來源已存證於系統</div>}
        </div>;
      })}</div>
    </div>}

    {!loading && mode === 'news' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
      {filtered.map(a => {
        const sc = SC[normSport(a.sport)] || C.navy;
        return <div key={a.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: C.white, border: `1px solid ${C.border}`, borderTop: `4px solid ${sc}`, borderRadius: 12, padding: '15px 16px', minHeight: 145 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}><Chip color={sc}>{normSport(a.sport)}</Chip><Chip color={C.muted}>{a.sourceLabel}</Chip>{a.publishedAt && <span style={{ fontSize: 10, color: C.muted }}>{timeAgo(a.publishedAt)}</span>}</div>
          <div style={{ fontSize: 15, fontWeight: 950, color: C.dark, lineHeight: 1.45, marginBottom: 8 }}>{a.titleDisplay}</div>
          {a.summaryDisplay && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.65 }}>{a.summaryDisplay}</div>}
        </div>;
      })}
    </div>}

    {!loading && filtered.length === 0 && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 34, textAlign: 'center', color: C.muted }}>目前沒有符合篩選的資料。</div>}
    <div style={{ marginTop: 14, padding: '10px', background: '#F6F7FA', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: C.muted, textAlign: 'center' }}>國外分析大師 = 站內情報庫 + 人工補強 + 賽事情報牆 + SignalEdge 決策引擎；外部來源只作存證，主體內容留在 SignalEdge。</div>
  </div></div>;
}
