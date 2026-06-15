import { useState, useEffect } from 'react';
const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626'};
const SC={世界杯:'#1B5E20',NBA:'#C9082A',MLB:'#002D72',英超:'#3D195B',歐冠:'#003399',UFC:'#D20A0A'};
const SPORT_MAP={'soccer_world_cup':'世界杯','soccer_fifa_world_cup':'世界杯','basketball_nba':'NBA','baseball_mlb':'MLB','mma_mixed_martial_arts':'UFC','soccer_epl':'英超','soccer_uefa_champs_league':'歐冠','soccer_spain_la_liga':'西甲','soccer_germany_bundesliga':'德甲'};
const TZ={'Brazil':'巴西 🇧🇷','France':'法國 🇫🇷','Spain':'西班牙 🇪🇸','Argentina':'阿根廷 🇦🇷','Morocco':'摩洛哥 🇲🇦','England':'英格蘭 🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'葡萄牙 🇵🇹','Germany':'德國 🇩🇪','Netherlands':'荷蘭 🇳🇱','Uruguay':'烏拉圭 🇺🇾','Saudi Arabia':'沙烏地阿拉伯 🇸🇦','USA':'美國 🇺🇸','Mexico':'墨西哥 🇲🇽'};
const zh=en=>TZ[en]||en;
const noVig=(h,d,a)=>{const arr=[h,d,a].filter(Boolean),imp=arr.map(o=>1/o),tot=imp.reduce((s,p)=>s+p,0);return{h:+(imp[0]/tot*100).toFixed(1),a:+(imp[d?2:1]/tot*100).toFixed(1)};};

export default function LandingPage({setPage}){
  const [previews,setPreviews]=useState([]);
  const [stats,setStats]=useState({total:0,hitRate:0});
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    (async()=>{
      try{
        const mod=await import('../services/firestore.js');
        const fs=await mod.getAnalyses?.({limitN:20,accessLevel:'free'});
        if(fs?.length){
          setPreviews(fs.slice(0,3));
          const settled=(fs||[]).filter(a=>a.result==='win'||a.result==='loss');
          const wins=settled.filter(a=>a.result==='win').length;
          setStats({total:fs.length,hitRate:settled.length?+(wins/settled.length*100).toFixed(1):0});
          setReady(true);return;
        }
      }catch{}
      try{
        const r=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'odds',action:'getUpcoming',params:{region:'eu',limit:20}})});
        const data=await r.json();
        if(data.success&&data.result?.events?.length){
          const now=Date.now();
          const evs=data.result.events.filter(ev=>SPORT_MAP[ev.sport_key]&&new Date(ev.commence_time).getTime()>now).slice(0,3).map(ev=>{
            const sp=SPORT_MAP[ev.sport_key],bm=ev.bookmakers?.[0],oc=bm?.markets?.find(m=>m.key==='h2h')?.outcomes||[];
            const hO=oc.find(o=>o.name===ev.home_team)?.price||2,aO=oc.find(o=>o.name===ev.away_team)?.price||2,dO=oc.find(o=>o.name==='Draw')?.price;
            const nv=noVig(hO,dO,aO),evP=+((nv.h/100*hO-1)*100).toFixed(1);
            return{id:ev.id,sport:sp,home:zh(ev.home_team),away:zh(ev.away_team),nvH:nv.h,nvA:nv.a,ev:evP,decision:evP>4?'BET':evP>2?'LEAN':'WAIT',stars:Math.max(2,Math.min(5,Math.round(3+evP/3)))};
          });
          setPreviews(evs);
        }
      }catch{}
      setReady(true);
    })();
  },[]);

  const DS={BET:'#059669',LEAN:'#D97706',WAIT:'#6B7280'};
  const FEATS=[{icon:'📊',t:'多平台賠率比對',d:'整合 10+ 家賠率，找出去水後最佳價格'},{icon:'🤖',t:'AI 深度分析',d:'AI 生成中文分析，非人工喊單'},{icon:'💰',t:'EV 期望值',d:'量化每場投注的預期報酬'},{icon:'🎮',t:'6+ 項運動',d:'世界杯・NBA・MLB・電競・UFC・英超'},{icon:'📈',t:'Polymarket 比對',d:'整合預測市場，找出定價失誤'},{icon:'🇹🇼',t:'台灣運彩對照',d:'與官方合法賠率比對，完全合規'}];

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      <div style={{background:C.navy,padding:'60px 20px 80px',textAlign:'center'}}>
        <div style={{maxWidth:760,margin:'0 auto'}}>
          <div style={{fontSize:11,fontWeight:700,color:C.amber,letterSpacing:2,marginBottom:14,textTransform:'uppercase'}}>台灣首個 AI 運動數據分析研究平台</div>
          <h1 style={{fontSize:'clamp(28px,5vw,48px)',fontWeight:900,color:C.white,margin:'0 0 16px',lineHeight:1.2}}>用<span style={{color:C.amber}}>數學模型</span>看穿市場定價</h1>
          <p style={{color:'rgba(255,255,255,0.7)',fontSize:15,margin:'0 0 32px',lineHeight:1.7}}>整合 Polymarket 預測市場、多平台賠率比對、台灣運彩官方數據。所有輸出為統計參數，不提供投注建議。</p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={()=>setPage('login')} style={{background:C.amber,color:C.navy,border:'none',padding:'14px 32px',borderRadius:8,cursor:'pointer',fontSize:16,fontWeight:800}}>免費開始使用</button>
            <button onClick={()=>setPage('calendar')} style={{background:'rgba(255,255,255,0.1)',color:C.white,border:'1px solid rgba(255,255,255,0.3)',padding:'14px 32px',borderRadius:8,cursor:'pointer',fontSize:16,fontWeight:600}}>查看今日賽程</button>
          </div>
        </div>
      </div>

      <div style={{background:C.white,padding:'24px 20px',borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:900,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:20,textAlign:'center'}}>
          {[{l:'累計分析報告',v:stats.total||'—',s:'份'},{l:'模型命中率',v:stats.hitRate||'—',s:'%',c:C.win},{l:'覆蓋運動',v:6,s:'項'},{l:'台灣運彩比對',v:'✓',s:'',c:C.win}].map(s=>(
            <div key={s.l}><div style={{fontSize:32,fontWeight:900,color:s.c||C.dark}}>{s.v}<span style={{fontSize:16}}>{s.s}</span></div><div style={{fontSize:12,color:C.muted,marginTop:4}}>{s.l}</div></div>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1000,margin:'0 auto',padding:'40px 20px'}}>
        <div style={{fontSize:11,fontWeight:700,color:C.amber,letterSpacing:2,marginBottom:8,textTransform:'uppercase'}}>今日精選賽事</div>
        <h2 style={{fontSize:24,fontWeight:900,color:C.dark,margin:'0 0 20px'}}>即時賽前模型評估</h2>
        {!ready?(<div style={{textAlign:'center',padding:32,color:C.muted}}>載入中...</div>):(
          <div style={{display:'grid',gap:10,marginBottom:32}}>
            {previews.length===0&&<div style={{background:C.white,borderRadius:8,padding:24,textAlign:'center',color:C.muted,border:`1px solid ${C.border}`}}>今日暫無精選賽事，稍後更新</div>}
            {previews.map(a=>{
              const sc=SC[a.sport]||C.navy;
              return(
                <div key={a.id} style={{background:C.white,border:`1.5px solid ${C.border}`,borderLeft:`5px solid ${sc}`,borderRadius:'0 10px 10px 0',padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
                  <div>
                    <div style={{display:'flex',gap:8,marginBottom:6,alignItems:'center'}}>
                      <span style={{background:sc+'18',color:sc,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:3}}>{a.sport}</span>
                      <span style={{fontSize:10,fontWeight:800,padding:'2px 8px',borderRadius:4,background:DS[a.decision]+'18',color:DS[a.decision]}}>{a.decision}</span>
                      <span style={{color:C.amber,fontSize:13}}>{'★'.repeat(a.stars||3)}{'☆'.repeat(5-(a.stars||3))}</span>
                    </div>
                    <div style={{fontSize:16,fontWeight:800,color:C.dark}}>{a.home} vs {a.away}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11,color:C.muted}}>去水主勝</div>
                    <div style={{fontSize:22,fontWeight:900,color:C.win}}>{a.nvH}%</div>
                    <div style={{fontSize:11,color:a.ev>0?C.win:C.loss}}>EV {a.ev>0?'+':''}{a.ev}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:14,color:C.muted,marginBottom:16}}>登入後查看所有賽事完整分析、AI 深度報告與 EV 數據</div>
          <button onClick={()=>setPage('login')} style={{background:C.navy,color:C.white,border:'none',padding:'14px 40px',borderRadius:8,cursor:'pointer',fontSize:15,fontWeight:800}}>免費加入 →</button>
        </div>
        <h2 style={{fontSize:22,fontWeight:900,color:C.dark,margin:'0 0 20px'}}>為什麼選擇 SignalEdge？</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14,marginBottom:40}}>
          {FEATS.map(f=><div key={f.t} style={{background:C.white,borderRadius:10,padding:'18px 16px',border:`1px solid ${C.border}`}}><div style={{fontSize:28,marginBottom:8}}>{f.icon}</div><div style={{fontSize:14,fontWeight:700,color:C.dark,marginBottom:6}}>{f.t}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{f.d}</div></div>)}
        </div>
        <div style={{background:'#F6F7FA',borderRadius:8,padding:'14px 18px',border:`1px solid ${C.border}`,fontSize:11,color:C.muted,lineHeight:1.8}}>⚠️ 免責聲明：SignalEdge 提供運動賽事統計數據與機率模型參數，所有內容僅供教學與研究參考，不構成投注建議。台灣法規限制，本平台不提供下注服務，不設外站跳轉。使用者需自行承擔所有決策風險，18歲以下請勿使用。</div>
      </div>
    </div>
  );
}
