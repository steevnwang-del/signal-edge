import { useEffect, useMemo, useState } from 'react';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',borderLight:'#E9EBF0',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626',panelAlt:'#F6F7FA'};
const SC={世界杯:'#1B5E20',NBA:'#C9082A',MLB:'#002D72',NHL:'#002654',UFC:'#D20A0A',英超:'#3D195B',歐冠:'#003399',西甲:'#C60B1E','LOL 電競':'#7C3AED','MSI 2026':'#7C3AED'};
const DS={BET:{bg:'#ECFDF5',color:'#059669',label:'價值可關注'},LEAN:{bg:'#FFFBEB',color:'#D97706',label:'偏向觀察'},WAIT:{bg:'#F6F7FA',color:'#6B7280',label:'等待確認'},NO_BET:{bg:'#FEF2F2',color:'#DC2626',label:'價值不足'}};
const SECTION_LABEL={today:'今日賽事',highProbability:'高機率方向',value:'價值型機會',watch:'觀察名單',future:'未來賽事'};

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
  analysis:a.analysis||null,
  decisionEngine:a.decisionEngine||a.dataBlock?.decisionEngine||null,
  beginnerLane:a.beginnerLane||a.dataBlock?.beginnerLane||a.decisionEngine?.beginnerLane||a.dataBlock?.decisionEngine?.beginnerLane||null,
  advancedLane:a.advancedLane||a.dataBlock?.advancedLane||a.decisionEngine?.advancedLane||a.dataBlock?.decisionEngine?.advancedLane||null,
  bettingConditions:a.bettingConditions||a.dataBlock?.bettingConditions||a.decisionEngine?.conditions||a.dataBlock?.decisionEngine?.conditions||null,
  probabilityScore:Number(a.probabilityScore??a.dataBlock?.probabilityScore??a.decisionEngine?.probabilityScore??a.dataBlock?.decisionEngine?.probabilityScore??0),
  valueScore:Number(a.valueScore??a.dataBlock?.valueScore??a.decisionEngine?.valueScore??a.dataBlock?.decisionEngine?.valueScore??0),
  riskScore:Number(a.riskScore??a.dataBlock?.riskScore??a.decisionEngine?.riskScore??a.dataBlock?.decisionEngine?.riskScore??a.risk??0),
  decisionTags:a.decisionTags||a.dataBlock?.decisionTags||a.decisionEngine?.tags||a.dataBlock?.decisionEngine?.tags||[],
  minOdds:a.minOdds||a.dataBlock?.minOdds||null,
  bestOdds:a.bestOdds||a.dataBlock?.bestOdds||null,
  overround:a.overround||a.dataBlock?.overround||0,
  pickName:a.pickName||a.dataBlock?.pickName||null,
  over25:a.over25??a.dataBlock?.over25??null,
  btts:a.btts??a.dataBlock?.btts??null,
});

function Metric({label,value,color=C.dark}){return <div><div style={{fontSize:10,color:C.muted,fontWeight:800,marginBottom:3}}>{label}</div><div style={{fontSize:18,fontWeight:950,color,fontFamily:'ui-monospace,monospace'}}>{value}</div></div>}

