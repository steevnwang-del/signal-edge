import { useIsMobile } from '../hooks/useIsMobile';
import { C } from '../constants/colors';

const DS={BET:{bg:'#ECFDF5',color:'#059669',label:'可關注'},LEAN:{bg:'#FFFBEB',color:'#D97706',label:'偏向觀察'},WAIT:{bg:'#F6F7FA',color:'#6B7280',label:'等待確認'},NO_BET:{bg:'#FEF2F2',color:'#DC2626',label:'不追價'}};
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
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><span style={{fontSize:11,fontWeight:950,color:C.navy,background:'#EFF6FF',padding:'3px 9px',borderRadius:4}}>{s.sport}</span><span style={{fontSize:11,fontWeight:950,color:ds.color,background:ds.bg,padding:'3px 9px',borderRadius:4}}>{ds.label}</span></div>
        <span style={{fontSize:12,color:C.muted}}>{s.timeStr}</span>
      </div>
      <h1 style={{fontSize:isMobile?24:32,margin:'0 0 10px',color:C.dark}}>{s.home} <span style={{color:C.muted,fontWeight:500}}>vs</span> {s.away}</h1>
      <p style={{margin:0,color:C.muted,fontSize:13}}>模型版本：{s.modelVersion||'v6b'}｜方法：{s.modelNote||s.method||s.dataBlock?.method||'market calibrated model'}</p>
    </Card>

    <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(4,1fr)',gap:12,marginBottom:14}}>
      <Card><Metric label="模型勝率" value={`${pct(s.modelHome)}${s.modelDraw?` / ${pct(s.modelDraw)}`:''} / ${pct(s.modelAway)}`} color={C.navy}/></Card>
      <Card><Metric label="市場去水" value={`${pct(s.marketHome)}${s.marketDraw?` / ${pct(s.marketDraw)}`:''} / ${pct(s.marketAway)}`}/></Card>
      <Card><Metric label="EV / Edge" value={`${s.ev>0?'+':''}${pct(s.ev)} / ${s.edge>0?'+':''}${pct(s.edge)}`} color={s.ev>0?C.win:C.loss}/></Card>
      <Card><Metric label="資料 / 信心" value={`${Math.round(s.dataCompleteness)}/${Math.round(s.confidence)}`} color={C.amber}/></Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.2fr .8fr',gap:14,marginBottom:14}}>
      <Card><div style={{fontSize:15,fontWeight:950,color:C.dark,marginBottom:10}}>完整賽前分析</div><div style={{whiteSpace:'pre-line',lineHeight:1.9,fontSize:14,color:'#374151'}}>{s.analysis||'分析尚未產生，請由管理員更新今日快取。'}</div></Card>
      <Card><div style={{fontSize:15,fontWeight:950,color:C.dark,marginBottom:10}}>比分 / 市場摘要</div>
        {s.topScores?.length?<div style={{display:'grid',gap:7,marginBottom:12}}>{s.topScores.map(x=><div key={x.score} style={{display:'flex',justifyContent:'space-between',background:C.panelAlt,borderRadius:8,padding:'8px 10px'}}><b>{x.score}</b><span>{pct(x.probPct)}</span></div>)}</div>:<div style={{fontSize:13,color:C.muted,marginBottom:12}}>此運動目前未建立比分矩陣。</div>}
        {s.over25!=null&&<div style={{fontSize:13,color:C.muted,lineHeight:1.8}}>大小 2.5：Over {pct(s.over25)}<br/>雙方進球：{pct(s.btts)}</div>}
        {s.xg&&<div style={{fontSize:13,color:C.muted,lineHeight:1.8,marginTop:8}}>xG proxy：主 {s.xg.homeXg}｜客 {s.xg.awayXg}</div>}
      </Card>
    </div>

    {canSeeVIP?<Card style={{marginBottom:14}}><div style={{fontSize:15,fontWeight:950,color:C.dark,marginBottom:12}}>進階價格表</div><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{['方向','賠率','市場','模型','Edge','EV','最低參考'].map(h=><th key={h} style={{textAlign:'left',borderBottom:`1px solid ${C.borderLight}`,padding:'8px',color:C.muted,fontSize:11}}>{h}</th>)}</tr></thead><tbody>{(s.marketRows||[]).map(r=><tr key={r.role||r.name}><td style={{padding:'8px',fontWeight:800}}>{r.role==='home'?s.home:r.role==='away'?s.away:'平手'}</td><td style={{padding:'8px'}}>{r.odds||r.price}</td><td style={{padding:'8px'}}>{pct(r.marketProbPct)}</td><td style={{padding:'8px'}}>{pct(r.modelProbPct)}</td><td style={{padding:'8px',color:Number(r.edgePct)>0?C.win:C.loss}}>{Number(r.edgePct)>0?'+':''}{pct(r.edgePct)}</td><td style={{padding:'8px',color:Number(r.evPct)>0?C.win:C.loss}}>{Number(r.evPct)>0?'+':''}{pct(r.evPct)}</td><td style={{padding:'8px'}}>{r.minOdds||'—'}</td></tr>)}</tbody></table></div></Card>:<Card style={{marginBottom:14,textAlign:'center',color:C.muted}}>🔒 進階價格表、EV 拆解與取消條件為 VIP 內容。</Card>}

    <Card><div style={{fontSize:15,fontWeight:950,color:C.dark,marginBottom:10}}>資料來源與取消條件</div>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14}}>
        <div><div style={{fontSize:12,color:C.muted,lineHeight:1.9}}>賠率資料：{s.sourceCoverage?.odds?'已同步':'未同步'}<br/>賽程時間：{s.sourceCoverage?.schedule?'已同步':'未同步'}<br/>隊伍數據：{s.sourceCoverage?.stats?'已同步':'待接入'}<br/>陣容 / 傷病：{s.sourceCoverage?.lineups?'已確認':'賽前需確認'}</div></div>
        <div><ul style={{margin:'0 0 0 18px',padding:0,color:C.muted,fontSize:12,lineHeight:1.9}}>{(s.cancelConditions||[]).map(x=><li key={x}>{x}</li>)}</ul></div>
      </div>
      <div style={{marginTop:12,padding:'10px 12px',background:C.panelAlt,borderRadius:8,fontSize:11,color:C.muted}}>此頁提供機率與價格比較，不保證比賽結果，不提供投注服務。</div>
    </Card>
  </div></div>;
}
