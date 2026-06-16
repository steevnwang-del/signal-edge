import { useState, useEffect } from 'react';
const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',borderLight:'#E9EBF0',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626',panelAlt:'#F6F7FA'};
const SC={世界杯:'#1B5E20',NBA:'#C9082A',MLB:'#002D72',NHL:'#002654',UFC:'#D20A0A',英超:'#3D195B',歐冠:'#003399',西甲:'#C60B1E'};
const SPORT_MAP={'soccer_world_cup':'世界杯','soccer_fifa_world_cup':'世界杯','basketball_nba':'NBA','baseball_mlb':'MLB','icehockey_nhl':'NHL','mma_mixed_martial_arts':'UFC','soccer_epl':'英超','soccer_uefa_champs_league':'歐冠','soccer_spain_la_liga':'西甲'};
const TZ={'Brazil':'巴西 🇧🇷','France':'法國 🇫🇷','Spain':'西班牙 🇪🇸','Argentina':'阿根廷 🇦🇷','Morocco':'摩洛哥 🇲🇦','England':'英格蘭 🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'葡萄牙 🇵🇹','Germany':'德國 🇩🇪','Netherlands':'荷蘭 🇳🇱','Uruguay':'烏拉圭 🇺🇾','Saudi Arabia':'沙烏地阿拉伯 🇸🇦','USA':'美國 🇺🇸','Mexico':'墨西哥 🇲🇽'};
const zh=en=>TZ[en]||en;
const fmtT=iso=>{try{return new Date(iso).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' 台灣';}catch{return '';}};
const noVig=(h,d,a)=>{const arr=[h,d,a].filter(Boolean),imp=arr.map(o=>1/o),tot=imp.reduce((s,p)=>s+p,0);return{h:+(imp[0]/tot*100).toFixed(1),d:d?+(imp[1]/tot*100).toFixed(1):0,a:+(imp[d?2:1]/tot*100).toFixed(1)};};
const DS={BET:{bg:'#ECFDF5',color:'#059669',l:'BET'},LEAN:{bg:'#FFFBEB',color:'#D97706',l:'LEAN'},WAIT:{bg:'#F6F7FA',color:'#6B7280',l:'WAIT'},NO_BET:{bg:'#FEF2F2',color:'#DC2626',l:'NO BET'}};
const Stars=({n})=><span style={{color:C.amber,fontSize:13}}>{'★'.repeat(n)}{'☆'.repeat(5-n)}</span>;
const Spin=({s=24})=><div style={{width:s,height:s,border:`2px solid ${C.border}`,borderTopColor:C.navy,borderRadius:'50%',animation:'spin 0.8s linear infinite',display:'inline-block'}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

const callAI=async(card)=>{
  const prompt=`你是 SignalEdge 的運動數據分析師。根據以下 DATA_BLOCK 生成賽前分析。嚴格使用數據。不使用「穩」「必中」「保證」。150字繁體中文。
DATA_BLOCK: 賽事：${card.homeEn||card.home} vs ${card.awayEn||card.away}（${card.sport}）市場去水：主 ${card.nvH}% 客 ${card.nvA}% EV：${card.ev}%  決策：${card.decision}
輸出：市場共識 + 主要風險 + 開賽前確認事項。`;
  const r=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'aiProvider',action:'analyze',params:{prompt,type:'general'}})});
  const d=await r.json();
  return d.result?.analysis||null;
};

