import { useState, useEffect } from 'react';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',borderLight:'#E9EBF0',bg:'#ECEEF2',amber:'#D97706',loss:'#DC2626',panelAlt:'#F6F7FA'};
const SC={足球:'#1B5E20',世界杯:'#1B5E20',NBA:'#C9082A',MLB:'#002D72',電競:'#7C3AED',UFC:'#D20A0A',綜合:'#0F3460'};
const SOURCE_LABELS={espn:'ESPN',bbc_sport:'BBC Sport',sky_sports:'Sky Sports',goal:'Goal.com',dot_esports:'Dot Esports',hltv:'HLTV',newsapi:'NewsAPI'};
const detectSport=(title='')=>{/league of legends|\blol\b|msi|worlds|lck|lpl|lec|lcs|valorant|cs2|counter-strike|dota/i.test(title)?'電競':/world cup|fifa|premier league|champions league|soccer|football|transfer/i.test(title)?'足球':/nba|basketball|wnba/i.test(title)?'NBA':/mlb|baseball|yankees|dodgers|mets|phillies/i.test(title)?'MLB':/ufc|mma/i.test(title)?'UFC':'綜合'};
const timeAgo=(date)=>{try{const d=new Date(date),s=(Date.now()-d.getTime())/1000;if(s<3600)return`${Math.max(1,Math.floor(s/60))} 分鐘前`;if(s<86400)return`${Math.floor(s/3600)} 小時前`;return d.toLocaleDateString('zh-TW');}catch{return'';}};
const Spinner=()=> <div style={{textAlign:'center',padding:50,color:C.muted}}><div style={{width:36,height:36,border:`3px solid ${C.border}`,borderTopColor:C.navy,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/><div>載入新聞...</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

const FALLBACK_NEWS = [
  {id:'fallback-1',title:'FIFA World Cup model updates continue after opening matches',titleZh:'世界盃開賽後，模型預測持續依賽果動態更新',source:'fallback',sourceLabel:'SignalEdge',sport:'足球',url:'https://www.fifa.com/',publishedAt:new Date().toISOString()},
  {id:'fallback-2',title:'MSI teams prepare for international League of Legends competition',titleZh:'MSI 隊伍備戰國際賽，版本理解與賽區強度成焦點',source:'fallback',sourceLabel:'SignalEdge',sport:'電競',url:'https://lolesports.com/',publishedAt:new Date().toISOString()},
];

export default function NewsPage(){
  const [news,setNews]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('全部');
  const [error,setError]=useState('');

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);setError('');
      try{
        try{
          const mod=await import('../services/firestore.js');
          const cached=await mod.getCachedNews?.();
          if(cached?.articles?.length){
            setNews(cached.articles.map((a,i)=>({...a,id:a.id||`cached-${i}`,sport:a.sport||detectSport(a.title),sourceLabel:a.sourceLabel||SOURCE_LABELS[a.source]||a.source||'外媒'})));
            setLoading(false);return;
          }
        }catch(e){ console.warn('[NewsPage] cache skipped:', e.message); }

        const ac=new AbortController();
        const t=setTimeout(()=>ac.abort(),12000);
        const r=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},signal:ac.signal,body:JSON.stringify({source:'news',action:'getLatest',params:{limit:30,translate:true}})});
        clearTimeout(t);
        const d=await r.json().catch(()=>({}));
        if(!r.ok||d.success===false) throw new Error(d.error||`HTTP ${r.status}`);
        const articles=(d.result?.articles||[]).filter(a=>a.title&&a.url).map((a,i)=>({
          ...a,id:a.id||`api-${i}`,sport:a.sport||detectSport(a.title),sourceLabel:a.sourceLabel||SOURCE_LABELS[a.source]||a.source||'外媒',
        }));
        if(articles.length) setNews(articles); else { setNews(FALLBACK_NEWS); setError('目前 RSS 沒有回傳可用新聞，先顯示備援新聞。'); }
      }catch(e){
        console.warn('[NewsPage] load failed:',e.message);
        setNews(FALLBACK_NEWS);
        setError(`新聞來源暫時無法連線：${e.name==='AbortError'?'請求逾時':e.message}`);
      }finally{setLoading(false);}
    };
    load();
  },[]);

  const sports=['全部',...Array.from(new Set(news.map(n=>n.sport).filter(Boolean)))];
  const filtered=news.filter(n=>filter==='全部'||n.sport===filter);

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'28px 20px'}}>
        <div style={{marginBottom:22}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:C.amber,marginBottom:6,textTransform:'uppercase'}}>即時新聞</div>
          <h2 style={{fontSize:26,fontWeight:900,color:C.dark,margin:'0 0 4px'}}>國際媒體速報</h2>
          <p style={{color:C.muted,fontSize:13,margin:0}}>ESPN · BBC · Dot Esports · Goal.com · HLTV · 點擊開啟原文 · AI 可用時自動翻譯標題</p>
        </div>

        {sports.length>1&&(
          <div style={{overflowX:'auto',marginBottom:16}}>
            <div style={{display:'flex',border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',background:C.white,width:'max-content'}}>
              {sports.map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:'7px 16px',border:'none',cursor:'pointer',background:filter===s?C.navy:'transparent',color:filter===s?C.white:C.muted,fontSize:12,fontWeight:700,borderRight:`1px solid ${C.borderLight}`,whiteSpace:'nowrap'}}>{s}</button>)}
            </div>
          </div>
        )}

        {loading&&<Spinner/>}
        {error&&<div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:8,padding:'12px 14px',color:'#92400E',fontSize:12,marginBottom:14}}>⚠️ {error}</div>}

        <div style={{display:'grid',gap:8}}>
          {!loading&&filtered.map(a=>{
            const sc=SC[a.sport]||C.navy;
            return(
              <a key={a.id} href={a.url||'#'} target="_blank" rel="noopener noreferrer"
                style={{textDecoration:'none',display:'block',background:C.white,border:`1px solid ${C.border}`,borderLeft:`4px solid ${sc}`,borderRadius:'0 9px 9px 0',padding:'12px 16px',transition:'box-shadow 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(15,52,96,0.08)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:7,flexWrap:'wrap'}}>
                  <span style={{background:sc+'18',color:sc,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:3}}>{a.sport}</span>
                  <span style={{fontSize:10,color:C.muted,fontWeight:600,background:C.panelAlt,padding:'2px 7px',borderRadius:3}}>{a.sourceLabel||SOURCE_LABELS[a.source]||a.source||'外媒'}</span>
                  {a.publishedAt&&<span style={{fontSize:10,color:C.muted}}>{timeAgo(a.publishedAt)}</span>}
                  <span style={{marginLeft:'auto',fontSize:10,color:C.navy,fontWeight:600}}>原文 →</span>
                </div>
                {a.titleZh ? <><div style={{fontSize:14,fontWeight:800,color:C.dark,marginBottom:3,lineHeight:1.45}}>{a.titleZh}</div><div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{a.title}</div></> : <div style={{fontSize:14,fontWeight:700,color:C.dark,lineHeight:1.45}}>{a.title}</div>}
              </a>
            );
          })}
        </div>

        {!loading&&filtered.length===0&&(
          <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:9,padding:'32px',textAlign:'center',color:C.muted}}><div style={{fontSize:32,marginBottom:12}}>📰</div><div style={{fontSize:14,fontWeight:700,color:C.dark,marginBottom:6}}>暫無新聞</div></div>
        )}

        <div style={{marginTop:14,padding:'10px',background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:8,fontSize:11,color:C.navy,textAlign:'center'}}>📰 版權屬各原始媒體所有 · 點擊開啟原文 · 標題翻譯由 AI / 快取資料提供</div>
      </div>
    </div>
  );
}
