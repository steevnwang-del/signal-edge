import { useEffect, useMemo, useState } from 'react';

const C = {
  navy: '#0F3460', white: '#FFFFFF', dark: '#111827', muted: '#6B7280',
  border: '#D4D8DF', bg: '#ECEEF2', amber: '#D97706', panel: '#F6F7FA',
  green: '#1B5E20', purple: '#7C3AED', blue: '#2563EB', red: '#C9082A'
};
const SC = { 世界杯: '#006400', 足球: '#1B5E20', NBA: '#C9082A', MLB: '#002D72', 電競: '#7C3AED', UFC: '#D20A0A', 綜合: '#0F3460' };

const input = { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 10px', fontSize: 13, outline: 'none', background: C.white };
const label = { fontSize: 11, fontWeight: 900, color: C.muted, marginBottom: 5, display: 'block' };

const FALLBACK_ANALYSTS = [
  { id: 'fallback-opta', name: 'Opta Analyst', sourceLabel: 'Opta Analyst', sport: '足球', category: '數據模型', tier: 'A', url: 'https://theanalyst.com/', focusZh: '球隊強弱、xG、賽前數據趨勢與戰術背景。', useForZh: '用來核對 Elo/Poisson 與市場價格，不直接當作下注結論。', signalChecklist: ['xG 趨勢', '射門品質', '壓迫', '控球', '賽前敘事'] },
  { id: 'fallback-private-football', name: '國外分析大師觀察池（足球）', sourceLabel: 'Curated Private Analysts', sport: '足球', category: '私人分析師觀點庫', tier: 'Manual-A', url: 'https://theanalyst.com/', focusZh: '國外個人分析師、戰術作者與數據型賽前 preview。', useForZh: '管理員貼短摘錄與連結後，才會進 DATA_BLOCK 做對照。', signalChecklist: ['短摘錄', '來源連結', '戰術理由', '模型對照', '盤口矛盾'] },
  { id: 'fallback-oracle', name: "Oracle's Elixir", sourceLabel: "Oracle's Elixir", sport: '電競', category: 'LOL 數據', tier: 'A', url: 'https://oracleselixir.com/', focusZh: 'LOL 隊伍、選手、版本、賽區強度與比賽節奏。', useForZh: '用來確認 MSI / Worlds 版本與隊伍資料；沒有賠率時不計算 EV。', signalChecklist: ['版本', '藍紅方', '選手名單', '賽區強度', '前期節奏'] },
  { id: 'fallback-private-esports', name: '國外分析大師觀察池（LOL / 電競）', sourceLabel: 'Curated Private Analysts', sport: '電競', category: '私人分析師觀點庫', tier: 'Manual-A', url: 'https://lolesports.com/', focusZh: '國外主播、前教練、分析台與版本/BP 深度觀點。', useForZh: '只引用管理員輸入的短摘錄與中文摘要，不搬運全文。', signalChecklist: ['版本解讀', 'BP 對位', '選手狀態', '名單確認', '市場對照'] },
  { id: 'fallback-fangraphs', name: 'FanGraphs', sourceLabel: 'FanGraphs', sport: 'MLB', category: '棒球數據', tier: 'A', url: 'https://blogs.fangraphs.com/', focusZh: '投打進階數據、先發投手、牛棚、打線與球隊真實實力。', useForZh: '用來核對投手、牛棚與打線，不可自行補投手或傷病。', signalChecklist: ['先發投手', '牛棚疲勞', 'wRC+', 'xFIP', '球場因素'] },
  { id: 'fallback-ctg', name: 'Cleaning the Glass', sourceLabel: 'Cleaning the Glass', sport: 'NBA', category: '籃球進階數據', tier: 'A', url: 'https://cleaningtheglass.com/', focusZh: '半場效率、四因素、垃圾時間修正、陣容與球隊型態。', useForZh: '用來檢查市場是否高估近期戰績或低估效率差。', signalChecklist: ['四因素', '半場效率', '籃板率', '失誤率', '陣容效率'] }
];

const FALLBACK_ARTICLES = [
  { id: 'fallback-worldcup', titleZh: '世界盃 2026 國際報導仍是賽前背景的重要參考', title: 'World Cup 2026 international coverage remains a key context source', sourceLabel: 'SignalEdge', sport: '世界杯', url: 'https://www.fifa.com/', publishedAt: new Date().toISOString(), summaryZh: '快取尚未建立時，新聞只作背景資訊；真正分析會優先看模型、賠率與資料完整度。' },
  { id: 'fallback-lol', titleZh: '英雄聯盟國際賽需要確認版本、名單與賽制資訊', title: 'League of Legends international events require version and roster confirmation', sourceLabel: 'SignalEdge', sport: '電競', url: 'https://lolesports.com/', publishedAt: new Date().toISOString(), summaryZh: '沒有賠率的電競賽事只做情報觀察，不計算投注 EV。' },
];

const emptyPick = { analystName: '', platform: '', sport: '足球', title: '', url: '', excerpt: '', summaryZh: '', ourInterpretation: '', stance: 'watch', confidence: 'medium', eventKeywords: '' };

const timeAgo = (date) => {
  try {
    const d = new Date(date);
    const s = (Date.now() - d.getTime()) / 1000;
    if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} 分鐘前`;
    if (s < 86400) return `${Math.floor(s / 3600)} 小時前`;
    return d.toLocaleDateString('zh-TW');
  } catch { return ''; }
};
const cut = (v = '', n = 420) => {
  const t = String(v || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const parseKeywords = (v = '') => String(v || '').split(/[，,\n|/]/).map(x => x.trim()).filter(Boolean).slice(0, 12);

const normalizeArticles = (items = []) => items.filter(a => a?.title || a?.titleZh).map((a, i) => ({
  ...a,
  id: a.id || `insight-${i}`,
  titleDisplay: a.titleZh || a.titleDisplay || a.title || 'Untitled',
  sourceLabel: a.sourceLabel || a.source || 'International',
  sport: a.sport || '綜合',
  summaryDisplay: a.summaryZh || a.summary || '',
}));

const normalizeAnalysts = (items = []) => items.filter(a => a?.name || a?.sourceLabel).map((a, i) => ({
  ...a,
  id: a.id || `analyst-${i}`,
  name: a.name || a.sourceLabel || 'International Analyst',
  sourceLabel: a.sourceLabel || a.name || 'Analyst Radar',
  sport: a.sport || '綜合',
  category: a.category || '觀點源',
  tier: a.tier || 'Watch',
  focusZh: a.focusZh || a.focus || '',
  useForZh: a.useForZh || a.useFor || '',
  doNotUseForZh: a.doNotUseForZh || a.doNotUseFor || '不可把來源名稱直接轉成勝率、EV 或下注方向。',
  signalChecklist: Array.isArray(a.signalChecklist) ? a.signalChecklist : [],
}));

const normalizePicks = (items = []) => items.filter(p => p?.analystName || p?.name || p?.summaryZh || p?.excerpt || p?.title).map((p, i) => ({
  ...p,
  id: p.id || `pick-${Date.now()}-${i}`,
  analystName: cut(p.analystName || p.name || p.sourceLabel || '國外分析師', 80),
  platform: cut(p.platform || p.sourceLabel || p.source || '', 80),
  sourceLabel: cut(p.sourceLabel || p.platform || p.source || p.analystName || 'Foreign Analyst', 80),
  sport: p.sport || '綜合',
  title: cut(p.title || '國外分析大師觀點', 140),
  url: String(p.url || p.link || '').trim(),
  excerpt: cut(p.excerpt || p.shortExcerpt || p.quote || '', 360),
  summaryZh: cut(p.summaryZh || p.summary || p.ourSummary || '', 320),
  ourInterpretation: cut(p.ourInterpretation || p.interpretation || '', 320),
  stance: p.stance || p.direction || 'watch',
  confidence: p.confidence || '未評級',
  eventKeywords: Array.isArray(p.eventKeywords) ? p.eventKeywords : parseKeywords(p.eventKeywords || p.keywords || p.teams || ''),
  addedAt: p.addedAt || new Date().toISOString(),
  copyrightMode: p.copyrightMode || 'short_excerpt_with_link_only',
}));

function Field({ title, children }) {
  return <div><label style={label}>{title}</label>{children}</div>;
}

export default function InternationalInsights({ role }) {
  const [articles, setArticles] = useState([]);
  const [analysts, setAnalysts] = useState([]);
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingPick, setSavingPick] = useState(false);
  const [filter, setFilter] = useState('全部');
  const [mode, setMode] = useState('analysts');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(emptyPick);
  const [bulkJson, setBulkJson] = useState('');
  const isAdmin = role === 'admin' || role === 'super_admin';

  const loadCache = async () => {
    try {
      const mod = await import('../services/firestore.js');
      const cached = await mod.getCachedInsights?.();
      const cachedAnalysts = normalizeAnalysts(cached?.analystRadar || []);
      const cachedArticles = normalizeArticles(cached?.articles || []);
      const cachedPicks = normalizePicks(cached?.analystPicks || cached?.foreignAnalystPicks || []);
      if (cachedAnalysts.length || cachedArticles.length || cachedPicks.length) {
        setAnalysts(cachedAnalysts.length ? cachedAnalysts : normalizeAnalysts(FALLBACK_ANALYSTS));
        setArticles(cachedArticles.length ? cachedArticles : normalizeArticles(FALLBACK_ARTICLES));
        setPicks(cachedPicks);
        const d = cached.refreshedAt || cached.updatedAt;
        setNotice(d?.toDate ? `國外分析大師快取更新：${d.toDate().toLocaleString('zh-TW')}` : '已載入國外分析大師雷達、觀點庫與國際新聞快取');
        return true;
      }
    } catch (e) { console.warn('[InternationalInsights] cache skipped:', e.message); }
    return false;
  };

  const adminRefresh = async () => {
    setRefreshing(true);
    try {
      const r = await fetch('/api/cron/refresh-insights', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-trigger': '1' } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.success === false) throw new Error(d.error || `HTTP ${r.status}`);
      setNotice(`國外分析大師雷達已更新：${d.analystCount || 0} 個來源，國際新聞 ${d.total || 0} 則；人工觀點庫會保留。`);
      await loadCache();
    } catch (e) {
      setNotice('更新國外分析大師雷達失敗：' + e.message);
    } finally { setRefreshing(false); }
  };

  const savePicksToCache = async (next) => {
    const mod = await import('../services/firestore.js');
    const ok = await mod.setCachedInsights?.({ analystPicks: next, analystPickCount: next.length, analystPickUpdatedAt: new Date().toISOString() });
    if (!ok) throw new Error('Firestore 寫入失敗，請確認目前帳號有 admin 權限');
  };

  const addPick = async () => {
    if (!isAdmin) return;
    const normalized = normalizePicks([{ ...form, eventKeywords: parseKeywords(form.eventKeywords) }])[0];
    if (!normalized?.summaryZh && !normalized?.excerpt && !normalized?.title) {
      setNotice('請至少填寫標題、短摘錄或中文摘要。');
      return;
    }
    setSavingPick(true);
    try {
      const next = [normalized, ...picks].slice(0, 80);
      await savePicksToCache(next);
      setPicks(next);
      setForm(emptyPick);
      setNotice('已新增國外分析大師觀點。這些內容會在 generate-analysis 時匹配進 DATA_BLOCK 做對照。');
    } catch (e) { setNotice('新增失敗：' + e.message); }
    finally { setSavingPick(false); }
  };

  const importBulk = async () => {
    if (!isAdmin || !bulkJson.trim()) return;
    setSavingPick(true);
    try {
      const parsed = JSON.parse(bulkJson);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const next = [...normalizePicks(arr), ...picks].slice(0, 120);
      await savePicksToCache(next);
      setPicks(next);
      setBulkJson('');
      setNotice(`已匯入 ${arr.length} 則國外分析大師觀點。`);
    } catch (e) { setNotice('JSON 匯入失敗：' + e.message); }
    finally { setSavingPick(false); }
  };

  const deletePick = async (id) => {
    if (!isAdmin) return;
    setSavingPick(true);
    try {
      const next = picks.filter(p => p.id !== id);
      await savePicksToCache(next);
      setPicks(next);
      setNotice('已移除觀點。');
    } catch (e) { setNotice('移除失敗：' + e.message); }
    finally { setSavingPick(false); }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const ok = await loadCache();
      if (!ok) {
        setAnalysts(normalizeAnalysts(FALLBACK_ANALYSTS));
        setArticles(normalizeArticles(FALLBACK_ARTICLES));
        setPicks([]);
        setNotice('國外分析大師快取尚未建立，先顯示內建觀察池；請由管理端更新快取或新增人工觀點。');
      }
      setLoading(false);
    })();
  }, []);

  const visibleItems = mode === 'analysts' ? analysts : mode === 'picks' ? picks : articles;
  const sports = useMemo(() => {
    const all = Array.from(new Set(visibleItems.map(n => n.sport).filter(Boolean)));
    const priority = ['世界杯', '足球', 'MLB', 'NBA', '電競', 'UFC', '綜合'];
    return ['全部', ...priority.filter(s => all.includes(s)), ...all.filter(s => !priority.includes(s))];
  }, [visibleItems]);

  const filteredAnalysts = useMemo(() => analysts.filter(n => filter === '全部' || n.sport === filter), [analysts, filter]);
  const filteredArticles = useMemo(() => articles.filter(n => filter === '全部' || n.sport === filter), [articles, filter]);
  const filteredPicks = useMemo(() => picks.filter(n => filter === '全部' || n.sport === filter), [picks, filter]);
  const activeSportsCount = useMemo(() => new Set(analysts.map(a => a.sport).filter(Boolean)).size, [analysts]);
  const setModeAndReset = (next) => { setMode(next); setFilter('全部'); };

  const tabBtn = (key, text) => <button onClick={() => setModeAndReset(key)} style={{ padding: '9px 16px', border: `1px solid ${mode === key ? C.navy : C.border}`, borderRadius: 9, cursor: 'pointer', background: mode === key ? C.navy : C.white, color: mode === key ? C.white : C.dark, fontWeight: 900, fontSize: 13 }}>{text}</button>;

  return <div style={{ background: C.bg, minHeight: '100vh' }}><div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px' }}>
    <div style={{ background: 'linear-gradient(135deg,#0F3460,#1B5E20)', borderRadius: 16, padding: '22px 24px', color: C.white, marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#FBBF24', marginBottom: 8, textTransform: 'uppercase' }}>Foreign Analyst Masters</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 950, margin: '0 0 8px' }}>國外分析大師</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,.82)', fontSize: 13, lineHeight: 1.75 }}>
            保留「國外分析大師」作為產品名稱，但底層改成對照系統：雷達負責告訴你該看哪些高品質來源；觀點庫由管理員貼短摘錄、連結與中文摘要；SignalEdge 再和 odds、fair odds、EV、Elo/Poisson 交叉判斷，不搬運全文、不創造大師立場。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={loadCache} disabled={refreshing} style={{ padding: '9px 13px', border: '1px solid rgba(255,255,255,.35)', borderRadius: 8, background: 'rgba(255,255,255,.12)', color: C.white, cursor: 'pointer', fontWeight: 800, fontSize: 12 }}>重新載入</button>
          {isAdmin && <button onClick={adminRefresh} disabled={refreshing} style={{ padding: '9px 13px', border: 'none', borderRadius: 8, background: '#E9B44C', color: C.navy, cursor: 'pointer', fontWeight: 900, fontSize: 12 }}>{refreshing ? '更新中...' : '更新雷達'}</button>}
        </div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 14 }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}><div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>國外分析源</div><div style={{ fontSize: 22, color: C.navy, fontWeight: 950 }}>{analysts.length}</div></div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}><div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>覆蓋項目</div><div style={{ fontSize: 22, color: C.green, fontWeight: 950 }}>{activeSportsCount}</div></div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}><div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>人工觀點庫</div><div style={{ fontSize: 22, color: C.purple, fontWeight: 950 }}>{picks.length}</div></div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}><div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>國際新聞快取</div><div style={{ fontSize: 22, color: C.blue, fontWeight: 950 }}>{articles.length}</div></div>
    </div>

    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
      {tabBtn('analysts', '國外分析大師雷達')}
      {tabBtn('picks', '大師觀點庫')}
      {tabBtn('news', '國際新聞快取')}
    </div>

    {sports.length > 1 && <div style={{ overflowX: 'auto', marginBottom: 14 }}><div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.white, width: 'max-content' }}>{sports.map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', background: filter === s ? C.navy : 'transparent', color: filter === s ? C.white : C.muted, fontSize: 12, fontWeight: 800, borderRight: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{s}</button>)}</div></div>}
    {notice && <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 12px', color: C.navy, fontSize: 12, marginBottom: 14 }}>{notice}</div>}
    {loading && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, textAlign: 'center', color: C.muted }}>載入國外分析大師...</div>}

    {!loading && mode === 'analysts' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
      {filteredAnalysts.map(a => {
        const sc = SC[a.sport] || C.navy;
        return <a key={a.id} href={a.url || '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: C.white, border: `1px solid ${C.border}`, borderTop: `4px solid ${sc}`, borderRadius: 12, padding: '15px 16px', minHeight: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}><div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ background: sc + '18', color: sc, fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 4 }}>{a.sport}</span><span style={{ fontSize: 10, color: C.muted, fontWeight: 900, background: C.panel, padding: '3px 8px', borderRadius: 4 }}>{a.category}</span></div><span style={{ fontSize: 10, color: C.amber, fontWeight: 950, whiteSpace: 'nowrap' }}>Tier {a.tier}</span></div>
          <div style={{ fontSize: 17, fontWeight: 950, color: C.dark, lineHeight: 1.35, marginBottom: 6 }}>{a.name}</div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, marginBottom: 10 }}>{a.sourceLabel}</div>
          <div style={{ fontSize: 12, color: C.dark, lineHeight: 1.65, marginBottom: 8 }}><b>看什麼：</b>{a.focusZh}</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.65, marginBottom: 10 }}><b>怎麼用：</b>{a.useForZh}</div>
          {a.signalChecklist?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>{a.signalChecklist.slice(0, 6).map(x => <span key={x} style={{ fontSize: 10, color: C.navy, background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 7px', borderRadius: 999 }}>{x}</span>)}</div>}
          <div style={{ fontSize: 11, color: C.red, lineHeight: 1.5 }}>限制：{a.doNotUseForZh}</div>
        </a>;
      })}
    </div>}

    {!loading && mode === 'picks' && <div style={{ display: 'grid', gap: 12 }}>
      {isAdmin && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 950, marginBottom: 6 }}>新增國外分析大師觀點</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>只貼短摘錄、來源連結與你自己的中文摘要。不要貼付費全文、不要大量翻譯。generate-analysis 只會引用這裡存在的內容。</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          <Field title="分析師 / 來源名稱"><input style={input} value={form.analystName} onChange={e => setForm(p => ({ ...p, analystName: e.target.value }))} placeholder="例：某 YouTube 分析師 / Substack 作者" /></Field>
          <Field title="平台"><input style={input} value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} placeholder="YouTube / X / Substack / Blog" /></Field>
          <Field title="項目"><select style={input} value={form.sport} onChange={e => setForm(p => ({ ...p, sport: e.target.value }))}>{['足球','世界杯','MLB','NBA','電競','UFC','綜合'].map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field title="傾向"><select style={input} value={form.stance} onChange={e => setForm(p => ({ ...p, stance: e.target.value }))}>{['watch','lean_home','lean_away','lean_draw','over','under','market_context'].map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field title="信心"><select style={input} value={form.confidence} onChange={e => setForm(p => ({ ...p, confidence: e.target.value }))}>{['low','medium','high','未評級'].map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field title="來源連結"><input style={input} value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginTop: 10 }}>
          <Field title="標題"><input style={input} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></Field>
          <Field title="匹配關鍵字（隊名/聯盟，用逗號分隔）"><input style={input} value={form.eventKeywords} onChange={e => setForm(p => ({ ...p, eventKeywords: e.target.value }))} placeholder="France, Brazil, MSI, T1" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10, marginTop: 10 }}>
          <Field title="短摘錄（少量原文）"><textarea style={{ ...input, minHeight: 82 }} value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} /></Field>
          <Field title="中文摘要（你自己的整理）"><textarea style={{ ...input, minHeight: 82 }} value={form.summaryZh} onChange={e => setForm(p => ({ ...p, summaryZh: e.target.value }))} /></Field>
          <Field title="SignalEdge 對照解讀"><textarea style={{ ...input, minHeight: 82 }} value={form.ourInterpretation} onChange={e => setForm(p => ({ ...p, ourInterpretation: e.target.value }))} /></Field>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}><button onClick={addPick} disabled={savingPick} style={{ background: C.navy, color: C.white, border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 900, cursor: 'pointer' }}>{savingPick ? '儲存中...' : '新增觀點'}</button></div>
        <details style={{ marginTop: 12 }}><summary style={{ cursor: 'pointer', fontSize: 12, color: C.navy, fontWeight: 900 }}>批次匯入 JSON</summary><textarea style={{ ...input, minHeight: 120, marginTop: 8, fontFamily: 'monospace', fontSize: 12 }} value={bulkJson} onChange={e => setBulkJson(e.target.value)} placeholder='[{"analystName":"...","sport":"電競","title":"...","url":"...","summaryZh":"...","eventKeywords":["T1","MSI"]}]' /><button onClick={importBulk} disabled={savingPick} style={{ marginTop: 8, background: C.green, color: C.white, border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 900 }}>匯入</button></details>
      </div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
        {filteredPicks.map(p => {
          const sc = SC[p.sport] || C.navy;
          return <div key={p.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: `4px solid ${sc}`, borderRadius: 12, padding: '15px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 9 }}><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><span style={{ background: sc + '18', color: sc, fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 4 }}>{p.sport}</span><span style={{ fontSize: 10, color: C.muted, fontWeight: 900, background: C.panel, padding: '3px 8px', borderRadius: 4 }}>{p.stance}</span><span style={{ fontSize: 10, color: C.amber, fontWeight: 900, background: '#FFFBEB', padding: '3px 8px', borderRadius: 4 }}>{p.confidence}</span></div>{isAdmin && <button onClick={() => deletePick(p.id)} disabled={savingPick} style={{ border: 'none', background: '#FEE2E2', color: C.red, borderRadius: 6, padding: '4px 7px', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>刪除</button>}</div>
            <div style={{ fontSize: 16, fontWeight: 950, color: C.dark, lineHeight: 1.4 }}>{p.title}</div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, marginTop: 5 }}>{p.analystName}{p.platform ? ` · ${p.platform}` : ''}</div>
            {p.summaryZh && <div style={{ fontSize: 12, color: C.dark, lineHeight: 1.65, marginTop: 10 }}><b>中文摘要：</b>{p.summaryZh}</div>}
            {p.ourInterpretation && <div style={{ fontSize: 12, color: C.navy, lineHeight: 1.65, marginTop: 8 }}><b>SignalEdge 對照：</b>{p.ourInterpretation}</div>}
            {p.excerpt && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55, marginTop: 8, padding: 9, background: C.panel, borderRadius: 8 }}>短摘錄：{p.excerpt}</div>}
            {p.eventKeywords?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>{p.eventKeywords.map(k => <span key={k} style={{ fontSize: 10, color: C.navy, background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 7px', borderRadius: 999 }}>{k}</span>)}</div>}
            {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 11, color: C.navy, fontWeight: 900, textDecoration: 'none' }}>查看來源 →</a>}
          </div>;
        })}
      </div>
    </div>}

    {!loading && mode === 'news' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
      {filteredArticles.map(a => {
        const sc = SC[a.sport] || C.navy;
        return <a key={a.id} href={a.url || '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: C.white, border: `1px solid ${C.border}`, borderTop: `4px solid ${sc}`, borderRadius: 12, padding: '15px 16px', minHeight: 145 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}><span style={{ background: sc + '18', color: sc, fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 4 }}>{a.sport}</span><span style={{ fontSize: 10, color: C.muted, fontWeight: 800, background: C.panel, padding: '3px 8px', borderRadius: 4 }}>{a.sourceLabel}</span>{a.publishedAt && <span style={{ fontSize: 10, color: C.muted }}>{timeAgo(a.publishedAt)}</span>}</div>
          <div style={{ fontSize: 15, fontWeight: 950, color: C.dark, lineHeight: 1.45, marginBottom: 8 }}>{a.titleDisplay}</div>
          {a.title && a.title !== a.titleDisplay && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, marginBottom: 8 }}>{a.title}</div>}
          {a.summaryDisplay && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.65 }}>{a.summaryDisplay}</div>}
          <div style={{ marginTop: 12, fontSize: 11, color: C.navy, fontWeight: 900 }}>閱讀原文 →</div>
        </a>;
      })}
    </div>}

    {!loading && mode === 'analysts' && filteredAnalysts.length === 0 && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 34, textAlign: 'center', color: C.muted }}>目前沒有符合篩選的國外分析大師來源。</div>}
    {!loading && mode === 'picks' && filteredPicks.length === 0 && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 34, textAlign: 'center', color: C.muted }}>目前觀點庫沒有符合篩選的資料。管理員可新增短摘錄與中文摘要。</div>}
    {!loading && mode === 'news' && filteredArticles.length === 0 && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 34, textAlign: 'center', color: C.muted }}>目前沒有符合篩選的國際新聞。</div>}
    <div style={{ marginTop: 14, padding: '10px', background: '#F6F7FA', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: C.muted, textAlign: 'center' }}>國外分析大師 = 雷達來源 + 人工觀點庫 + SignalEdge 自研模型對照；AI 只能讀 DATA_BLOCK，不會自己創造大師推薦。</div>
  </div></div>;
}
