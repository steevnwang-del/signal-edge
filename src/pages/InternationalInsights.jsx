import { useEffect, useMemo, useState } from 'react';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', bg:'#ECEEF2', amber:'#D97706', panel:'#F6F7FA', green:'#1B5E20' };
const SC = { 世界杯:'#006400', 足球:'#1B5E20', NBA:'#C9082A', MLB:'#002D72', 電競:'#7C3AED', UFC:'#D20A0A', 綜合:'#0F3460' };

const FALLBACK = [
  { id:'fallback-worldcup', titleZh:'世界盃 2026 國際報導仍是賽前背景的重要參考', title:'World Cup 2026 international coverage remains a key context source', sourceLabel:'SignalEdge', sport:'世界杯', url:'https://www.fifa.com/', publishedAt:new Date().toISOString(), summaryZh:'快取尚未建立時，先顯示備援觀點；管理員可更新國際觀點快取。' },
  { id:'fallback-lol', titleZh:'英雄聯盟國際賽需要確認版本、名單與賽制資訊', title:'League of Legends international events require version and roster confirmation', sourceLabel:'SignalEdge', sport:'電競', url:'https://lolesports.com/', publishedAt:new Date().toISOString(), summaryZh:'沒有賠率的電競賽事只做情報觀察，不計算投注 EV。' },
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

const normalize = (items = []) => items.filter(a => a?.title || a?.titleZh).map((a, i) => ({
  ...a,
  id: a.id || `insight-${i}`,
  titleDisplay: a.titleZh || a.titleDisplay || a.title || 'Untitled',
  sourceLabel: a.sourceLabel || a.source || 'International',
  sport: a.sport || '綜合',
  summaryDisplay: a.summaryZh || a.summary || '',
}));

export default function InternationalInsights({ role }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('全部');
  const [notice, setNotice] = useState('');
  const isAdmin = role === 'admin' || role === 'super_admin';

  const loadCache = async () => {
    try {
      const mod = await import('../services/firestore.js');
      const cached = await mod.getCachedInsights?.();
      if (cached?.articles?.length) {
        setItems(normalize(cached.articles));
        const d = cached.refreshedAt || cached.updatedAt;
        setNotice(d?.toDate ? `國際觀點快取更新：${d.toDate().toLocaleString('zh-TW')}` : '已載入國際觀點快取');
        return true;
      }
    } catch (e) { console.warn('[InternationalInsights] cache skipped:', e.message); }
    return false;
  };

  const adminRefresh = async () => {
    setRefreshing(true);
    try {
      const r = await fetch('/api/cron/refresh-insights', { method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-trigger':'1' } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.success === false) throw new Error(d.error || `HTTP ${r.status}`);
      setNotice(`國際觀點快取已更新，共 ${d.total || 0} 則`);
      await loadCache();
    } catch (e) {
      setNotice('更新國際觀點失敗：' + e.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { (async () => { setLoading(true); const ok = await loadCache(); if (!ok) { setItems(normalize(FALLBACK)); setNotice('國際觀點快取尚未建立，先顯示備援摘要；請由管理後台更新快取。'); } setLoading(false); })(); }, []);

  const sports = useMemo(() => {
    const all = Array.from(new Set(items.map(n => n.sport).filter(Boolean)));
    const priority = ['世界杯', '足球', 'MLB', 'NBA', '電競', 'UFC'];
    return ['全部', ...priority.filter(s => all.includes(s)), ...all.filter(s => !priority.includes(s))];
  }, [items]);

  const filtered = useMemo(() => items.filter(n => filter === '全部' || n.sport === filter), [items, filter]);
  const bySport = useMemo(() => filtered.reduce((acc, a) => { acc[a.sport] = (acc[a.sport] || 0) + 1; return acc; }, {}), [filtered]);

  return <div style={{ background:C.bg, minHeight:'100vh' }}><div style={{ maxWidth:1060, margin:'0 auto', padding:'28px 20px' }}>
    <div style={{ background:'linear-gradient(135deg,#0F3460,#1B5E20)', borderRadius:16, padding:'22px 24px', color:C.white, marginBottom:18 }}>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:'#FBBF24', marginBottom:8, textTransform:'uppercase' }}>International Insights</div>
      <div style={{ display:'flex', justifyContent:'space-between', gap:16, alignItems:'flex-end', flexWrap:'wrap' }}>
        <div>
          <h2 style={{ fontSize:28, fontWeight:950, margin:'0 0 8px' }}>國際觀點雷達</h2>
          <p style={{ margin:0, color:'rgba(255,255,255,.78)', fontSize:13, lineHeight:1.7 }}>整理 FIFA、BBC、ESPN、Dot Esports 等國際來源；generate-analysis 只會把命中的標題摘要放入 DATA_BLOCK，AI 不可自行創造新聞。</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={loadCache} disabled={refreshing} style={{ padding:'9px 13px', border:'1px solid rgba(255,255,255,.35)', borderRadius:8, background:'rgba(255,255,255,.12)', color:C.white, cursor:'pointer', fontWeight:800, fontSize:12 }}>重新載入</button>
          {isAdmin && <button onClick={adminRefresh} disabled={refreshing} style={{ padding:'9px 13px', border:'none', borderRadius:8, background:'#E9B44C', color:C.navy, cursor:'pointer', fontWeight:900, fontSize:12 }}>{refreshing ? '更新中...' : '更新快取'}</button>}
        </div>
      </div>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10, marginBottom:14 }}>
      {Object.entries(bySport).slice(0, 6).map(([sport, count]) => <div key={sport} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px' }}>
        <div style={{ fontSize:11, color:C.muted, fontWeight:800 }}>{sport}</div>
        <div style={{ fontSize:22, color:SC[sport] || C.navy, fontWeight:950 }}>{count}</div>
      </div>)}
    </div>

    {sports.length > 1 && <div style={{ overflowX:'auto', marginBottom:14 }}><div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, width:'max-content' }}>{sports.map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding:'8px 16px', border:'none', cursor:'pointer', background:filter === s ? C.navy : 'transparent', color:filter === s ? C.white : C.muted, fontSize:12, fontWeight:800, borderRight:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{s}</button>)}</div></div>}
    {notice && <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 12px', color:C.navy, fontSize:12, marginBottom:14 }}>{notice}</div>}
    {loading && <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:28, textAlign:'center', color:C.muted }}>載入國際觀點快取...</div>}

    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:12 }}>
      {!loading && filtered.map(a => {
        const sc = SC[a.sport] || C.navy;
        return <a key={a.id} href={a.url || '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', color:'inherit', display:'block', background:C.white, border:`1px solid ${C.border}`, borderTop:`4px solid ${sc}`, borderRadius:12, padding:'15px 16px', minHeight:145 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10, flexWrap:'wrap' }}>
            <span style={{ background:sc + '18', color:sc, fontSize:10, fontWeight:900, padding:'3px 8px', borderRadius:4 }}>{a.sport}</span>
            <span style={{ fontSize:10, color:C.muted, fontWeight:800, background:C.panel, padding:'3px 8px', borderRadius:4 }}>{a.sourceLabel}</span>
            {a.publishedAt && <span style={{ fontSize:10, color:C.muted }}>{timeAgo(a.publishedAt)}</span>}
          </div>
          <div style={{ fontSize:15, fontWeight:950, color:C.dark, lineHeight:1.45, marginBottom:8 }}>{a.titleDisplay}</div>
          {a.title && a.title !== a.titleDisplay && <div style={{ fontSize:11, color:C.muted, lineHeight:1.4, marginBottom:8 }}>{a.title}</div>}
          {a.summaryDisplay && <div style={{ fontSize:12, color:C.muted, lineHeight:1.65 }}>{a.summaryDisplay}</div>}
          <div style={{ marginTop:12, fontSize:11, color:C.navy, fontWeight:900 }}>閱讀原文 →</div>
        </a>;
      })}
    </div>

    {!loading && filtered.length === 0 && <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:34, textAlign:'center', color:C.muted }}>目前沒有符合篩選的國際觀點。</div>}
    <div style={{ marginTop:14, padding:'10px', background:'#F6F7FA', border:`1px solid ${C.border}`, borderRadius:8, fontSize:11, color:C.muted, textAlign:'center' }}>國際觀點僅作資訊整理；分析卡片只能引用快取進 DATA_BLOCK 的內容。</div>
  </div></div>;
}
