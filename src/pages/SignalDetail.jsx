import { useIsMobile } from '../hooks/useIsMobile';
import { C } from '../constants/colors';

const DS={BET:{bg:'#ECFDF5',color:'#059669',label:'價值可關注'},LEAN:{bg:'#FFFBEB',color:'#D97706',label:'偏向觀察'},WAIT:{bg:'#F6F7FA',color:'#6B7280',label:'等待確認'},NO_BET:{bg:'#FEF2F2',color:'#DC2626',label:'價值不足'}};
const pct=(n)=>Number.isFinite(Number(n))?`${Number(n).toFixed(1)}%`:'—';
const fmt=(iso)=>{try{return new Date(iso).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' 台灣';}catch{return''}};
const normalize=(s={})=>({
  ...s,
  sport:s.sport||'綜合',home:s.home||s.homeTeam||'主隊',away:s.away||s.awayTeam||'客隊',
  timeStr:s.timeStr||fmt(s.commence_time),decision:s.decision||'WAIT',
  modelHome:Number(s.modelHome??s.dataBlock?.modelHome??0),modelDraw:Number(s.modelDraw??s.dataBlock?.modelDraw??0),modelAway:Number(s.modelAway??s.dataBlock?.modelAway??0),
  marketHome:Number(s.nvH??s.marketHome??s.dataBlock?.marketHome??0),marketDraw:Number(s.nvD??s.marketDraw??s.dataBlock?.marketDraw??0),marketAway:Number(s.nvA??s.marketAway??s.dataBlock?.marketAway??0),
  ev:Number(s.ev??s.dataBlock?.ev??0),edge:Number(s.edge??s.dataBlock?.edge??0),confidence:Number(s.confidence??s.dataBlock?.confidence??0),dataCompleteness:Number(s.dataCompleteness??s.dataBlock?.dataCompleteness??0),risk:Number(s.risk??s.dataBlock?.risk??0),
  topScores:s.topScores||s.dataBlock?.topScores||[],marketRows:s.marketRows||s.dataBlock?.marketRows||[],cancelConditions:s.cancelConditions||s.dataBlock?.cancelConditions||[],sourceCoverage:s.sourceCoverage||s.dataBlock?.sourceCoverage||{},
  analysis:s.analysis||'',xg:s.xg||s.dataBlock?.xg||null,over25:s.over25??s.dataBlock?.over25,btts:s.btts??s.dataBlock?.btts,
  foreignMasters:s.foreignMasters||s.dataBlock?.foreignMasters||[], foreignMasterConsensus:s.foreignMasterConsensus||s.dataBlock?.foreignMasterConsensus||null,
  signalFusion:s.signalFusion||s.dataBlock?.signalFusion||null, contentQuality:s.contentQuality||s.dataBlock?.contentQuality||null,
  decisionEngine:s.decisionEngine||s.dataBlock?.decisionEngine||null,
  beginnerLane:s.beginnerLane||s.dataBlock?.beginnerLane||s.decisionEngine?.beginnerLane||s.dataBlock?.decisionEngine?.beginnerLane||null,
  advancedLane:s.advancedLane||s.dataBlock?.advancedLane||s.decisionEngine?.advancedLane||s.dataBlock?.decisionEngine?.advancedLane||null,
  bettingConditions:s.bettingConditions||s.dataBlock?.bettingConditions||s.decisionEngine?.conditions||s.dataBlock?.decisionEngine?.conditions||null,
  probabilityScore:Number(s.probabilityScore??s.dataBlock?.probabilityScore??s.decisionEngine?.probabilityScore??s.dataBlock?.decisionEngine?.probabilityScore??0),
  valueScore:Number(s.valueScore??s.dataBlock?.valueScore??s.decisionEngine?.valueScore??s.dataBlock?.decisionEngine?.valueScore??0),
  riskScore:Number(s.riskScore??s.dataBlock?.riskScore??s.decisionEngine?.riskScore??s.dataBlock?.decisionEngine?.riskScore??s.risk??0),
  decisionTags:s.decisionTags||s.dataBlock?.decisionTags||s.decisionEngine?.tags||s.dataBlock?.decisionEngine?.tags||[],
  qualityScore:Number(s.qualityScore??s.dataBlock?.qualityScore??s.contentQuality?.score??0), signalAlignmentScore:Number(s.signalAlignmentScore??s.dataBlock?.signalAlignmentScore??s.signalFusion?.alignmentScore??0),
  qualityTags:s.qualityTags||s.dataBlock?.qualityTags||s.signalFusion?.tags||[],
});
const Card=({children,style={}})=><div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:18,...style}}>{children}</div>;
const Metric=({label,value,color=C.dark})=><div><div style={{fontSize:11,color:C.muted,fontWeight:800,marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:950,color,fontFamily:'ui-monospace,monospace'}}>{value}</div></div>;