function AnalysisCard({item, isVIP, isAdmin, onOpen}){
  const a=normalize(item);
  const sc=SC[a.sport]||C.navy;
  const ds=DS[a.decision]||DS.WAIT;
  const best=a.marketRows?.find(r=>r.role===a.bestRole)||a.marketRows?.[0];
  const scoreText=a.topScores?.length?a.topScores.slice(0,3).map(s=>`${s.score} ${s.probPct}%`).join(' / '):'依盤口與賽前資料更新';

  // 冷門賽事過濾：EV > 20% 且非熱門運動通常是模型噪音，降為 WAIT 顯示
  const displayDecision = (Math.abs(a.ev) > 20 && a.dataCompleteness < 70) ? 'WAIT' : a.decision;
  const displayDS = DS[displayDecision] || DS.WAIT;

  return <div style={{background:C.white,border:`1.5px solid ${C.border}`,borderLeft:`5px solid ${sc}`,borderRadius:'0 12px 12px 0',marginBottom:14,overflow:'hidden'}}>
    <div style={{padding:'16px 20px'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',marginBottom:10}}>
        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{background:sc+'18',color:sc,fontSize:10,fontWeight:900,padding:'3px 8px',borderRadius:4}}>{a.sport}</span>
          <span style={{background:displayDS.bg,color:displayDS.color,fontSize:10,fontWeight:900,padding:'3px 9px',borderRadius:4}}>{displayDS.label}</span>
          {a.decisionEngine?.segmentLabel&&<span style={{background:'#F5F3FF',color:'#6D28D9',fontSize:10,fontWeight:900,padding:'3px 9px',borderRadius:4}}>{a.decisionEngine.segmentLabel}</span>}
          {a.beginnerLane?.label&&<span style={{background:'#ECFEFF',color:'#0E7490',fontSize:10,fontWeight:900,padding:'3px 9px',borderRadius:4}}>{a.beginnerLane.label}</span>}
        </div>
        <span style={{fontSize:11,color:C.amber,fontWeight:900}}>{a.timeStr}</span>
      </div>

      {/* 隊伍名稱 */}
      <button onClick={onOpen} style={{background:'none',border:'none',padding:0,textAlign:'left',cursor:'pointer',width:'100%'}}>
        <div style={{fontSize:20,fontWeight:950,color:C.dark,marginBottom:2}}>{a.home} <span style={{color:C.muted,fontWeight:500,fontSize:14}}>vs</span> {a.away}</div>
        {(a.homeEn||a.awayEn)&&a.homeEn!==a.home&&<div style={{fontSize:11,color:C.muted,fontFamily:'ui-monospace,monospace'}}>{a.homeEn||a.home} vs {a.awayEn||a.away}</div>}
      </button>

      {/* 核心數據 - 免費版隱藏 EV/Edge */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginTop:14,marginBottom:12}}>
        <div style={{background:C.panelAlt,borderRadius:10,padding:12}}>
          <Metric label="模型勝率" value={`${pct(a.modelHome)} / ${a.modelDraw?pct(a.modelDraw)+' / ':''}${pct(a.modelAway)}`} color={C.navy}/>
        </div>
        <div style={{background:C.panelAlt,borderRadius:10,padding:12}}>
          <Metric label="市場去水" value={`${pct(a.nvH)} / ${a.nvD?pct(a.nvD)+' / ':''}${pct(a.nvA)}`}/>
        </div>
        {isVIP
          ? <div style={{background:C.panelAlt,borderRadius:10,padding:12}}>
              <Metric label="EV / Edge" value={`${a.ev>0?'+':''}${pct(a.ev)} / ${a.edge>0?'+':''}${pct(a.edge)}`} color={a.ev>2?C.win:a.ev<0?C.loss:C.dark}/>
            </div>
          : <div style={{background:C.panelAlt,borderRadius:10,padding:12,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:4}}>
              <div style={{fontSize:10,color:C.muted,fontWeight:800}}>EV / Edge</div>
              <div style={{fontSize:12,color:C.muted}}>🔒 VIP</div>
            </div>
        }
        <div style={{background:C.panelAlt,borderRadius:10,padding:12}}>
          <Metric label="高機率 / 價值" value={`${Math.round(a.probabilityScore)}/${Math.round(a.valueScore)}`} color={sc}/>
        </div>
        <div style={{background:C.panelAlt,borderRadius:10,padding:12}}>
          <Metric label="風險 / 資料" value={`${Math.round(a.riskScore)}/${Math.round(a.dataCompleteness)}`} color={a.riskScore>70?C.loss:C.amber}/>
        </div>
      </div>

      {/* 雙軌決策 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={{background:'#ECFEFF',border:'1px solid #A5F3FC',borderRadius:10,padding:12}}>
          <div style={{fontSize:11,color:'#0E7490',fontWeight:900,marginBottom:6}}>🧭 新手 / 高機率方向</div>
          <div style={{fontSize:13,color:C.dark,lineHeight:1.65}}><b>{a.beginnerLane?.label||'觀察'}</b>｜{a.beginnerLane?.note||'系統會依勝率穩定分、資料完整度與風險判斷。'}</div>
        </div>
        <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:10,padding:12}}>
          <div style={{fontSize:11,color:C.amber,fontWeight:900,marginBottom:6}}>💰 進階 / 價值判斷</div>
          <div style={{fontSize:13,color:C.dark,lineHeight:1.65}}><b>{a.advancedLane?.label||'等待價格'}</b>｜{a.advancedLane?.note||'系統會依 EV、Edge、最低參考價與市場是否過熱判斷。'}</div>
        </div>
      </div>

      {/* 比分劇本 + 價格觀察 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={{background:'#F8FAFC',border:`1px solid ${C.borderLight}`,borderRadius:10,padding:12}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:900,marginBottom:6}}>🎯 比分 / 劇本</div>
          <div style={{fontSize:13,color:C.dark,fontWeight:800,lineHeight:1.6}}>{scoreText}</div>
          {a.over25!=null&&<div style={{fontSize:11,color:C.muted,marginTop:5}}>大小 2.5：Over {pct(a.over25)}</div>}
        </div>
        {isVIP
          ? <div style={{background:'#F8FAFC',border:`1px solid ${C.borderLight}`,borderRadius:10,padding:12}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:900,marginBottom:6}}>💡 價格觀察</div>
              <div style={{fontSize:13,color:C.dark,lineHeight:1.6}}>觀察方向：<b>{a.pickName||best?.name||'—'}</b>；最低參考價 <b>{a.minOdds||best?.minOdds||'—'}</b></div>
            </div>
          : <div style={{background:'#F8FAFC',border:`1px solid ${C.borderLight}`,borderRadius:10,padding:12,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:6,textAlign:'center'}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:900}}>💡 價格觀察</div>
              <div style={{fontSize:12,color:C.muted}}>🔒 升級 VIP 解鎖</div>
              <button onClick={()=>{}} style={{fontSize:10,padding:'4px 10px',background:C.navy,color:C.white,border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>了解方案</button>
            </div>
        }
      </div>

      {a.decisionTags?.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>{a.decisionTags.slice(0,8).map(t=><span key={t} style={{fontSize:10,color:C.navy,background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:999,padding:'3px 8px',fontWeight:900}}>{t}</span>)}</div>}

      {/* AI 分析文字 */}
      {a.analysis
        ? <div style={{fontSize:13,color:'#374151',lineHeight:1.85,whiteSpace:'pre-line',borderTop:`1px solid ${C.borderLight}`,paddingTop:12,marginBottom:4}}>{a.analysis}</div>
        : <div style={{borderTop:`1px solid ${C.borderLight}`,paddingTop:12,marginBottom:4}}>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>
              模型已完成計算。今日 AI 分析報告將於賽前更新，屆時顯示詳細解讀與風險評估。
            </div>
          </div>
      }

      {/* VIP 進階資料 */}
      {isVIP
        ? <div style={{marginTop:12,background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:10,padding:12}}>
            <div style={{fontSize:11,fontWeight:950,color:C.amber,marginBottom:8}}>進階資料</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10}}>
              <Metric label="莊家水錢" value={pct(a.overround||0)}/>
              <Metric label="風險分數" value={`${Math.round(a.risk||0)}/100`} color={a.risk>70?C.loss:C.dark}/>
              <Metric label="最佳賠率" value={a.bestOdds||best?.odds||'—'}/>
              <Metric label="最低參考" value={a.minOdds||best?.minOdds||'—'} color={C.navy}/>
            </div>
            <div style={{fontSize:11,color:'#92400E',marginTop:8}}>取消條件：{(a.cancelConditions||[]).slice(0,2).join('；')||'臨場資料改變或賠率跌破門檻。'}</div>
          </div>
        : <div style={{marginTop:10,border:`1.5px dashed ${C.border}`,borderRadius:10,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:12,color:C.muted}}>🔒 莊家水錢、風險分數、最佳賠率、完整取消條件 · VIP 專屬</span>
            <button onClick={()=>{}} style={{fontSize:11,padding:'5px 12px',background:C.navy,color:C.white,border:'none',borderRadius:6,cursor:'pointer',fontWeight:700,whiteSpace:'nowrap'}}>升級 VIP</button>
          </div>
      }
    </div>
  </div>;
}

