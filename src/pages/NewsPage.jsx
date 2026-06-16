import { useEffect, useMemo, useState } from 'react';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',borderLight:'#E9EBF0',bg:'#ECEEF2',amber:'#D97706',panelAlt:'#F6F7FA'};
const SC={足球:'#1B5E20',世界杯:'#006400',NBA:'#C9082A',MLB:'#002D72',電競:'#7C3AED',UFC:'#D20A0A',綜合:'#0F3460'};
const SOURCE_LABELS={espn:'ESPN',bbc_sport:'BBC Sport',sky_sports:'Sky Sports',goal:'Goal.com',yahoo_sports:'Yahoo Sports',yahoo_soccer:'Yahoo Soccer',dot_esports:'Dot Esports',hltv:'HLTV',fifa_news:'FIFA',goal_wc:'Goal WC',udn_sports:'聯合新聞網',ctv_sports:'CTV Sports',newsapi:'NewsAPI',fallback:'SignalEdge'};
const detectSport=(title='',source='')=>/league of legends|\blol\b|msi|worlds|lck|lpl|lec|lcs|valorant|cs2|counter-strike|dota/i.test(title)?'電競':(['fifa_news','goal_wc'].includes(source)||/world cup 2026|fifa world cup|2026 世界杯/i.test(title))?'世界杯':/world cup|fifa|premier league|champions league|soccer|football|transfer/i.test(title)?'足球':/nba|basketball|wnba/i.test(title)?'NBA':/mlb|baseball|yankees|dodgers|mets|phillies/i.test(title)?'MLB':/ufc|mma/i.test(title)?'UFC':'綜合';
const timeAgo=(date)=>{try{const d=new Date(date),s=(Date.now()-d.getTime())/1000;if(s<3600)return`${Math.max(1,Math.floor(s/60))} 分鐘前`;if(s<86400)return`${Math.floor(s/3600)} 小時前`;return d.toLocaleDateString('zh-TW');}catch{return'';}};
const localZhTitle=(title='')=>{
  let t=String(title||'').trim();
  const pairs=[
    [/World Cup/ig,'世界盃'],[/FIFA/ig,'FIFA'],[/NBA/ig,'NBA'],[/MLB/ig,'MLB'],[/League of Legends/ig,'英雄聯盟'],[/LoL/ig,'英雄聯盟'],[/MSI/ig,'MSI'],[/Champions League/ig,'歐冠'],[/Premier League/ig,'英超'],[/transfer/ig,'轉會'],[/injury/ig,'傷病'],[/final/ig,'決賽'],[/semi-final/ig,'準決賽'],[/preview/ig,'賽前分析'],[/odds/ig,'賠率'],[/prediction/ig,'預測'],[/wins/ig,'擊敗'],[/signs/ig,'簽下'],[/coach/ig,'教練'],[/roster/ig,'名單']
  ];
  pairs.forEach(([re,zh])=>{t=t.replace(re,zh);});
  return t;
};
const timeout=(promise,ms,fallback)=>new Promise(resolve=>{const t=setTimeout(()=>resolve(fallback),ms);promise.then(v=>{clearTimeout(t);resolve(v);}).catch(()=>{clearTimeout(t);resolve(fallback);});});

const FALLBACK_NEWS=[
  {id:'fallback-1',title:'World Cup model updates continue after opening matches',titleZh:'世界盃開賽後，模型預測持續依賽果動態更新',source:'fallback',sourceLabel:'SignalEdge',sport:'足球',url:'https://www.fifa.com/',publishedAt:new Date().toISOString()},
  {id:'fallback-2',title:'International League of Legends teams prepare for MSI',titleZh:'MSI 國際賽隊伍備戰，版本理解與賽區強度成焦點',source:'fallback',sourceLabel:'SignalEdge',sport:'電競',url:'https://lolesports.com/',publishedAt:new Date().toISOString()},
];