export default function SignalDetail({ signal, role, setPage }) {
  const isMobile = useIsMobile();
  if (!signal) return <div style={{ padding: 60, textAlign: 'center', color: C.muted }}><div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div><div>信號不存在，請返回列表</div><button onClick={() => setPage('dashboard')} style={{ marginTop: 16, background: C.navy, color: C.white, border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>返回</button></div>;
  const s=normalize(signal); const ds=DS[s.decision]||DS.WAIT; const canSeeVIP = role === 'vip' || role === 'agent' || role === 'admin' || role === 'super_admin';

  return <div style={{ background: C.bg, minHeight: '100vh' }}><div style={{ maxWidth: 1040, margin: '0 auto', padding: isMobile ? '16px 14px' : '28px 28px' }}>
    <button onClick={() => setPage('dashboard')} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:13, padding:0, marginBottom:16 }}>← 返回今日賽事</button>
    <Card style={{borderLeft:`5px solid ${C.navy}`,borderRadius:'0 12px 12px 0',marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:10}}>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><span style={{fontSize:11,fontWeight:950,color:C.navy,background:'#EFF6FF',padding:'3px 9px',borderRadius:4}}>{s.sport}</span><span style={{fontSize:11,fontWeight:950,color:ds.color,background:ds.bg,padding:'3px 9px',borderRadius:4}}>{ds.label}</span>{s.decisionEngine?.segmentLabel&&<span style={{fontSize:11,fontWeight:950,color:'#6D28D9',background:'#F5F3FF',padding:'3px 9px',borderRadius:4}}>{s.decisionEngine.segmentLabel}</span>}{s.beginnerLane?.label&&<span style={{fontSize:11,fontWeight:950,color:'#0E7490',background:'#ECFEFF',padding:'3px 9px',borderRadius:4}}>{s.beginnerLane.label}</span>}</div>
        <span style={{fontSize:12,color:C.muted}}>{s.timeStr}</span>
      </div>
      <h1 style={{fontSize:isMobile?24:32,margin:'0 0 10px',color:C.dark}}>{s.home} <span style={{color:C.muted,fontWeight:500}}>vs</span> {s.away}</h1>
      <p style={{margin:0,color:C.muted,fontSize:13}}>模型版本：{s.modelVersion||'v6b'}｜方法：{s.modelNote||s.method||s.dataBlock?.method||'market calibrated model'}</p>
    </Card>

    <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(6,1fr)',gap:12,marginBottom:14}}>
      <Card><Metric label="模型勝率" value={`${pct(s.modelHome)}${s.modelDraw?` / ${pct(s.modelDraw)}`:''} / ${pct(s.modelAway)}`} color={C.navy}/></Card>
      <Card><Metric label="市場去水" value={`${pct(s.marketHome)}${s.marketDraw?` / ${pct(s.marketDraw)}`:''} / ${pct(s.marketAway)}`}/></Card>
      <Card><Metric label="EV / Edge" value={`${s.ev>0?'+':''}${pct(s.ev)} / ${s.edge>0?'+':''}${pct(s.edge)}`} color={s.ev>0?C.win:C.loss}/></Card>
      <Card><Metric label="資料 / 信心" value={`${Math.round(s.dataCompleteness)}/${Math.round(s.confidence)}`} color={C.amber}/></Card>
      <Card><Metric label="質量 / 一致性" value={`${Math.round(s.qualityScore||0)}/${Math.round(s.signalAlignmentScore||0)}`} color={C.navy}/></Card>
      <Card><Metric label="高機率 / 價值" value={`${Math.round(s.probabilityScore)}/${Math.round(s.valueScore)}`} color={C.win}/></Card>
      <Card><Metric label="風險分數" value={`${Math.round(s.riskScore)}/100`} color={s.riskScore>70?C.loss:C.amber}/></Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14,marginBottom:14}}>
      <Card style={{background:'#ECFEFF',border:'1px solid #A5F3FC'}}><div style={{fontSize:15,fontWeight:950,color:'#0E7490',marginBottom:10}}>新手高機率方向</div>
        <div style={{fontSize:28,fontWeight:950,color:'#0E7490',marginBottom:6}}>{Math.round(s.probabilityScore)}/100</div>
        <div style={{fontSize:14,color:C.dark,lineHeight:1.8}}><b>{s.beginnerLane?.label||'觀察'}</b>｜{s.beginnerLane?.note||'依勝率穩定分、資料完整度與風險判斷。'}</div>
      </Card>
      <Card style={{background:'#FFFBEB',border:'1px solid #FDE68A'}}><div style={{fontSize:15,fontWeight:950,color:C.amber,marginBottom:10}}>進階價值判斷</div>
        <div style={{fontSize:28,fontWeight:950,color:C.amber,marginBottom:6}}>{Math.round(s.valueScore)}/100</div>
        <div style={{fontSize:14,color:C.dark,lineHeight:1.8}}><b>{s.advancedLane?.label||'等待價格'}</b>｜{s.advancedLane?.note||'依 EV、Edge、最低參考價與市場是否過熱判斷。'}</div>
      </Card>
    </div>

    {s.decisionTags?.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>{s.decisionTags.slice(0,10).map(t=><span key={t} style={{fontSize:11,color:C.navy,background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:999,padding:'4px 10px',fontWeight:900}}>{t}</span>)}</div>}

    <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.2fr .8fr',gap:14,marginBottom:14}}>
      <Card><div style={{fontSize:15,fontWeight:950,color:C.dark,marginBottom:10}}>完整賽前分析</div><div style={{whiteSpace:'pre-line',lineHeight:1.9,fontSize:14,color:'#374151'}}>{s.analysis||'分析尚未產生，請由管理員更新今日快取。'}</div></Card>
      <Card><div style={{fontSize:15,fontWeight:950,color:C.dark,marginBottom:10}}>比分 / 市場摘要</div>
        {s.topScores?.length?<div style={{display:'grid',gap:7,marginBottom:12}}>{s.topScores.map(x=><div key={x.score} style={{display:'flex',justifyContent:'space-between',background:C.panelAlt,borderRadius:8,padding:'8px 10px'}}><b>{x.score}</b><span>{pct(x.probPct)}</span></div>)}</div>:<div style={{fontSize:13,color:C.muted,marginBottom:12}}>此運動目前未建立比分矩陣。</div>}
        {s.over25!=null&&<div style={{fontSize:13,color:C.muted,lineHeight:1.8}}>大小 2.5：Over {pct(s.over25)}<br/>雙方進球：{pct(s.btts)}</div>}
        {s.xg&&<div style={{fontSize:13,color:C.muted,lineHeight:1.8,marginTop:8}}>xG proxy：主 {s.xg.homeXg}｜客 {s.xg.awayXg}</div>}
      </Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14,marginBottom:14}}>
      <Card><div style={{fontSize:15,fontWeight:950,color:C.dark,marginBottom:10}}>內容質量與訊號一致性</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
          <div style={{background:C.panelAlt,borderRadius:10,padding:12}}><div style={{fontSize:11,color:C.muted,fontWeight:800}}>內容質量</div><div style={{fontSize:24,fontWeight:950,color:C.navy}}>{Math.round(s.qualityScore||0)}/100</div></div>
          <div style={{background:C.panelAlt,borderRadius:10,padding:12}}><div style={{fontSize:11,color:C.muted,fontWeight:800}}>訊號一致性</div><div style={{fontSize:24,fontWeight:950,color:C.win}}>{Math.round(s.signalAlignmentScore||0)}/100</div></div>
        </div>
        <div style={{fontSize:12,color:C.muted,lineHeight:1.8}}>共識方向：{s.signalFusion?.referenceDirection||'待確認'}｜衝突程度：{s.signalFusion?.conflictLevel||'—'}｜質量判斷：{s.signalFusion?.verdict||s.contentQuality?.note||'待補強'}</div>
        {s.qualityTags?.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}}>{s.qualityTags.map(t=><span key={t} style={{fontSize:10,color:C.navy,background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:999,padding:'3px 8px',fontWeight:900}}>{t}</span>)}</div>}
        {s.contentQuality?.missing?.length>0&&<div style={{fontSize:11,color:C.red,lineHeight:1.6,marginTop:10}}>缺口：{s.contentQuality.missing.slice(0,5).join('、')}</div>}
      </Card>
      <Card><div style={{fontSize:15,fontWeight:950,color:C.dark,marginBottom:10}}>國外分析大師共識</div>
        <div style={{fontSize:13,color:C.dark,lineHeight:1.8,marginBottom:10}}>{s.foreignMasterConsensus?.summary||'目前沒有足夠的國外分析大師觀點命中此賽事。'}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          <div style={{background:C.panelAlt,borderRadius:8,padding:10}}><div style={{fontSize:10,color:C.muted,fontWeight:800}}>可用來源</div><b>{s.foreignMasterConsensus?.usableSources||0}</b></div>
          <div style={{background:C.panelAlt,borderRadius:8,padding:10}}><div style={{fontSize:10,color:C.muted,fontWeight:800}}>共識</div><b>{s.foreignMasterConsensus?.consensusDirection||'watch'}</b></div>
          <div style={{background:C.panelAlt,borderRadius:8,padding:10}}><div style={{fontSize:10,color:C.muted,fontWeight:800}}>分歧</div><b>{s.foreignMasterConsensus?.conflictLevel||'none'}</b></div>
        </div>
      </Card>
    </div>

    {s.foreignMasters?.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:15,fontWeight:950,color:C.dark,marginBottom:12}}>國外分析大師牆</div>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(2,1fr)',gap:10}}>{s.foreignMasters.slice(0,8).map(m=><div key={m.id||m.title} style={{border:`1px solid ${C.borderLight}`,borderRadius:10,padding:12,background:C.panelAlt}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8,marginBottom:6}}><b style={{fontSize:13,color:C.dark}}>{m.sourceName||m.sourceLabel}</b><span style={{fontSize:10,color:C.amber,fontWeight:900}}>{m.stance||'watch'}</span></div>
        <div style={{fontSize:12,color:C.dark,lineHeight:1.55,marginBottom:6}}>{m.title||m.summaryZh||'國外分析大師觀點'}</div>
        {m.summaryZh&&<div style={{fontSize:11,color:C.muted,lineHeight:1.55,marginBottom:6}}>{m.summaryZh}</div>}
        <div style={{fontSize:10,color:C.muted}}>匹配 {Math.round((m.eventMatchScore||0)*100)}%｜分數 {m.masterScore||'—'}｜{m.sourceTier||'Tier 未標'}</div>
        {m.url&&<div style={{display:'inline-block',marginTop:7,fontSize:11,color:C.muted,fontWeight:900}}>來源已存證於系統</div>}
      </div>)}</div>
      <div style={{marginTop:10,fontSize:11,color:C.muted}}>主體顯示 SignalEdge 整理後的摘要、傾向、分數與二次分析；來源只作為系統存證，不把使用者導離主站。</div>
    </Card>}

    {canSeeVIP?<Card style={{marginBottom:14}}><div style={{fontSize:15,fontWeight:950,color:C.dark,marginBottom:12}}>進階價格表</div><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{['方向','賠率','市場','模型','Edge','EV','最低參考'].map(h=><th key={h} style={{textAlign:'left',borderBottom:`1px solid ${C.borderLight}`,padding:'8px',color:C.muted,fontSize:11}}>{h}</th>)}</tr></thead><tbody>{(s.marketRows||[]).map(r=><tr key={r.role||r.name}><td style={{padding:'8px',fontWeight:800}}>{r.role==='home'?s.home:r.role==='away'?s.away:'平手'}</td><td style={{padding:'8px'}}>{r.odds||r.price}</td><td style={{padding:'8px'}}>{pct(r.marketProbPct)}</td><td style={{padding:'8px'}}>{pct(r.modelProbPct)}</td><td style={{padding:'8px',color:Number(r.edgePct)>0?C.win:C.loss}}>{Number(r.edgePct)>0?'+':''}{pct(r.edgePct)}</td><td style={{padding:'8px',color:Number(r.evPct)>0?C.win:C.loss}}>{Number(r.evPct)>0?'+':''}{pct(r.evPct)}</td><td style={{padding:'8px'}}>{r.minOdds||'—'}</td></tr>)}</tbody></table></div></Card>:<Card style={{marginBottom:14,textAlign:'center',color:C.muted}}>🔒 進階價格表、EV 拆解與取消條件為 VIP 內容。</Card>}

    <Card style={{marginBottom:14}}><div style={{fontSize:15,fontWeight:950,color:C.dark,marginBottom:10}}>下注條件與放棄條件</div>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14}}>
        <div><div style={{fontSize:12,fontWeight:900,color:C.win,marginBottom:8}}>可以考慮的條件</div><ul style={{margin:'0 0 0 18px',padding:0,color:C.dark,fontSize:13,lineHeight:1.9}}>{(s.bettingConditions?.entryConditions||[]).map(x=><li key={x}>{x}</li>)}</ul></div>
        <div><div style={{fontSize:12,fontWeight:900,color:C.loss,marginBottom:8}}>應該降低或放棄的條件</div><ul style={{margin:'0 0 0 18px',padding:0,color:C.dark,fontSize:13,lineHeight:1.9}}>{(s.bettingConditions?.avoidConditions||s.cancelConditions||[]).map(x=><li key={x}>{x}</li>)}</ul></div>
      </div>
      {s.bettingConditions?.priceNote&&<div style={{marginTop:12,padding:'10px 12px',background:C.panelAlt,borderRadius:8,fontSize:12,color:C.muted,lineHeight:1.7}}>{s.bettingConditions.priceNote}</div>}
    </Card>

    <Card><div style={{fontSize:15,fontWeight:950,color:C.dark,marginBottom:10}}>資料來源與取消條件</div>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14}}>
        <div><div style={{fontSize:12,color:C.muted,lineHeight:1.9}}>賠率資料：{s.sourceCoverage?.odds?'已同步':'未同步'}<br/>賽程時間：{s.sourceCoverage?.schedule?'已同步':'未同步'}<br/>隊伍數據：{s.sourceCoverage?.stats?'已同步':'待接入'}<br/>陣容 / 傷病：{s.sourceCoverage?.lineups?'已確認':'賽前需確認'}</div></div>
        <div><ul style={{margin:'0 0 0 18px',padding:0,color:C.muted,fontSize:12,lineHeight:1.9}}>{(s.cancelConditions||[]).map(x=><li key={x}>{x}</li>)}</ul></div>
      </div>
      <div style={{marginTop:12,padding:'10px 12px',background:C.panelAlt,borderRadius:8,fontSize:11,color:C.muted}}>此頁提供新手高機率方向與進階價值判斷；所有內容皆為機率與價格比較，不保證賽果。</div>
    </Card>
  </div></div>;
}