export default function Dashboard({role,setPage,setSelectedSignal}){
  const [cache,setCache]=useState(null);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('全部');
  const [section,setSection]=useState('today');
  const [updating,setUpdating]=useState(false);
  const isAdmin=role==='admin'||role==='super_admin';
  const isVIP=role==='vip'||role==='agent'||isAdmin;

  const load=async()=>{
    setLoading(true);
    try{const mod=await import('../services/firestore.js');const d=await mod.getTodayDashboard?.();setCache(d||null);}
    catch(e){console.warn('[Dashboard] cache skipped:',e.message);setCache(null);}
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const update=async()=>{
    setUpdating(true);
    try{
      const r=await fetch('/api/cron/generate-analysis',{method:'POST',headers:{'Content-Type':'application/json','x-admin-trigger':'1'}});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||d.success===false)throw new Error(d.error||`HTTP ${r.status}`);
      await load();
      alert(`✅ 已更新：今日 ${d.todayCount||0} 場，產生 ${d.generated||0} 篇分析`);
    }catch(e){alert('更新失敗：'+e.message);}
    setUpdating(false);
  };

  const items=useMemo(()=>{
    const sec=cache?.sections||{};
    const list=section==='highProbability'?sec.highProbability:section==='value'?sec.value:section==='watch'?sec.watch:section==='future'?sec.future:sec.today;
    return (list||[]).map(normalize).filter(a=>filter==='全部'||a.sport===filter);
  },[cache,filter,section]);

  const sports=useMemo(()=>[
    '全部',
    ...Array.from(new Set([
      ...(cache?.sections?.today||[]),
      ...(cache?.sections?.future||[])
    ].map(x=>x.sport).filter(Boolean)))
  ],[cache]);

  const last=cache?.generatedAt?new Date(cache.generatedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'尚未建立';

  if(role==='guest') return(
    <div style={{background:C.bg,minHeight:'100vh',padding:'60px 20px',textAlign:'center'}}>
      <h2 style={{color:C.dark,marginBottom:8}}>每日賽事分析報告</h2>
      <p style={{color:C.muted,marginBottom:24}}>免費加入即可查看今日模型預測與賽前重點。</p>
      <button onClick={()=>setPage?.('login')} style={{background:C.navy,color:C.white,border:'none',padding:'10px 24px',borderRadius:8,fontWeight:900,cursor:'pointer',fontSize:14}}>免費加入</button>
    </div>
  );

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      <div style={{maxWidth:1040,margin:'0 auto',padding:'28px 20px'}}>
        <div style={{marginBottom:18}}>
          <h2 style={{fontSize:28,fontWeight:950,color:C.dark,margin:'0 0 6px'}}>今日賽事預測</h2>
          <p style={{color:C.muted,fontSize:13,margin:0}}>每日模型更新 · 新手看方向與比分 · VIP 看價格、風險與賽前條件</p>
        </div>

        {/* 快取狀態列 - 只有 Admin 看到更新按鈕和技術細節 */}
        <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          {isAdmin
            ? <div style={{fontSize:12,color:C.navy,lineHeight:1.6}}>📌 快取：{cache?.dateKey||'—'} | 更新：{last} | 模型：{cache?.modelVersion||'—'} | 賠率：{cache?.sourceCoverage?.odds?'✓':'—'}</div>
            : <div style={{fontSize:12,color:C.navy}}>📊 2026 世界杯專題進行中 · 每日模型更新</div>
          }
          {isAdmin&&<button onClick={update} disabled={updating} style={{background:C.navy,color:C.white,border:'none',borderRadius:8,padding:'8px 14px',fontSize:12,fontWeight:900,cursor:'pointer'}}>{updating?<><Spin s={12}/> 更新中</>:'更新今日快取'}</button>}
        </div>

        {/* Section tabs */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
          {Object.keys(SECTION_LABEL).map(k=>(
            <button key={k} onClick={()=>setSection(k)} style={{padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:8,cursor:'pointer',background:section===k?C.navy:C.white,color:section===k?C.white:C.muted,fontWeight:900,fontSize:12}}>
              {SECTION_LABEL[k]}
            </button>
          ))}
        </div>

        {/* Sport filter tabs */}
        <div style={{overflowX:'auto',marginBottom:16}}>
          <div style={{display:'flex',border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',background:C.white,width:'max-content'}}>
            {sports.map(s=>(
              <button key={s} onClick={()=>setFilter(s)} style={{padding:'7px 16px',border:'none',borderRight:`1px solid ${C.borderLight}`,background:filter===s?C.navy:'transparent',color:filter===s?C.white:C.muted,cursor:'pointer',fontWeight:800,fontSize:12,whiteSpace:'nowrap'}}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading&&<div style={{textAlign:'center',padding:50}}><Spin s={38}/></div>}
        {!loading&&!cache&&(
          <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:28,textAlign:'center',color:C.muted}}>
            <div style={{fontSize:32,marginBottom:12}}>📊</div>
            <div style={{fontSize:15,fontWeight:700,color:C.dark,marginBottom:6}}>今日分析準備中</div>
            <div style={{fontSize:13}}>模型每日定時更新，請稍後再查看。</div>
          </div>
        )}
        {!loading&&cache&&items.length===0&&(
          <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:28,textAlign:'center',color:C.muted}}>
            <div style={{fontSize:32,marginBottom:12}}>🔍</div>
            <div style={{fontSize:15,fontWeight:700,color:C.dark,marginBottom:6}}>
              {filter==='全部'?`${SECTION_LABEL[section]}暫無資料`:`今日暫無 ${filter} 賽事`}
            </div>
            <div style={{fontSize:13}}>
              {filter!=='全部'?'可切換「全部」查看其他運動，或切換至「未來賽事」。':'可切換至「未來賽事」查看近期賽程。'}
            </div>
          </div>
        )}

        {items.map(item=>(
          <AnalysisCard
            key={item.id||item.eventId}
            item={item}
            isVIP={isVIP}
            isAdmin={isAdmin}
            onOpen={()=>{setSelectedSignal?.(normalize(item));setPage?.('signal-detail');}}
          />
        ))}

        <div style={{marginTop:20,padding:'10px 12px',background:'#F8FAFC',border:`1px solid ${C.border}`,borderRadius:10,fontSize:11,color:C.muted,textAlign:'center'}}>
          SignalEdge 同時提供新手高機率方向與進階價值判斷；所有內容都是機率與價格比較，不保證賽果。
        </div>
      </div>
    </div>
  );
}