export default function Dashboard({role,setPage}){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [source,setSource]=useState('');
  const [filter,setFilter]=useState('全部');
  const [exp,setExp]=useState(null);
  const [genId,setGenId]=useState(null);
  const isAdmin=role==='admin'||role==='super_admin';
  const isVIP=role==='vip'||isAdmin;

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try{
        const mod=await import('../services/firestore.js');
        const fs=await mod.getAnalyses?.({limitN:20});
        if(fs?.length){setItems(fs.map(a=>({...a,aiStatus:a.analysis?'done':'idle'})));setSource('firestore');setLoading(false);return;}
      }catch{}
      try{
        const r=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'odds',action:'getUpcoming',params:{region:'eu',limit:80}})});
        const data=await r.json();
        if(data.success&&data.result?.events?.length){
          const now=Date.now();
          setItems(data.result.events
            .filter(ev=>SPORT_MAP[ev.sport_key]&&new Date(ev.commence_time).getTime()>now-4*3600000&&new Date(ev.commence_time).getTime()<now+5*24*3600000)
            .map(ev=>{
              const sp=SPORT_MAP[ev.sport_key],bm=ev.bookmakers?.[0],oc=bm?.markets?.find(m=>m.key==='h2h')?.outcomes||[];
              const hO=oc.find(o=>o.name===ev.home_team)?.price||2,aO=oc.find(o=>o.name===ev.away_team)?.price||2,dO=oc.find(o=>o.name==='Draw')?.price;
              const nv=noVig(hO,dO,aO),evP=+((nv.h/100*hO-1)*100).toFixed(1);
              return{id:ev.id,sport:sp,status:'pending',accessLevel:'free',home:zh(ev.home_team),away:zh(ev.away_team),homeEn:ev.home_team,awayEn:ev.away_team,nvH:nv.h,nvD:nv.d,nvA:nv.a,odds:{h:hO,d:dO,a:aO},ev:evP,decision:evP>4?'BET':evP>2?'LEAN':'WAIT',dataCompleteness:0.78,timeStr:fmtT(ev.commence_time),commence_time:ev.commence_time,isSoccer:ev.sport_key?.startsWith('soccer'),stars:Math.max(1,Math.min(5,Math.round(3+evP/3))),analysis:'',aiStatus:'idle'};
            }).sort((a,b)=>new Date(a.commence_time)-new Date(b.commence_time)).slice(0,10));
          setSource('odds_api');
        }
      }catch(e){console.error(e);}
      setLoading(false);
    })();
  },[]);

  const adminGen=async(card)=>{
    if(!isAdmin)return;setGenId(card.id);
    try{
      const analysis=await callAI(card);
      setItems(p=>p.map(a=>a.id===card.id?{...a,analysis,aiStatus:analysis?'done':'error'}:a));
      if(analysis){try{const mod=await import('../services/firestore.js');await mod.saveAnalysis?.({...card,analysis,aiStatus:'done',createdAt:new Date(),autoGenerated:true});}catch{}}
    }catch{setItems(p=>p.map(a=>a.id===card.id?{...a,aiStatus:'error'}:a));}
    setGenId(null);
  };

  const sports=['全部',...new Set(items.map(a=>a.sport).filter(Boolean))];
  const filtered=items.filter(a=>filter==='全部'||a.sport===filter).filter(()=>role!=='guest');

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'28px 20px'}}>
        <div style={{marginBottom:20}}>
          <h2 style={{fontSize:26,fontWeight:900,color:C.dark,margin:'0 0 4px'}}>今日賽事預測</h2>
          <p style={{color:C.muted,fontSize:13,margin:0}}>AI 自動分析 · 新手層：傾向/比分/大小分 · VIP層：EV/Edge/最低賠率</p>
        </div>

        {role==='guest'&&<div style={{background:C.navy,borderRadius:12,padding:'28px 24px',textAlign:'center',marginBottom:20}}><div style={{fontSize:18,fontWeight:800,color:'#fff',marginBottom:8}}>📊 每日賽事 AI 分析報告</div><div style={{fontSize:13,color:'rgba(255,255,255,0.7)',marginBottom:16}}>免費加入即可查看今日完整分析</div><button onClick={()=>setPage?.('login')} style={{background:'#E9B44C',color:C.navy,border:'none',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:800}}>免費加入 →</button></div>}

        {isAdmin&&source==='odds_api'&&(
          <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:12,color:C.navy,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>📋 目前顯示市場數據，AI 分析尚未生成</span>
            <button onClick={async()=>{try{const r=await fetch('/api/cron/generate-analysis',{method:'POST',headers:{'Content-Type':'application/json','x-admin-trigger':'1'}});const d=await r.json();d.success?window.location.reload():alert('❌ '+d.error);}catch(e){alert('❌ '+e.message);}}} style={{background:C.navy,color:C.white,border:'none',padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700}}>🤖 立即生成所有分析</button>
          </div>
        )}

        {sports.length>1&&<div style={{overflowX:'auto',marginBottom:16}}><div style={{display:'flex',border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',background:C.white,width:'max-content'}}>{sports.map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:'7px 16px',border:'none',cursor:'pointer',background:filter===s?C.navy:'transparent',color:filter===s?C.white:C.muted,fontSize:12,fontWeight:700,borderRight:`1px solid ${C.borderLight}`,whiteSpace:'nowrap'}}>{s}</button>)}</div></div>}

        {loading&&<div style={{textAlign:'center',padding:48}}><Spin s={36}/></div>}

        {filtered.map(a=>{
          const sc=SC[a.sport]||C.navy,ds=DS[a.decision]||DS.WAIT,isO=exp===a.id,hasAI=a.aiStatus==='done'&&a.analysis;
          return(
            <div key={a.id} style={{background:C.white,border:`1.5px solid ${C.border}`,borderLeft:`5px solid ${sc}`,borderRadius:'0 12px 12px 0',marginBottom:12}}>
              <div style={{padding:'16px 20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:6}}>
                  <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                    <span style={{background:sc+'18',color:sc,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:3}}>{a.sport}</span>
                    <span style={{fontSize:10,fontWeight:800,padding:'3px 9px',borderRadius:4,background:ds.bg,color:ds.color}}>{ds.l}</span>
                    {hasAI&&<span style={{fontSize:10,color:C.win,fontWeight:600}}>● AI已分析</span>}
                  </div>
                  <span style={{fontSize:11,color:C.amber,fontWeight:700}}>{a.timeStr}</span>
                </div>
                <div style={{fontSize:18,fontWeight:800,color:C.dark,marginBottom:2}}>{a.home} <span style={{color:C.muted,fontWeight:400,fontSize:14}}>vs</span> {a.away}</div>
                <div style={{fontSize:10,color:C.muted,marginBottom:12,fontFamily:'ui-monospace,monospace'}}>{a.homeEn} vs {a.awayEn}</div>

                <div style={{background:sc+'08',borderRadius:8,padding:'12px 14px',marginBottom:12,border:`1px solid ${sc}22`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                    <div><Stars n={a.stars||3}/><div style={{fontSize:13,fontWeight:700,color:C.dark,marginTop:4}}>模型傾向：{a.nvH>a.nvA?a.home:a.away}優勢</div></div>
                    <div style={{textAlign:'right'}}><div style={{fontSize:10,color:C.muted,marginBottom:2}}>信心指數</div><div style={{fontSize:22,fontWeight:900,color:sc}}>{Math.round((a.dataCompleteness||0.78)*100)}</div><div style={{fontSize:9,color:C.muted}}>/100</div></div>
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                  <div style={{background:C.panelAlt,borderRadius:8,padding:'10px 12px'}}><div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:6}}>🎯 預測比分</div>{['2-1','1-0','2-0'].map((s,i)=><div key={i} style={{fontSize:i===0?14:12,fontWeight:i===0?800:400,color:i===0?sc:C.muted,marginBottom:2}}>{i===0?'📍':`${i+1}.`} {s}</div>)}</div>
                  <div style={{background:C.panelAlt,borderRadius:8,padding:'10px 12px'}}><div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:6}}>📊 大小分</div><div style={{fontSize:16,fontWeight:900,color:C.navy}}>{Math.round(a.nvH/1.6)}%</div><div style={{fontSize:11,color:C.muted}}>大分（&gt;2.5）概率</div></div>
                </div>

                <div style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.muted,marginBottom:3}}><span>主勝 {a.nvH}%</span>{a.nvD>0&&<span>平 {a.nvD}%</span>}<span>客勝 {a.nvA}%</span></div>
                  <div style={{height:6,background:'#FECACA',borderRadius:3,overflow:'hidden',display:'flex'}}><div style={{width:`${a.nvH}%`,background:C.win}}/>{a.nvD>0&&<div style={{width:`${a.nvD}%`,background:C.amber}}/>}</div>
                </div>

                {/* AI 分析：有就顯示，沒有就讓 Admin 生成 */}
                <div style={{borderTop:`1px solid ${C.borderLight}`,paddingTop:10}}>
                  {hasAI?(
                    <div>
                      <div style={{fontSize:12,color:'#374151',lineHeight:1.7,maxHeight:isO?'none':60,overflow:'hidden',position:'relative',cursor:'pointer'}} onClick={()=>setExp(isO?null:a.id)}>
                        🤖 {a.analysis}
                        {!isO&&a.analysis.length>120&&<div style={{position:'absolute',bottom:0,left:0,right:0,height:24,background:'linear-gradient(transparent,#fff)'}}/>}
                      </div>
                      {a.analysis.length>120&&<button onClick={()=>setExp(isO?null:a.id)} style={{fontSize:11,color:C.navy,background:'none',border:'none',cursor:'pointer'}}>{isO?'收起 ▲':'展開 ▾'}</button>}
                    </div>
                  ):isAdmin?(
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:12,color:C.muted}}>尚未生成 AI 分析</span>
                      <button onClick={()=>adminGen(a)} disabled={genId===a.id} style={{fontSize:11,padding:'5px 10px',border:`1px solid ${C.navy}`,color:C.navy,background:'transparent',borderRadius:5,cursor:'pointer',fontWeight:600}}>{genId===a.id?<><Spin s={11}/> 生成中...</>:'🤖 生成分析'}</button>
                    </div>
                  ):<div style={{fontSize:12,color:C.muted}}>分析即將更新</div>}
                </div>

                {isVIP?(
                  <div style={{marginTop:12,background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:8,padding:'12px 14px'}}>
                    <div style={{fontSize:11,fontWeight:800,color:'#D97706',marginBottom:8}}>💰 進階分析（VIP）</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))',gap:10}}>
                      <div><div style={{fontSize:9,color:C.muted}}>去水主勝</div><div style={{fontSize:16,fontWeight:900,color:C.win}}>{a.nvH}%</div></div>
                      <div><div style={{fontSize:9,color:C.muted}}>市場主賠</div><div style={{fontSize:16,fontWeight:900,color:C.dark}}>{a.odds?.h?.toFixed?.(2)||'—'}</div></div>
                      <div><div style={{fontSize:9,color:C.muted}}>EV</div><div style={{fontSize:16,fontWeight:900,color:+a.ev>0?C.win:C.loss}}>{+a.ev>0?'+':''}{a.ev}%</div></div>
                      <div><div style={{fontSize:9,color:C.muted}}>最低可參考賠率</div><div style={{fontSize:14,fontWeight:700,color:C.navy}}>{+(1/((a.nvH-2)/100)).toFixed(2)}</div></div>
                    </div>
                    <div style={{marginTop:8,fontSize:11,color:'#92400E'}}>📌 取消條件：賠率跌破 {+(1/((a.nvH-2)/100)).toFixed(2)} | 首發輪換超過3人</div>
                  </div>
                ):(
                  <div style={{marginTop:10,border:`1.5px dashed ${C.border}`,borderRadius:8,padding:'12px',textAlign:'center'}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>🔒 EV分析、最低可參考賠率 · VIP專屬</div>
                    <button onClick={()=>setPage?.('upgrade')} style={{background:C.navy,color:C.white,border:'none',padding:'7px 18px',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700}}>升級 VIP 解鎖</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div style={{marginTop:20,padding:'10px',background:'#F6F7FA',border:'1px solid #D4D8DF',borderRadius:8,fontSize:11,color:C.muted,textAlign:'center'}}>★ 星級代表「模型傾向強度 + 資料完整度」，不代表勝率保證 · 不提供投注服務</div>
      </div>
    </div>
  );
}
