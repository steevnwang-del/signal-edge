import { useEffect, useMemo, useState } from 'react';

const C = {
  navy: '#0F3460', white: '#FFFFFF', dark: '#111827', muted: '#6B7280',
  border: '#D4D8DF', bg: '#ECEEF2', amber: '#D97706', panel: '#F6F7FA',
  green: '#1B5E20', purple: '#7C3AED', blue: '#2563EB', red: '#C9082A'
};
const SC = { 世界杯: '#006400', 足球: '#1B5E20', NBA: '#C9082A', MLB: '#002D72', 電競: '#7C3AED', UFC: '#D20A0A', 綜合: '#0F3460' };

const FALLBACK_ANALYSTS = [
  {
    id: 'fallback-opta', name: 'Opta Analyst', sourceLabel: 'Opta Analyst', sport: '足球', category: '數據模型', tier: 'A',
    url: 'https://theanalyst.com/', focusZh: '球隊強弱、xG、賽前數據趨勢與戰術背景。',
    useForZh: '用來核對 Elo/Poisson 與市場價格，不直接當作下注結論。',
    signalChecklist: ['xG 趨勢', '射門品質', '壓迫', '控球', '賽前敘事']
  },
  {
    id: 'fallback-oracle', name: "Oracle's Elixir", sourceLabel: "Oracle's Elixir", sport: '電競', category: 'LOL 數據', tier: 'A',
    url: 'https://oracleselixir.com/', focusZh: 'LOL 隊伍、選手、版本、賽區強度與比賽節奏。',
    useForZh: '用來確認 MSI / Worlds 版本與隊伍資料；沒有賠率時不計算 EV。',
    signalChecklist: ['版本', '藍紅方', '選手名單', '賽區強度', '前期節奏']
  },
  {
    id: 'fallback-fangraphs', name: 'FanGraphs', sourceLabel: 'FanGraphs', sport: 'MLB', category: '棒球數據', tier: 'A',
    url: 'https://blogs.fangraphs.com/', focusZh: '投打進階數據、先發投手、牛棚、打線與球隊真實實力。',
    useForZh: '用來核對投手、牛棚與打線，不可自行補投手或傷病。',
    signalChecklist: ['先發投手', '牛棚疲勞', 'wRC+', 'xFIP', '球場因素']
  },
  {
    id: 'fallback-ctg', name: 'Cleaning the Glass', sourceLabel: 'Cleaning the Glass', sport: 'NBA', category: '籃球進階數據', tier: 'A',
    url: 'https://cleaningtheglass.com/', focusZh: '半場效率、四因素、垃圾時間修正、陣容與球隊型態。',
    useForZh: '用來檢查市場是否高估近期戰績或低估效率差。',
    signalChecklist: ['四因素', '半場效率', '籃板率', '失誤率', '陣容效率']
  }
];

const FALLBACK_ARTICLES = [
  { id: 'fallback-worldcup', titleZh: '世界盃 2026 國際報導仍是賽前背景的重要參考', title: 'World Cup 2026 international coverage remains a key context source', sourceLabel: 'SignalEdge', sport: '世界杯', url: 'https://www.fifa.com/', publishedAt: new Date().toISOString(), summaryZh: '快取尚未建立時，新聞只作背景資訊；真正分析會優先看模型、賠率與資料完整度。' },
  { id: 'fallback-lol', titleZh: '英雄聯盟國際賽需要確認版本、名單與賽制資訊', title: 'League of Legends international events require version and roster confirmation', sourceLabel: 'SignalEdge', sport: '電競', url: 'https://lolesports.com/', publishedAt: new Date().toISOString(), summaryZh: '沒有賠率的電競賽事只做情報觀察，不計算投注 EV。' },
];

