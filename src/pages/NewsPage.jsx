import { useState, useEffect } from 'react';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',borderLight:'#E9EBF0',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626',panelAlt:'#F6F7FA'};
const SOURCE_LABELS={espn:'ESPN',bbc_sport:'BBC Sport',dot_esports:'Dot Esports',goal:'Goal.com',hltv:'HLTV',sky_sports:'Sky Sports','rss-espn':'ESPN','rss-bbc':'BBC Sport','rss-dotesports':'Dot Esports','rss-goal':'Goal.com'};
const SPORT_TAGS={nba:'NBA',nfl:'NFL',mlb:'MLB',soccer:'足球',football:'足球','world cup':'世界杯','lol':'LOL','league of legends':'LOL',valorant:'Valorant',ufc:'UFC','cs2':'CS2',dota:'Dota2'};
const detectSport=(t='')=>{const tl=t.toLowerCase();for(const[k,v]of Object.entries(SPORT_TAGS)){if(tl.includes(k))return v;}return'體育';};
const timeAgo=s=>{if(!s)return'';try{const d=Math.floor((Date.now()-new Date(s).getTime())/1000);if(d<3600)return`${Math.floor(d/60)}分鐘前`;if(d<86400)return`${Math.floor(d/3600)}小時前`;return`${Math.floor(d/86400)}天前`;}catch{return'';}};
const SC={NBA:'#C9082A',MLB:'#002D72',足球:'#1B5E20',世界杯:'#1B5E20',LOL:'#C89B3C',Valorant:'#FF4655',UFC:'#D20A0A',CS2:'#333',Dota2:'#B23020',體育:C.navy};

const Spinner=()=><div style={{textAlign:'center',padding:48,color:C.muted}}><div style={{width:32,height:32,border:`3px solid ${C.border}`,borderTopColor:C.navy,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/><div>載入新聞...</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

export default function NewsPage(){
  const [news,setNews]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('全部');
  const [error,setError]=useState('');

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);setError('');
      try{
        // 1. 優先讀 Firestore 快取（Admin/Cron 已預翻譯）
        try{
          const mod=await import('../services/firestore.js');
          const cached=await mod.getCachedNews?.();
          if(cached?.articles?.length){
            setNews(cached.articles);setLoading(false);return;
          }
        }catch{}

        // 2. Firestore 無快取 → 從 API 拿原始新聞（只顯示英文標題，不在用戶端翻譯）
        const r=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'news',action:'getLatest',params:{limit:30}})});
        const d=await r.json();
        if(d.success&&d.result?.articles?.length){
          const articles=d.result.articles.map((a,i)=>({
            ...a, id:i,
            sport:detectSport(a.title),
            // 沒有預翻譯時顯示英文原標題，不在用戶端叫 Gemini
            titleZh: a.titleZh || null,
          }));
          setNews(articles);
        }else{setError('暫時無法載入新聞');}
      }catch(e){setError('載入失敗：'+e.message);}
      setLoading(false);
    };
    load();
  },[]);

  const sports=['全部',...new Set(news.map(n=>n.sport))];
  const filtered=news.filter(n=>filter==='全部'||n.sport===filter);

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'28px 20px'}}>
        <div style={{marginBottom:22}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:C.amber,marginBottom:6,textTransform:'uppercase'}}>即時新聞</div>
          <h2 style={{fontSize:26,fontWeight:900,color:C.dark,margin:'0 0 4px'}}>國際媒體速報</h2>
          <p style={{color:C.muted,fontSize:13,margin:0}}>ESPN · BBC · Dot Esports · Goal.com · HLTV · 標題每日定時翻譯更新</p>
        </div>

        {/* 分類 */}
        {sports.length>1&&(
          <div style={{overflowX:'auto',marginBottom:16}}>
            <div style={{display:'flex',border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',background:C.white,width:'max-content'}}>
              {sports.map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:'7px 16px',border:'none',cursor:'pointer',background:filter===s?C.navy:'transparent',color:filter===s?C.white:C.muted,fontSize:12,fontWeight:700,borderRight:`1px solid ${C.borderLight}`,whiteSpace:'nowrap'}}>{s}</button>)}
            </div>
          </div>
        )}

        {loading&&<Spinner/>}
        {error&&<div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'14px',color:C.loss,fontSize:13,marginBottom:12}}>⚠️ {error}</div>}

        <div style={{display:'grid',gap:8}}>
          {filtered.map(a=>{
            const sc=SC[a.sport]||C.navy;
            return(
              <a key={a.id} href={a.url||'#'} target="_blank" rel="noopener noreferrer"
                style={{textDecoration:'none',display:'block',background:C.white,border:`1px solid ${C.border}`,borderLeft:`4px solid ${sc}`,borderRadius:'0 9px 9px 0',padding:'12px 16px',transition:'box-shadow 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(15,52,96,0.08)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:7,flexWrap:'wrap'}}>
                  <span style={{background:sc+'18',color:sc,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:3}}>{a.sport}</span>
                  <span style={{fontSize:10,color:C.muted,fontWeight:600,background:C.panelAlt,padding:'2px 7px',borderRadius:3}}>{SOURCE_LABELS[a.source]||a.source||'外媒'}</span>
                  {a.publishedAt&&<span style={{fontSize:10,color:C.muted}}>{timeAgo(a.publishedAt)}</span>}
                  <span style={{marginLeft:'auto',fontSize:10,color:C.navy,fontWeight:600}}>原文 →</span>
                </div>
                {/* 中文標題（預翻譯）或英文標題 */}
                {a.titleZh ? (
                  <>
                    <div style={{fontSize:14,fontWeight:700,color:C.dark,marginBottom:3,lineHeight:1.4}}>{a.titleZh}</div>
                    <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{a.title}</div>
                  </>
                ) : (
                  <div style={{fontSize:14,fontWeight:600,color:C.dark,lineHeight:1.4}}>{a.title}</div>
                )}
              </a>
            );
          })}
        </div>

        {!loading&&filtered.length===0&&!error&&(
          <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:9,padding:'32px',textAlign:'center',color:C.muted}}>
            <div style={{fontSize:32,marginBottom:12}}>📰</div>
            <div style={{fontSize:14,fontWeight:700,color:C.dark,marginBottom:6}}>暫無新聞</div>
          </div>
        )}

        <div style={{marginTop:14,padding:'10px',background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:8,fontSize:11,color:C.navy,textAlign:'center'}}>
          📰 版權屬各原始媒體所有 · 點擊開啟原文 · 標題翻譯由 AI 每日定時更新
        </div>
      </div>
    </div>
  );
}
