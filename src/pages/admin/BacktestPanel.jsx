import { useState, useEffect } from 'react';
const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626'};
const RB=({r})=>{const m={win:{bg:'#ECFDF5',c:'#059669',l:'✅ 命中'},loss:{bg:'#FEF2F2',c:'#DC2626',l:'❌ 未中'},void:{bg:'#F6F7FA',c:'#6B7280',l:'⭕ 無效'},pending:{bg:'#EFF6FF',c:'#2563EB',l:'⏳ 待結算'}};const s=m[r||'pending'];return<span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:4,background:s.bg,color:s.c}}>{s.l}</span>;};

export default function BacktestPanel(){
  const [recs,setRecs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [stats,setStats]=useState({total:0,settled:0,wins:0,losses:0,hitRate:0,roi:0});
  const [filter,setFilter]=useState('all');
  const [updId,setUpdId]=useState(null);

  useEffect(()=>{load();},[]);

  const load=async()=>{
    setLoading(true);
    try{const mod=await import('../../services/firestore.js');const all=await mod.getAnalyses?.({limitN:200})||[];setRecs(all);calc(all);}catch(e){console.warn(e);}
    setLoading(false);
  };

  const calc=(r)=>{
    const bet=r.filter(x=>x.decision==='BET');
    const s=bet.filter(x=>x.result==='win'||x.result==='loss');
    const w=s.filter(x=>x.result==='win').length;
    const roi=s.length?s.reduce((acc,x)=>x.result==='win'?acc+(x.odds?.h||2)-1:acc-1,0)/s.length*100:0;
    setStats({total:r.length,settled:s.length,wins:w,losses:s.length-w,hitRate:s.length?+(w/s.length*100).toFixed(1):0,roi:+roi.toFixed(1)});
  };

  const mark=async(id,result)=>{
    setUpdId(id);
    try{const mod=await import('../../services/firestore.js');await mod.updateAnalysis?.(id,{result,settledAt:new Date()});const next=recs.map(r=>r.id===id?{...r,result}:r);setRecs(next);calc(next);}catch(e){alert('更新失敗：'+e.message);}
    setUpdId(null);
  };

  const filtered=recs.filter(r=>filter==='all'||filter==='bet'&&r.decision==='BET'||filter==='pending'&&(!r.result||r.result==='pending')||filter==='settled'&&(r.result==='win'||r.result==='loss'));

  return(
    <div style={{padding:'0 4px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:10,marginBottom:20}}>
        {[{l:'BET命中率',v:stats.hitRate+'%',c:stats.hitRate>55?C.win:stats.hitRate>0?C.loss:C.muted,note:'只計BET場次'},{l:'ROI',v:(stats.roi>0?'+':'')+stats.roi+'%',c:stats.roi>0?C.win:C.loss,note:'平均每注'},{l:'已結算',v:stats.settled,c:C.dark,note:`${stats.wins}勝${stats.losses}負`},{l:'分析總數',v:stats.total,c:C.dark,note:'含所有決策'}].map(s=>(
          <div key={s.l} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:'12px',textAlign:'center'}}><div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,fontWeight:700,color:C.dark,marginTop:2}}>{s.l}</div><div style={{fontSize:9,color:C.muted}}>{s.note}</div></div>
        ))}
      </div>
      <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:11,color:'#1E40AF'}}>
        📊 <strong>命中率</strong>：只計「BET」決策場次，最終勝出方向與預測一致 = 命中。<strong>ROI</strong>：假設每注1單位，(總盈虧 ÷ 場次數)×100%
      </div>
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        {[['all','全部'],['bet','BET決策'],['pending','待結算'],['settled','已結算']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{padding:'6px 14px',border:`1px solid ${filter===k?C.navy:C.border}`,borderRadius:6,cursor:'pointer',background:filter===k?C.navy:'transparent',color:filter===k?C.white:C.muted,fontSize:12,fontWeight:600}}>{l}</button>
        ))}
        <button onClick={load} style={{marginLeft:'auto',padding:'6px 14px',border:`1px solid ${C.border}`,borderRadius:6,cursor:'pointer',background:'transparent',color:C.muted,fontSize:12}}>🔄</button>
      </div>
      {loading&&<div style={{textAlign:'center',padding:32,color:C.muted}}>載入中...</div>}
      {!loading&&filtered.length===0&&<div style={{textAlign:'center',padding:32,color:C.muted,background:C.white,borderRadius:8,border:`1px solid ${C.border}`}}>暫無記錄。請先生成分析。</div>}
      <div style={{display:'grid',gap:8}}>
        {filtered.map(r=>(
          <div key={r.id} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:6,marginBottom:4,flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{fontSize:10,fontWeight:700,color:C.navy,background:'#EFF6FF',padding:'2px 7px',borderRadius:3}}>{r.sport||'—'}</span>
                  <span style={{fontSize:10,fontWeight:800,padding:'2px 7px',borderRadius:3,background:{BET:'#ECFDF5',LEAN:'#FFFBEB',WAIT:'#F6F7FA'}[r.decision]||'#F6F7FA',color:{BET:C.win,LEAN:C.amber,WAIT:C.muted}[r.decision]||C.muted}}>{r.decision||'—'}</span>
                  <RB r={r.result}/>{r.createdAt&&<span style={{fontSize:10,color:C.muted}}>{new Date(r.createdAt.toDate?.()??r.createdAt).toLocaleDateString('zh-TW')}</span>}
                </div>
                <div style={{fontSize:14,fontWeight:700,color:C.dark}}>{r.home} vs {r.away}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>主勝 {r.nvH||'—'}% | EV {r.ev||'—'}% | 賠率 {r.odds?.h?.toFixed?.(2)||'—'}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4,minWidth:110}}>
                {(!r.result||r.result==='pending')&&r.decision==='BET'&&<>
                  <button onClick={()=>mark(r.id,'win')} disabled={updId===r.id} style={{padding:'5px 8px',border:'none',borderRadius:5,cursor:'pointer',background:'#ECFDF5',color:C.win,fontSize:11,fontWeight:700}}>{updId===r.id?'..':'✅ 命中'}</button>
                  <button onClick={()=>mark(r.id,'loss')} disabled={updId===r.id} style={{padding:'5px 8px',border:'none',borderRadius:5,cursor:'pointer',background:'#FEF2F2',color:C.loss,fontSize:11,fontWeight:700}}>{updId===r.id?'..':'❌ 未中'}</button>
                  <button onClick={()=>mark(r.id,'void')} disabled={updId===r.id} style={{padding:'5px 8px',border:'none',borderRadius:5,cursor:'pointer',background:'#F6F7FA',color:C.muted,fontSize:11,fontWeight:700}}>⭕ 無效</button>
                </>}
                {r.result&&r.result!=='pending'&&<button onClick={()=>mark(r.id,'pending')} style={{padding:'4px 8px',border:`1px solid ${C.border}`,borderRadius:5,cursor:'pointer',background:'transparent',color:C.muted,fontSize:10}}>重設</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