const timeAgo = (date) => {
  try {
    const d = new Date(date);
    const s = (Date.now() - d.getTime()) / 1000;
    if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} 分鐘前`;
    if (s < 86400) return `${Math.floor(s / 3600)} 小時前`;
    return d.toLocaleDateString('zh-TW');
  } catch { return ''; }
};

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

export default function InternationalInsights({ role }) {
  const [articles, setArticles] = useState([]);
  const [analysts, setAnalysts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('全部');
  const [mode, setMode] = useState('analysts');
  const [notice, setNotice] = useState('');
  const isAdmin = role === 'admin' || role === 'super_admin';

  const loadCache = async () => {
    try {
      const mod = await import('../services/firestore.js');
      const cached = await mod.getCachedInsights?.();
      const cachedAnalysts = normalizeAnalysts(cached?.analystRadar || []);
      const cachedArticles = normalizeArticles(cached?.articles || []);
      if (cachedAnalysts.length || cachedArticles.length) {
        setAnalysts(cachedAnalysts.length ? cachedAnalysts : normalizeAnalysts(FALLBACK_ANALYSTS));
        setArticles(cachedArticles.length ? cachedArticles : normalizeArticles(FALLBACK_ARTICLES));
        const d = cached.refreshedAt || cached.updatedAt;
        setNotice(d?.toDate ? `分析師雷達快取更新：${d.toDate().toLocaleString('zh-TW')}` : '已載入分析師雷達與國際新聞快取');
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
      setNotice(`分析師雷達已更新：${d.analystCount || 0} 個來源，國際新聞 ${d.total || 0} 則`);
      await loadCache();
    } catch (e) {
      setNotice('更新分析師雷達失敗：' + e.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const ok = await loadCache();
      if (!ok) {
        setAnalysts(normalizeAnalysts(FALLBACK_ANALYSTS));
        setArticles(normalizeArticles(FALLBACK_ARTICLES));
        setNotice('分析師雷達快取尚未建立，先顯示內建觀察池；請由管理端更新快取。');
      }
      setLoading(false);
    })();
  }, []);

  const visibleItems = mode === 'analysts' ? analysts : articles;
  const sports = useMemo(() => {
    const all = Array.from(new Set(visibleItems.map(n => n.sport).filter(Boolean)));
    const priority = ['世界杯', '足球', 'MLB', 'NBA', '電競', 'UFC'];
    return ['全部', ...priority.filter(s => all.includes(s)), ...all.filter(s => !priority.includes(s))];
  }, [visibleItems]);

  const filteredAnalysts = useMemo(() => analysts.filter(n => filter === '全部' || n.sport === filter), [analysts, filter]);
  const filteredArticles = useMemo(() => articles.filter(n => filter === '全部' || n.sport === filter), [articles, filter]);
  const activeSportsCount = useMemo(() => new Set(analysts.map(a => a.sport).filter(Boolean)).size, [analysts]);

  const setModeAndReset = (next) => {
    setMode(next);
    setFilter('全部');
  };

  return <div style={{ background: C.bg, minHeight: '100vh' }}><div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
    <div style={{ background: 'linear-gradient(135deg,#0F3460,#1B5E20)', borderRadius: 16, padding: '22px 24px', color: C.white, marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#FBBF24', marginBottom: 8, textTransform: 'uppercase' }}>Foreign Analyst Radar</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 950, margin: '0 0 8px' }}>國外分析師雷達</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,.80)', fontSize: 13, lineHeight: 1.75 }}>
            這裡不是一般新聞牆，而是把國外數據源、戰術分析師與賽事情報源整理成「賽前核對清單」。新聞快取只放在第二頁籤；AI 只能引用 DATA_BLOCK 內的文章與摘錄，不會自行創造大師看法。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={loadCache} disabled={refreshing} style={{ padding: '9px 13px', border: '1px solid rgba(255,255,255,.35)', borderRadius: 8, background: 'rgba(255,255,255,.12)', color: C.white, cursor: 'pointer', fontWeight: 800, fontSize: 12 }}>重新載入</button>
          {isAdmin && <button onClick={adminRefresh} disabled={refreshing} style={{ padding: '9px 13px', border: 'none', borderRadius: 8, background: '#E9B44C', color: C.navy, cursor: 'pointer', fontWeight: 900, fontSize: 12 }}>{refreshing ? '更新中...' : '更新雷達'}</button>}
        </div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 14 }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>國外分析源</div>
        <div style={{ fontSize: 22, color: C.navy, fontWeight: 950 }}>{analysts.length}</div>
      </div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>覆蓋項目</div>
        <div style={{ fontSize: 22, color: C.green, fontWeight: 950 }}>{activeSportsCount}</div>
      </div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>國際新聞快取</div>
        <div style={{ fontSize: 22, color: C.blue, fontWeight: 950 }}>{articles.length}</div>
      </div>
    </div>

    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
      <button onClick={() => setModeAndReset('analysts')} style={{ padding: '9px 16px', border: `1px solid ${mode === 'analysts' ? C.navy : C.border}`, borderRadius: 9, cursor: 'pointer', background: mode === 'analysts' ? C.navy : C.white, color: mode === 'analysts' ? C.white : C.dark, fontWeight: 900, fontSize: 13 }}>國外分析師雷達</button>
      <button onClick={() => setModeAndReset('news')} style={{ padding: '9px 16px', border: `1px solid ${mode === 'news' ? C.navy : C.border}`, borderRadius: 9, cursor: 'pointer', background: mode === 'news' ? C.navy : C.white, color: mode === 'news' ? C.white : C.dark, fontWeight: 900, fontSize: 13 }}>國際新聞快取</button>
    </div>

    {sports.length > 1 && <div style={{ overflowX: 'auto', marginBottom: 14 }}><div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.white, width: 'max-content' }}>{sports.map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', background: filter === s ? C.navy : 'transparent', color: filter === s ? C.white : C.muted, fontSize: 12, fontWeight: 800, borderRight: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{s}</button>)}</div></div>}
    {notice && <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 12px', color: C.navy, fontSize: 12, marginBottom: 14 }}>{notice}</div>}
    {loading && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, textAlign: 'center', color: C.muted }}>載入分析師雷達...</div>}

    {!loading && mode === 'analysts' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
      {filteredAnalysts.map(a => {
        const sc = SC[a.sport] || C.navy;
        return <a key={a.id} href={a.url || '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: C.white, border: `1px solid ${C.border}`, borderTop: `4px solid ${sc}`, borderRadius: 12, padding: '15px 16px', minHeight: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ background: sc + '18', color: sc, fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 4 }}>{a.sport}</span>
              <span style={{ fontSize: 10, color: C.muted, fontWeight: 900, background: C.panel, padding: '3px 8px', borderRadius: 4 }}>{a.category}</span>
            </div>
            <span style={{ fontSize: 10, color: C.amber, fontWeight: 950, whiteSpace: 'nowrap' }}>Tier {a.tier}</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 950, color: C.dark, lineHeight: 1.35, marginBottom: 6 }}>{a.name}</div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, marginBottom: 10 }}>{a.sourceLabel}</div>
          <div style={{ fontSize: 12, color: C.dark, lineHeight: 1.65, marginBottom: 8 }}><b>看什麼：</b>{a.focusZh}</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.65, marginBottom: 10 }}><b>怎麼用：</b>{a.useForZh}</div>
          {a.signalChecklist?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>{a.signalChecklist.slice(0, 6).map(x => <span key={x} style={{ fontSize: 10, color: C.navy, background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 7px', borderRadius: 999 }}>{x}</span>)}</div>}
          <div style={{ fontSize: 11, color: C.red, lineHeight: 1.5 }}>限制：{a.doNotUseForZh}</div>
        </a>;
      })}
    </div>}

    {!loading && mode === 'news' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
      {filteredArticles.map(a => {
        const sc = SC[a.sport] || C.navy;
        return <a key={a.id} href={a.url || '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: C.white, border: `1px solid ${C.border}`, borderTop: `4px solid ${sc}`, borderRadius: 12, padding: '15px 16px', minHeight: 145 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ background: sc + '18', color: sc, fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 4 }}>{a.sport}</span>
            <span style={{ fontSize: 10, color: C.muted, fontWeight: 800, background: C.panel, padding: '3px 8px', borderRadius: 4 }}>{a.sourceLabel}</span>
            {a.publishedAt && <span style={{ fontSize: 10, color: C.muted }}>{timeAgo(a.publishedAt)}</span>}
          </div>
          <div style={{ fontSize: 15, fontWeight: 950, color: C.dark, lineHeight: 1.45, marginBottom: 8 }}>{a.titleDisplay}</div>
          {a.title && a.title !== a.titleDisplay && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, marginBottom: 8 }}>{a.title}</div>}
          {a.summaryDisplay && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.65 }}>{a.summaryDisplay}</div>}
          <div style={{ marginTop: 12, fontSize: 11, color: C.navy, fontWeight: 900 }}>閱讀原文 →</div>
        </a>;
      })}
    </div>}

    {!loading && mode === 'analysts' && filteredAnalysts.length === 0 && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 34, textAlign: 'center', color: C.muted }}>目前沒有符合篩選的國外分析源。</div>}
    {!loading && mode === 'news' && filteredArticles.length === 0 && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 34, textAlign: 'center', color: C.muted }}>目前沒有符合篩選的國際新聞。</div>}
    <div style={{ marginTop: 14, padding: '10px', background: '#F6F7FA', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: C.muted, textAlign: 'center' }}>分析師雷達是「該核對哪些國外大師/數據源」；真正下注判斷仍由 odds、fair odds、EV、Elo/Poisson、外部預測與已快取文章共同決定。</div>
  </div></div>;
}