const normalize=(items=[])=>items.filter(a=>a?.title&&a?.url).map((a,i)=>({
  ...a,
  id:a.id||`news-${i}`,
  titleDisplay:a.titleZh||a.titleDisplay||localZhTitle(a.title),
  sport:a.sport||detectSport(a.title,a.source),
  sourceLabel:a.sourceLabel||SOURCE_LABELS[a.source]||a.source||'外媒',
}));

export default function NewsPage({ role }){
  const [news,setNews]=useState([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [filter,setFilter]=useState('全部');
  const [notice,setNotice]=useState('');
  const isAdmin=role==='admin'||role==='super_admin';

  const loadCache=async()=>{
    try{
      const mod=await import('../services/firestore.js');
      const cached=await timeout(mod.getCachedNews?.(),1500,null);
      if(cached?.articles?.length){
        setNews(normalize(cached.articles));
        setNotice(cached.refreshedAt?.toDate ? `新聞快取更新：${cached.refreshedAt.toDate().toLocaleString('zh-TW')}` : '已載入最新新聞快取');
        return true;
      }
    }catch(e){console.warn('[NewsPage] cache skipped:',e.message);}
    return false;
  };

  const refreshLive=async({silent=false}={})=>{
    if(!silent)setRefreshing(true);
    try{
      const r=await timeout(fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'news',action:'getLatest',params:{limit:30,translate:'safe'}})}),9000,null);
      if(!r) throw new Error('新聞來源回應逾時');
      const d=await r.json().catch(()=>({}));
      if(!r.ok||d.success===false) throw new Error(d.error||`HTTP ${r.status}`);
      const articles=normalize(d.result?.articles||[]);
      if(articles.length){
        setNews(articles);
        setNotice('已更新即時新聞');
        try{const mod=await import('../services/firestore.js');await mod.setCachedNews?.({articles,refreshedAt:new Date()});}catch{}
      }
    }catch(e){
      if(!silent)setNotice(`新聞暫時無法即時更新，已顯示快取或備援內容。`);
      console.warn('[NewsPage] live refresh skipped:',e.message);
    }finally{if(!silent)setRefreshing(false);}
  };

  const adminRefreshCache=async()=>{
    setRefreshing(true);
    try{
      const r=await fetch('/api/cron/refresh-news',{method:'POST',headers:{'Content-Type':'application/json','x-admin-trigger':'1'}});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||d.success===false) throw new Error(d.error||`HTTP ${r.status}`);
      setNotice(`新聞快取已更新，共 ${d.total||0} 則`);
      await loadCache();
    }catch(e){setNotice('更新新聞快取失敗：'+e.message);}finally{setRefreshing(false);}
  };

  useEffect(()=>{(async()=>{setLoading(true);const ok=await loadCache();if(!ok){setNews(FALLBACK_NEWS);setNotice('新聞快取尚未建立，先顯示重點摘要；請由管理後台更新新聞快取。');}setLoading(false);})();},[]);

  const sports=useMemo(()=>{
    const all=Array.from(new Set(news.map(n=>n.sport).filter(Boolean)));
    // 世界杯永遠排第一（如果有的話）
    const priority=['世界杯','足球','MLB','NBA','電競','UFC'];
    const sorted=[...priority.filter(s=>all.includes(s)),...all.filter(s=>!priority.includes(s))];
    return['全部',...sorted];
  },[news]);
  const filtered=news.filter(n=>filter==='全部'||n.sport===filter);

  return <div style={{background:C.bg,minHeight:'100vh'}}><div style={{maxWidth:1000,margin:'0 auto',padding:'28px 20px'}}>
    
        {/* 世界杯專區橫幅 */}
        {(filter==='全部'||filter==='世界杯')&&news.some(n=>n.sport==='世界杯')&&(
          <div style={{background:'linear-gradient(135deg,#006400,#1B5E20)',borderRadius:14,padding:'16px 20px',marginBottom:16,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
            <div style={{fontSize:28}}>🏆</div>
            <div>
              <div style={{fontSize:15,fontWeight:950,color:'#fff',marginBottom:2}}>2026 FIFA 世界杯專區</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.75)'}}>最新世界杯賽事報導、戰術分析與賽程資訊</div>
            </div>
            <button onClick={()=>setFilter('世界杯')} style={{marginLeft:'auto',background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.4)',color:'#fff',padding:'7px 16px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700}}>只看世界杯 →</button>
          </div>
        )}
        <div style={{marginBottom:22,display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:12,flexWrap:'wrap'}}>
      <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:C.amber,marginBottom:6,textTransform:'uppercase'}}>即時新聞</div><h2 style={{fontSize:26,fontWeight:900,color:C.dark,margin:'0 0 4px'}}>國際媒體速報</h2><p style={{color:C.muted,fontSize:13,margin:0}}>每日整理主要體育媒體重點新聞，點擊可開啟原文。</p></div>
      <div style={{display:'flex',gap:8}}><button onClick={loadCache} disabled={refreshing} style={{padding:'8px 12px',border:`1px solid ${C.border}`,borderRadius:7,background:C.white,cursor:'pointer',fontWeight:700,color:C.navy,fontSize:12}}>重新整理</button>{isAdmin&&<button onClick={adminRefreshCache} disabled={refreshing} style={{padding:'8px 12px',border:'none',borderRadius:7,background:C.navy,color:C.white,cursor:'pointer',fontWeight:700,fontSize:12}}>更新快取</button>}</div>
    </div>
    {sports.length>1&&<div style={{overflowX:'auto',marginBottom:16}}><div style={{display:'flex',border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',background:C.white,width:'max-content'}}>{sports.map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:'7px 16px',border:'none',cursor:'pointer',background:filter===s?C.navy:'transparent',color:filter===s?C.white:C.muted,fontSize:12,fontWeight:700,borderRight:`1px solid ${C.borderLight}`,whiteSpace:'nowrap'}}>{s}</button>)}</div></div>}
    {notice&&<div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:8,padding:'10px 12px',color:C.navy,fontSize:12,marginBottom:14}}>{notice}</div>}
    {loading&&<div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:26,textAlign:'center',color:C.muted}}>載入新聞快取...</div>}
    <div style={{display:'grid',gap:8}}>{!loading&&filtered.map(a=>{const sc=SC[a.sport]||C.navy;return <a key={a.id} href={a.url||'#'} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none',display:'block',background:C.white,border:`1px solid ${C.border}`,borderLeft:`4px solid ${sc}`,borderRadius:'0 9px 9px 0',padding:'12px 16px',transition:'box-shadow 0.15s'}} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(15,52,96,0.08)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:7,flexWrap:'wrap'}}><span style={{background:sc+'18',color:sc,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:3}}>{a.sport}</span><span style={{fontSize:10,color:C.muted,fontWeight:600,background:C.panelAlt,padding:'2px 7px',borderRadius:3}}>{a.sourceLabel}</span>{a.publishedAt&&<span style={{fontSize:10,color:C.muted}}>{timeAgo(a.publishedAt)}</span>}<span style={{marginLeft:'auto',fontSize:10,color:C.navy,fontWeight:600}}>原文 →</span></div>
      <div style={{fontSize:14,fontWeight:800,color:C.dark,marginBottom:a.titleZh?3:0,lineHeight:1.45}}>{a.titleDisplay}</div>{a.titleZh&&a.titleZh!==a.title&&<div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{a.title}</div>}
    </a>})}</div>
    {!loading&&filtered.length===0&&<div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:9,padding:'32px',textAlign:'center',color:C.muted}}><div style={{fontSize:32,marginBottom:12}}>📰</div><div style={{fontSize:14,fontWeight:700,color:C.dark,marginBottom:6}}>暫無新聞</div></div>}
    <div style={{marginTop:14,padding:'10px',background:'#F6F7FA',border:`1px solid ${C.border}`,borderRadius:8,fontSize:11,color:C.muted,textAlign:'center'}}>新聞內容與版權屬原始媒體所有，SignalEdge 提供標題整理與原文導覽。</div>
  </div></div>;
}

