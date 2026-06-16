import { useEffect, useMemo, useState } from 'react';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',borderLight:'#E9EBF0',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626',panelAlt:'#F6F7FA'};
const SC={世界杯:'#1B5E20',NBA:'#C9082A',MLB:'#002D72',NHL:'#002654',UFC:'#D20A0A',英超:'#3D195B',歐冠:'#003399',西甲:'#C60B1E','LOL 電競':'#7C3AED','MSI 2026':'#7C3AED'};
const DS={BET:{bg:'#ECFDF5',color:'#059669',label:'可關注'},LEAN:{bg:'#FFFBEB',color:'#D97706',label:'偏向觀察'},WAIT:{bg:'#F6F7FA',color:'#6B7280',label:'等待確認'},NO_BET:{bg:'#FEF2F2',color:'#DC2626',label:'不追價'}};
const SECTION_LABEL={today:'今日賽事',value:'模型有價值',watch:'觀察名單',future:'未來賽事'};

const Spin=({s=24})=><div style={{width:s,height:s,border:`2px solid ${C.border}`,borderTopColor:C.navy,borderRadius:'50%',animation:'spin 0.8s linear infinite',display:'inline-block'}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
const pct=(n)=>Number.isFinite(Number(n))?`${Number(n).toFixed(1)}%`:'—';
const fmt=(iso)=>{try{return new Date(iso).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' 台灣';}catch{return''}};
const normalize=(a)=>({
  ...a,
  id:a.id||a.eventId||`${a.home}-${a.away}-${a.commence_time||Date.now()}`,
  sport:a.sport||'綜合',
  home:a.home||a.homeTeam||a.homeEn||'主隊',
  away:a.away||a.awayTeam||a.awayEn||'客隊',
  timeStr:a.timeStr||fmt(a.commence_time),
  modelHome:Number(a.modelHome??a.dataBlock?.modelHome??0),
  modelDraw:Number(a.modelDraw??a.dataBlock?.modelDraw??0),
  modelAway:Number(a.modelAway??a.dataBlock?.modelAway??0),
  nvH:Number(a.nvH??a.marketHome??a.dataBlock?.marketHome??0),
  nvD:Number(a.nvD??a.marketDraw??a.dataBlock?.marketDraw??0),
  nvA:Number(a.nvA??a.marketAway??a.dataBlock?.marketAway??0),
  ev:Number(a.ev??a.dataBlock?.ev??0),
  edge:Number(a.edge??a.dataBlock?.edge??0),
  decision:a.decision||'WAIT',
  dataCompleteness:Number(a.dataCompleteness??a.dataBlock?.dataCompleteness??0),
  confidence:Number(a.confidence??a.dataBlock?.confidence??0),
  risk:Number(a.risk??a.dataBlock?.risk??0),
  topScores:a.topScores||a.dataBlock?.topScores||[],
  marketRows:a.marketRows||a.dataBlock?.marketRows||[],
  cancelConditions:a.cancelConditions||a.dataBlock?.cancelConditions||[],
  sourceCoverage:a.sourceCoverage||a.dataBlock?.sourceCoverage||{},
  modelVersion:a.modelVersion||'v6b',
});

function Metric({label,value,color=C.dark}){return <div><div style={{fontSize:10,color:C.muted,fontWeight:800,marginBottom:3}}>{label}</div><div style={{fontSize:18,fontWeight:950,color,fontFamily:'ui-monospace,monospace'}}>{value}</div></div>}

function AnalysisCard({item, isVIP, isAdmin, onOpen}){
  const a=normalize(item); const sc=SC[a.sport]||C.navy; const ds=DS[a.decision]||DS.WAIT;
  const best=a.marketRows?.find(r=>r.role===a.bestRole)||a.marketRows?.[0];
  const scoreText=a.topScores?.length?a.topScores.slice(0,3).map(s=>`${s.score} ${s.probPct}%`).join(' / '):'依盤口與賽前資料更新';
  return <div style={{background:C.white,border:`1.5px solid ${C.border}`,borderLeft:`5px solid ${sc}`,borderRadius:'0 12px 12px 0',marginBottom:14,overflow:'hidden'}}>
    <div style={{padding:'16px 20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',marginBottom:10}}>
        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{background:sc+'18',color:sc,fontSize:10,fontWeight:900,padding:'3px 8px',borderRadius:4}}>{a.sport}</span>
          <span style={{background:ds.bg,color:ds.color,fontSize:10,fontWeight:900,padding:'3px 9px',borderRadius:4}}>{ds.label}</span>
          <span style={{fontSize:10,color:C.win,fontWeight:800}}>● 模型版 {a.modelVersion}</span>
        </div>
        <span style={{fontSize:11,color:C.amber,fontWeight:900}}>{a.timeStr}</span>
      </div>
      <button onClick={onOpen} style={{background:'none',border:'none',padding:0,textAlign:'left',cursor:'pointer'}}>
        <div style={{fontSize:20,fontWeight:950,color:C.dark,marginBottom:2}}>{a.home} <span style={{color:C.muted,fontWeight:500,fontSize:14}}>vs</span> {a.away}</div>
        <div style={{fontSize:11,color:C.muted,fontFamily:'ui-monospace,monospace'}}>{a.homeEn||a.home} vs {a.awayEn||a.away}</div>
      </button>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginTop:14,marginBottom:12}}>
        <div style={{background:C.panelAlt,borderRadius:10,padding:12}}><Metric label="模型勝率" value={`${pct(a.modelHome)} / ${a.modelDraw?pct(a.modelDraw)+' / ':''}${pct(a.modelAway)}`} color={C.navy}/></div>
        <div style={{background:C.panelAlt,borderRadius:10,padding:12}}><Metric label="市場去水" value={`${pct(a.nvH)} / ${a.nvD?pct(a.nvD)+' / ':''}${pct(a.nvA)}`}/></div>
        <div style={{background:C.panelAlt,borderRadius:10,padding:12}}><Metric label="EV / Edge" value={`${a.ev>0?'+':''}${pct(a.ev).replace('%','')}% / ${a.edge>0?'+':''}${pct(a.edge).replace('%','')}%`} color={a.ev>0?C.win:C.loss}/></div>
        <div style={{background:C.panelAlt,borderRadius:10,padding:12}}><Metric label="資料/信心" value={`${Math.round(a.dataCompleteness)}/${Math.round(a.confidence||0)}`} color={sc}/></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={{background:'#F8FAFC',border:`1px solid ${C.borderLight}`,borderRadius:10,padding:12}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:900,marginBottom:6}}>🎯 比分 / 劇本</div>
          <div style={{fontSize:13,color:C.dark,fontWeight:800}}>{scoreText}</div>
          {a.over25!=null&&<div style={{fontSize:11,color:C.muted,marginTop:5}}>大小 2.5：Over {pct(a.over25)}</div>}
        </div>
        <div style={{background:'#F8FAFC',border:`1px solid ${C.borderLight}`,borderRadius:10,padding:12}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:900,marginBottom:6}}>💡 價格觀察</div>
          <div style={{fontSize:13,color:C.dark,lineHeight:1.6}}>觀察方向：<b>{a.pickName||best?.name||'—'}</b>；最低參考價 <b>{a.minOdds||best?.minOdds||'—'}</b></div>
        </div>
      </div>
      {a.analysis&&<div style={{fontSize:13,color:'#374151',lineHeight:1.8,whiteSpace:'pre-line',borderTop:`1px solid ${C.borderLight}`,paddingTop:12}}>{a.analysis}</div>}
      {isVIP?<div style={{marginTop:12,background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:10,padding:12}}>
        <div style={{fontSize:11,fontWeight:950,color:C.amber,marginBottom:8}}>進階資料</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10}}>
          <Metric label="莊家水錢" value={pct(a.overround||a.dataBlock?.overround||0)}/>
          <Metric label="風險分數" value={`${Math.round(a.risk||0)}/100`} color={a.risk>70?C.loss:C.dark}/>
          <Metric label="最佳賠率" value={a.bestOdds||best?.odds||'—'}/>
          <Metric label="最低參考" value={a.minOdds||best?.minOdds||'—'} color={C.navy}/>
        </div>
        <div style={{fontSize:11,color:'#92400E',marginTop:8}}>取消條件：{(a.cancelConditions||[]).slice(0,2).join('；') || '臨場資料改變或賠率跌破門檻。'}</div>
      </div>:<div style={{marginTop:12,border:`1.5px dashed ${C.border}`,borderRadius:10,padding:12,textAlign:'center',color:C.muted,fontSize:12}}>🔒 詳細 EV、最低參考價與取消條件為 VIP 內容</div>}
    </div>
  </div>;
}

