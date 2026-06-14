import { useState, useEffect } from 'react';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', panelAlt:'#F6F7FA' };
const SPORT_C = { NBA:'#C9082A', 世界杯:'#1B5E20', LOL:'#C89B3C', MLB:'#002D72', Valorant:'#FF4655' };

const SOURCE_LABELS = { espn:'ESPN', bbc_sport:'BBC Sport', dot_esports:'Dot Esports', goal:'Goal.com', hltv:'HLTV', odds_action:'OddsShark', sky_sports:'Sky Sports' };

const detectSport = (title) => {
  const t = title.toLowerCase();
  if (t.includes('world cup') || t.includes('fifa') || t.includes('soccer') || t.includes('football') || t.includes('premier league')) return '足球';
  if (t.includes('nba') || t.includes('basketball') || t.includes('lakers') || t.includes('celtics')) return 'NBA';
  if (t.includes('mlb') || t.includes('baseball') || t.includes('dodgers') || t.includes('yankees')) return 'MLB';
  if (t.includes('lol') || t.includes('league of legends') || t.includes('t1') || t.includes('faker')) return 'LOL';
  if (t.includes('valorant')) return 'Valorant';
  if (t.includes('esport') || t.includes('cs2') || t.includes('dota')) return '電競';
  return '體育';
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return `${Math.floor(diff/60000)} 分鐘前`;
    if (h < 24) return `${h} 小時前`;
    return `${Math.floor(h/24)} 天前`;
  } catch { return ''; }
};

const Spinner = ({ size = 28 }) => (
  <div style={{ width:size, height:size, border:`2px solid #E9EBF0`, borderTopColor:C.navy, borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [translated, setTranslated] = useState({});
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState({});
  const [filter, setFilter] = useState('全部');
  const [error, setError] = useState('');

  const callGateway = async (source, action, params) => {
    const r = await fetch('/api/gateway', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ source, action, params }),
    });
    return r.json();
  };

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      try {
        const data = await callGateway('news', 'getLatest', { limit:24, sources:['espn','bbc_sport','dot_esports','goal','hltv','odds_action'] });
        if (data.success && data.result.articles) {
          const articles = data.result.articles.map((a, i) => ({
            ...a, id: i, sport: detectSport(a.title || ''),
          }));
          setNews(articles);
          // 批量翻譯標題
          autoTranslate(articles);
        } else {
          setError('新聞載入失敗，請確認 RSS 服務正常');
        }
      } catch (e) {
        setError('連線失敗：' + e.message);
      }
      setLoading(false);
    };
    loadNews();
  }, []);

  const autoTranslate = async (articles) => {
    // 每次翻譯5個，避免 Gemini rate limit
    const chunks = [];
    for (let i = 0; i < articles.length; i += 5) chunks.push(articles.slice(i, i+5));
    for (const chunk of chunks) {
      try {
        const titles = chunk.filter(a => a.title && !translated[a.id]).map(a => ({ id: a.id, en: a.title }));
        if (titles.length === 0) continue;
        const data = await callGateway('gemini', 'translateTitles', { titles });
        if (data.success && data.result.results) {
          setTranslated(p => {
            const next = { ...p };
            data.result.results.forEach(r => { next[r.id] = r.zh; });
            return next;
          });
        }
      } catch {}
      await new Promise(r => setTimeout(r, 600));
    }
  };

  const sports = ['全部', ...new Set(news.map(n => n.sport))];
  const filtered = news.filter(n => filter === '全部' || n.sport === filter);

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>即時新聞</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 4px' }}>國際媒體速報</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>ESPN · BBC · Dot Esports · Goal.com · HLTV · OddsShark · 標題自動翻譯 · 點擊查看原文</p>
        </div>

        {sports.length > 1 && (
          <div style={{ overflowX:'auto', marginBottom:16 }}>
            <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, width:'max-content' }}>
              {sports.map(s => (
                <button key={s} onClick={()=>setFilter(s)} style={{ padding:'7px 16px', border:'none', cursor:'pointer', background:filter===s?C.navy:'transparent', color:filter===s?C.white:C.muted, fontSize:12, fontWeight:700, borderRight:`1px solid ${C.borderLight}`, whiteSpace:'nowrap' }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:48, color:C.muted }}>
            <Spinner size={36}/>
            <div style={{ fontSize:13 }}>載入新聞中...</div>
          </div>
        )}

        {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'14px 16px', color:'#DC2626', fontSize:13 }}>⚠️ {error}</div>}

        <div style={{ display:'grid', gap:8 }}>
          {filtered.map(article => {
            const sc = SPORT_C[article.sport] || C.navy;
            const zhTitle = translated[article.id];
            return (
              <a key={article.id} href={article.url || '#'} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration:'none', display:'block', background:C.white, border:`1px solid ${C.border}`, borderLeft:`4px solid ${sc}`, borderRadius:'0 9px 9px 0', padding:'12px 16px', transition:'box-shadow 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(15,52,96,0.08)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:7, flexWrap:'wrap' }}>
                  <span style={{ background:sc+'18', color:sc, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:3 }}>{article.sport}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:C.muted, background:C.panelAlt, padding:'2px 7px', borderRadius:3 }}>{SOURCE_LABELS[article.source]||article.source}</span>
                  {article.publishedAt && <span style={{ fontSize:10, color:C.muted }}>{timeAgo(article.publishedAt)}</span>}
                  <span style={{ marginLeft:'auto', fontSize:10, color:C.navy, fontWeight:600 }}>原文 →</span>
                </div>
                {/* 中文標題 */}
                {zhTitle ? (
                  <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:3, lineHeight:1.4 }}>{zhTitle}</div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <Spinner size={12}/>
                    <span style={{ fontSize:12, color:C.muted }}>翻譯中...</span>
                  </div>
                )}
                {/* 英文原標題 */}
                <div style={{ fontSize:11, color:C.muted, lineHeight:1.4 }}>{article.title}</div>
              </a>
            );
          })}
        </div>

        {!loading && filtered.length === 0 && !error && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:9, padding:'32px', textAlign:'center', color:C.muted }}>暫無新聞</div>
        )}

        <div style={{ marginTop:14, padding:'10px 14px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, fontSize:11, color:C.navy }}>
          📰 標題由 Gemini AI 自動翻譯 · 版權屬各原始媒體所有 · 點擊後在新頁面開啟原文
        </div>
      </div>
    </div>
  );
}
