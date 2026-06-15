import { useState } from 'react';
const C={navy:'#0F3460',white:'#FFFFFF',amber:'#D97706',win:'#059669',loss:'#DC2626',muted:'#6B7280'};
export default function ShareCard({analysis}){
  const [show,setShow]=useState(false);const [sharing,setSharing]=useState(false);
  if(!analysis)return null;
  const{home,away,sport,decision,nvH,nvA,stars,ev}=analysis;
  const DS={BET:{c:'#059669',l:'BET'},LEAN:{c:'#D97706',l:'LEAN'},WAIT:{c:'#6B7280',l:'WAIT'}};const d=DS[decision]||DS.WAIT;
  const share=async()=>{
    setSharing(true);
    try{
      const text=`📊 SignalEdge 賽事分析\n\n${home} vs ${away}（${sport}）\n決策：${d.l}\n去水主勝：${nvH}%  客勝：${nvA}%\nEV：${ev>0?'+':''}${ev}%\n${'★'.repeat(stars||3)}${'☆'.repeat(5-(stars||3))}\n\n⚠️ 僅供參考，不構成投注建議\n👉 signal-edge-hews.vercel.app`;
      if(navigator.share)await navigator.share({title:'SignalEdge',text,url:'https://signal-edge-hews.vercel.app'});
      else{await navigator.clipboard.writeText(text);alert('✅ 已複製！可貼到 IG / LINE');}
    }catch(e){if(e.name!=='AbortError')console.warn(e);}
    setSharing(false);
  };
  return(
    <div>
      <div style={{display:'flex',gap:8,marginTop:10}}>
        <button onClick={share} disabled={sharing} style={{padding:'7px 12px',border:`1px solid ${C.navy}`,borderRadius:6,cursor:'pointer',background:'transparent',color:C.navy,fontSize:12,fontWeight:700}}>📤 {sharing?'分享中...':'分享分析'}</button>
        <button onClick={()=>setShow(!show)} style={{padding:'7px 12px',border:'1px solid #E1306C',borderRadius:6,cursor:'pointer',background:'transparent',color:'#E1306C',fontSize:12,fontWeight:700}}>📸 IG 圖卡</button>
      </div>
      {show&&(
        <div style={{marginTop:12}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8}}>📸 截圖下方卡片 → 上傳 IG 限時動態</div>
          <div style={{background:`linear-gradient(135deg,${C.navy},#1a4a7a)`,borderRadius:16,padding:'24px',maxWidth:380}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:900,color:C.amber,letterSpacing:1}}>SIGNALEDGE</div>
              <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:4,background:d.c+'33',color:d.c,border:`1px solid ${d.c}`}}>{d.l}</span>
            </div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:4}}>{sport}</div>
            <div style={{fontSize:18,fontWeight:900,color:C.white}}>{home}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:4}}>vs</div>
            <div style={{fontSize:18,fontWeight:900,color:C.white,marginBottom:14}}>{away}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
              {[['主勝',nvH+'%','#22c55e'],['客勝',nvA+'%','#ef4444'],['EV',(ev>0?'+':'')+ev+'%',ev>0?'#22c55e':'#ef4444']].map(([k,v,col])=>(
                <div key={k} style={{background:'rgba(255,255,255,0.08)',borderRadius:6,padding:'7px',textAlign:'center'}}>
                  <div style={{fontSize:15,fontWeight:900,color:col}}>{v}</div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',marginTop:2}}>{k}</div>
                </div>
              ))}
            </div>
            <div style={{color:C.amber,fontSize:13,marginBottom:6}}>{'★'.repeat(stars||3)}{'☆'.repeat(5-(stars||3))}</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:8,lineHeight:1.5}}>⚠️ 僅供教學研究，不構成投注建議<br/>signal-edge-hews.vercel.app</div>
          </div>
          <button onClick={()=>setShow(false)} style={{marginTop:8,padding:'4px 10px',border:`1px solid ${C.muted}`,borderRadius:5,cursor:'pointer',background:'transparent',color:C.muted,fontSize:11}}>關閉</button>
        </div>
      )}
    </div>
  );
}