export default function Dashboard({role,setPage,setSelectedSignal}){
  const [cache,setCache]=useState(null); const [loading,setLoading]=useState(true); const [filter,setFilter]=useState('全部'); const [section,setSection]=useState('today'); const [updating,setUpdating]=useState(false);
  const isAdmin=role==='admin'||role==='super_admin'; const isVIP=role==='vip'||role==='agent'||isAdmin;

  const load=async()=>{setLoading(true);try{const mod=await import('../services/firestore.js');const d=await mod.getTodayDashboard?.();setCache(d||null);}catch(e){console.warn('[Dashboard] cache skipped:',e.message);setCache(null);}setLoading(false);};
  useEffect(()=>{load();},[]);

  const update=async()=>{setUpdating(true);try{const r=await fetch('/api/cron/generate-analysis',{method:'POST',headers:{'Content-Type':'application/json','x-admin-trigger':'1'}});const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw new Error(d.error||`HTTP ${r.status}`);await load();alert(`✅ 已更新：今日 ${d.todayCount||0} 場，產生 ${d.generated||0} 篇分析`);}catch(e){alert('更新失敗：'+e.message)}setUpdating(false);};

  const items=useMemo(()=>{
    const sec=cache?.sections||{}; const list=section==='value'?sec.value:section==='watch'?sec.watch:section==='future'?sec.future:sec.today;
    return (list||[]).map(normalize).filter(a=>filter==='全部'||a.sport===filter);
  },[cache,filter,section]);
  const sports=useMemo(()=>['全部',...Array.from(new Set([...(cache?.sections?.today||[]),...(cache?.sections?.future||[])].map(x=>x.sport).filter(Boolean)))], [cache]);
  const last=cache?.generatedAt?new Date(cache.generatedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'尚未建立快取';

  if(role==='guest') return <div style={{background:C.bg,minHeight:'100vh',padding:'60px 20px',textAlign:'center'}}><h2 style={{color:C.dark}}>每日賽事分析報告</h2><p style={{color:C.muted}}>免費加入即可查看今日模型預測與賽前重點。</p><button onClick={()=>setPage?.('login')} style={{background:C.navy,color:C.white,border:'none',padding:'10px 24px',borderRadius:8,fontWeight:900,cursor:'pointer'}}>免費加入</button></div>;

  return <div style={{background:C.bg,minHeight:'100vh'}}><div style={{maxWidth:1040,margin:'0 auto',padding:'28px 20px'}}>
    <div style={{marginBottom:18}}><h2 style={{fontSize:28,fontWeight:950,color:C.dark,margin:'0 0 6px'}}>今日賽事預測</h2><p style={{color:C.muted,fontSize:13,margin:0}}>資料先同步、模型先計算，前台只讀快取；今日賽事不混入昨天或展示卡。</p></div>
    <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
      <div style={{fontSize:12,color:C.navy,lineHeight:1.6}}>📌 今日快取：{cache?.dateKey||'—'}｜更新：{last}｜模型：{cache?.modelVersion||'—'}｜來源：{cache?.sourceCoverage?.odds?'賠率✓':'賠率—'}</div>
      {isAdmin&&<button onClick={update} disabled={updating} style={{background:C.navy,color:C.white,border:'none',borderRadius:8,padding:'8px 14px',fontSize:12,fontWeight:900,cursor:'pointer'}}>{updating?<><Spin s={12}/> 更新中</>:'更新今日快取'}</button>}
    </div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>{Object.keys(SECTION_LABEL).map(k=><button key={k} onClick={()=>setSection(k)} style={{padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:8,cursor:'pointer',background:section===k?C.navy:C.white,color:section===k?C.white:C.muted,fontWeight:900,fontSize:12}}>{SECTION_LABEL[k]}</button>)}</div>
    <div style={{display:'flex',gap:0,overflowX:'auto',marginBottom:16}}><div style={{display:'flex',border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',background:C.white}}>{sports.map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:'7px 16px',border:'none',borderRight:`1px solid ${C.borderLight}`,background:filter===s?C.navy:'transparent',color:filter===s?C.white:C.muted,cursor:'pointer',fontWeight:800,fontSize:12,whiteSpace:'nowrap'}}>{s}</button>)}</div></div>
    {loading&&<div style={{textAlign:'center',padding:50}}><Spin s={38}/></div>}
    {!loading&&!cache&&<div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:28,textAlign:'center',color:C.muted}}>今日模型快取尚未建立。請管理員按「更新今日快取」。</div>}
    {!loading&&cache&&items.length===0&&<div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:28,textAlign:'center',color:C.muted}}>目前沒有 {filter} 的{SECTION_LABEL[section]}。可切換「未來賽事」或由 Admin 更新快取。</div>}
    {items.map(item=><AnalysisCard key={item.id} item={item} isVIP={isVIP} isAdmin={isAdmin} onOpen={()=>{setSelectedSignal?.(normalize(item));setPage?.('signal-detail')}}/>)}
    <div style={{marginTop:20,padding:'10px 12px',background:'#F8FAFC',border:`1px solid ${C.border}`,borderRadius:10,fontSize:11,color:C.muted,textAlign:'center'}}>SignalEdge 顯示的是機率與價格比較，不保證賽果；WAIT / NO BET 是模型風控的一部分。</div>
  </div></div>;
}
