import { useState, useEffect } from 'react';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };

const SPORT_C = { NBA:'#C9082A', 世界杯:'#1B5E20', LOL:'#C89B3C', MLB:'#002D72', UFC:'#D20A0A', 電競:'#C89B3C', 足球:'#1B5E20' };
const SOURCE_LABELS = { espn:'ESPN', bbc_sport:'BBC Sport', dot_esports:'Dot Esports', goal:'Goal.com', hltv:'HLTV', sky_sports:'Sky Sports', odds_action:'OddsShark' };

const detectSport = (title) => {
  if (!title) return '體育';
  const t = title.toLowerCase();
  if (t.includes('world cup')||t.includes('fifa')||t.includes('soccer')) return '世界杯';
  if (t.includes('nba')||t.includes('basketball')||t.includes('lakers')||t.includes('celtics')||t.includes('curry')||t.includes('lebron')) return 'NBA';
  if (t.includes('mlb')||t.includes('baseball')||t.includes('dodgers')||t.includes('yankees')) return 'MLB';
  if (t.includes('ufc')||t.includes('mma')||t.includes('fight')) return 'UFC';
  if (t.includes('lol')||t.includes('league of legends')||t.includes('t1')||t.includes('faker')||t.includes('esport')) return 'LOL';
  if (t.includes('valorant')||t.includes('cs2')||t.includes('dota')) return '電競';
  if (t.includes('football')||t.includes('premier league')||t.includes('champions league')) return '足球';
  return '體育';
};

const timeAgo = (s) => {
  if (!s) return '';
  try {
    const d = Math.floor((Date.now()-new Date(s).getTime())/1000);
    if (d<3600) return `${Math.floor(d/60)}分鐘前`;
    if (d<86400) return `${Math.floor(d/3600)}小時前`;
    return `${Math.floor(d/86400)}天前`;
  } catch { return ''; }
};

const Spinner = ({ size=28 }) => (
  <div style={{ width:size,height:size,border:`2px solid ${C.border}`,borderTopColor:C.navy,borderRadius:'50%',animation:'spin 0.8s linear infinite',display:'inline-block' }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function NewsPage() {
  const [news, setNews]           = useState([]);
  const [translated, setTranslated] = useState({});
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('全部');
  const [error, setError]         = useState('');

  useEffect(()=>{
    const loadNews = async () => {
      setLoading(true); setError('');
      try {
        // 嘗試 RSS feeds
        const r = await fetch('/api/gateway', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ source:'news', action:'getLatest', params:{ limit:30, sources:['espn','bbc_sport','dot_esports','goal','hltv'] } }),
        });
        const data = await r.json();
        if (data.success && data.result?.articles?.length > 0) {
          const articles = data.result.articles.map((a,i) => ({ ...a, id:i, sport:detectSport(a.title) }));
          setNews(articles);
          translateBatch(articles); // 背景翻譯
        } else {
          // RSS 失敗，試 News API
          const r2 = await fetch('/api/gateway', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ source:'news', action:'getNewsAPI', params:{ query:'sports', limit:20 } }),
          });
          const d2 = await r2.json();
          if (d2.success && d2.result?.articles?.length > 0) {
            const articles = d2.result.articles.map((a,i) => ({ ...a, id:i, sport:detectSport(a.title) }));
            setNews(articles);
            translateBatch(articles);
          } else {
            setError('新聞暫時無法載入，請稍後重試');
          }
        }
      } catch(e) {
        setError('連線失敗：' + e.message);
      }
      setLoading(false);
    };
    loadNews();
  }, []);

  const translateBatch = async (articles) => {
    // 每次翻譯 5 個，避免 rate limit
    const chunks = [];
    for (let i=0;i<articles.length;i+=5) chunks.push(articles.slice(i,i+5));
    for (const chunk of chunks) {
      try {
        const titles = chunk.filter(a=>a.title&&!translated[a.id]).map(a=>({ id:a.id, en:a.title }));
        if (!titles.length) continue;
        const r = await fetch('/api/gateway', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ source:'gemini', action:'translateTitles', params:{ titles } }),
        });
        const d = await r.json();
        if (d.success && d.result?.results) {
          setTranslated(p => {
            const next = {...p};
            d.result.results.forEach(r => { if(r.zh&&r.zh!==r.en) next[r.id]=r.zh; });
            return next;
          });
        }
      } catch {}
      await new Promise(r=>setTimeout(r,800));
    }
  };

  const sports = ['全部', ...new Set(news.map(n=>n.sport))];
  const filtered = news.filter(n=>filter==='全部'||n.sport===filter);

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>即時新聞</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 4px' }}>國際媒體速報</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>ESPN · BBC · Dot Esports · Goal.com · HLTV · 標題 AI 翻譯</p>
        </div>

        {/* 分類 */}
        {sports.length>1 && (
          <div style={{ overflowX:'auto', marginBottom:16 }}>
            <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, width:'max-content' }}>
              {sports.map(s=>(
                <button key={s} onClick={()=>setFilter(s)} style={{ padding:'7px 16px', border:'none', cursor:'pointer', background:filter===s?C.navy:'transparent', color:filter===s?C.white:C.muted, fontSize:12, fontWeight:700, borderRight:`1px solid ${C.borderLight}`, whiteSpace:'nowrap' }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:48, color:C.muted }}>
            <Spinner size={36}/><div style={{ fontSize:13 }}>載入新聞中...</div>
          </div>
        )}

        {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'14px', color:C.loss, fontSize:13, marginBottom:12 }}>⚠️ {error}</div>}

        <div style={{ display:'grid', gap:8 }}>
          {filtered.map(a=>{
            const sc = SPORT_C[a.sport]||C.navy;
            const zh = translated[a.id];
            return (
              <a key={a.id} href={a.url||'#'} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration:'none', display:'block', background:C.white, border:`1px solid ${C.border}`, borderLeft:`4px solid ${sc}`, borderRadius:'0 9px 9px 0', padding:'12px 16px' }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(15,52,96,0.08)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:7, flexWrap:'wrap' }}>
                  <span style={{ background:sc+'18', color:sc, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:3 }}>{a.sport}</span>
                  <span style={{ fontSize:10, color:C.muted, fontWeight:600, background:C.panelAlt, padding:'2px 7px', borderRadius:3 }}>{SOURCE_LABELS[a.source]||a.source||'外媒'}</span>
                  {a.publishedAt&&<span style={{ fontSize:10, color:C.muted }}>{timeAgo(a.publishedAt)}</span>}
                  <span style={{ marginLeft:'auto', fontSize:10, color:C.navy, fontWeight:600 }}>原文 →</span>
                </div>
                {/* 中文標題 */}
                {zh ? (
                  <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:3, lineHeight:1.4 }}>{zh}</div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <Spinner size={12}/>
                    <span style={{ fontSize:12, color:C.muted }}>翻譯中...</span>
                  </div>
                )}
                {/* 英文原標題 */}
                <div style={{ fontSize:11, color:C.muted, lineHeight:1.4 }}>{a.title}</div>
              </a>
            );
          })}
        </div>

        {!loading&&filtered.length===0&&!error&&(
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:9, padding:'32px', textAlign:'center', color:C.muted }}>暫無新聞</div>
        )}

        <div style={{ marginTop:14, padding:'10px 14px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, fontSize:11, color:C.navy }}>
          📰 版權屬各原始媒體所有 · 點擊開啟原文 · AI 翻譯僅供參考
        </div>
      </div>
    </div>
  );
}
