import { useState, useEffect } from 'react';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',borderLight:'#E9EBF0',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626',panelAlt:'#F6F7FA'};
const SC={世界杯:'#1B5E20',NBA:'#C9082A',MLB:'#002D72',NHL:'#002654',UFC:'#D20A0A',英超:'#3D195B',歐冠:'#003399',西甲:'#C60B1E',德甲:'#D20515'};
const SPORT_MAP={'soccer_world_cup':'世界杯','soccer_fifa_world_cup':'世界杯','basketball_nba':'NBA','baseball_mlb':'MLB','icehockey_nhl':'NHL','mma_mixed_martial_arts':'UFC','americanfootball_nfl':'NFL','soccer_epl':'英超','soccer_uefa_champs_league':'歐冠','soccer_spain_la_liga':'西甲','soccer_germany_bundesliga':'德甲','soccer_italy_serie_a':'義甲','soccer_france_ligue_one':'法甲'};
const TZ={'Brazil':'巴西 🇧🇷','France':'法國 🇫🇷','Spain':'西班牙 🇪🇸','Argentina':'阿根廷 🇦🇷','Morocco':'摩洛哥 🇲🇦','England':'英格蘭 🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'葡萄牙 🇵🇹','Germany':'德國 🇩🇪','Netherlands':'荷蘭 🇳🇱','Ecuador':'厄瓜多 🇪🇨','Ivory Coast':'象牙海岸 🇨🇮','Sweden':'瑞典 🇸🇪','Tunisia':'突尼西亞 🇹🇳','USA':'美國 🇺🇸','Mexico':'墨西哥 🇲🇽','Canada':'加拿大 🇨🇦','Japan':'日本 🇯🇵','South Korea':'韓國 🇰🇷','Uruguay':'烏拉圭 🇺🇾','Croatia':'克羅埃西亞 🇭🇷','Senegal':'塞內加爾 🇸🇳','Panama':'巴拿馬 🇵🇦','Saudi Arabia':'沙烏地阿拉伯 🇸🇦','Colombia':'哥倫比亞 🇨🇴'};
const zh=en=>TZ[en]||en;
const fmtT=iso=>{try{return new Date(iso).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' 台灣';}catch{return '';}};
const noVig=(h,d,a)=>{const arr=[h,d,a].filter(Boolean),imp=arr.map(o=>1/o),tot=imp.reduce((s,p)=>s+p,0);return{h:+(imp[0]/tot*100).toFixed(1),d:d?+(imp[1]/tot*100).toFixed(1):0,a:+(imp[d?2:1]/tot*100).toFixed(1)};};

const DS={BET:{bg:'#ECFDF5',color:'#059669',l:'BET'},LEAN:{bg:'#FFFBEB',color:'#D97706',l:'LEAN'},WAIT:{bg:'#F6F7FA',color:'#6B7280',l:'WAIT'},NO_BET:{bg:'#FEF2F2',color:'#DC2626',l:'NO BET'}};

const Stars=({n})=><span style={{color:C.amber,fontSize:13,letterSpacing:1}}>{'★'.repeat(n)}{'☆'.repeat(5-n)}</span>;
const Spinner=({size=28})=><div style={{width:size,height:size,border:`2px solid ${C.border}`,borderTopColor:C.navy,borderRadius:'50%',animation:'spin 0.8s linear infinite',display:'inline-block'}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

// 生成 AI 分析（只有 Admin 操作才呼叫，結果存 Firestore）
const generateSingleAI = async (card) => {
  const prompt=`你是 SignalEdge 的運動數據分析師。

根據以下 DATA_BLOCK 生成賽前分析。嚴格使用數據，不得自行創造數字。
不使用「穩」「必中」「保證」「鎖單」。150字繁體中文。

DATA_BLOCK:
賽事：${card.homeEn||card.home} vs ${card.awayEn||card.away}（${card.sport}）
市場去水：主 ${card.nvH}%${card.nvD>0?` 平 ${card.nvD}%`:''} 客 ${card.nvA}%
賠率：主 ${card.odds?.h?.toFixed?.(2)||'—'} 客 ${card.odds?.a?.toFixed?.(2)||'—'}
EV：${card.ev}%  決策：${card.decision}

輸出：主要分析 + 主要風險 + 開賽前確認事項。`;

  const r=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'gemini',action:'analyze',params:{prompt,type:'general'}})});
  const d=await r.json();
  return d.result?.analysis||'AI分析暫時無法取得';
};

export default function Dashboard({role,setPage,signals:propSignals}){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [source,setSource]=useState('');
  const [filter,setFilter]=useState('全部');
  const [expanded,setExpanded]=useState(null);
  const [generatingId,setGeneratingId]=useState(null); // Admin 手動生成某一場

  const isAdmin=role==='admin'||role==='super_admin';

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);

      // ── 第一優先：讀 Firestore（Admin 已生成的分析）────────────────
      try{
        const mod=await import('../services/firestore.js');
        const fsItems=await mod.getAnalyses({limitN:20});
        if(fsItems.length>0){
          setItems(fsItems.map(a=>({...a,aiStatus:'done'})));
          setSource('firestore');
          setLoading(false);
          return;
        }
      }catch(e){console.warn('[Dashboard] Firestore:',e.message);}

      // ── 第二：Firestore 空 → 從 Odds API 拿今日賽事 ──────────────
      // 注意：這裡只是「顯示賽事清單」，不自動呼叫 Gemini
      // Gemini 只由 Admin 手動觸發 或 Cron 自動跑
      try{
        const r=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'odds',action:'getUpcoming',params:{region:'eu',limit:80}})});
        const data=await r.json();
        if(data.success&&data.result?.events?.length){
          const now=Date.now();
          const evs=data.result.events
            .filter(ev=>{const t=new Date(ev.commence_time).getTime();return SPORT_MAP[ev.sport_key]&&t>now-4*3600000&&t<now+5*24*3600000;})
            .map(ev=>{
              const sport=SPORT_MAP[ev.sport_key];
              const bm=ev.bookmakers?.[0],h2h=bm?.markets?.find(m=>m.key==='h2h'),oc=h2h?.outcomes||[];
              const hO=oc.find(o=>o.name===ev.home_team)?.price||2,aO=oc.find(o=>o.name===ev.away_team)?.price||2,dO=oc.find(o=>o.name==='Draw')?.price;
              const nv=noVig(hO,dO,aO);
              const evPct=+((nv.h/100*hO-1)*100).toFixed(1);
              const decision=evPct>4?'BET':evPct>2?'LEAN':'WAIT';
              const stars=Math.max(1,Math.min(5,Math.round(3+evPct/3)));
              return{id:ev.id,sport,status:'pending',accessLevel:'free',home:zh(ev.home_team),away:zh(ev.away_team),homeEn:ev.home_team,awayEn:ev.away_team,nvH:nv.h,nvD:nv.d,nvA:nv.a,odds:{h:hO,d:dO,a:aO},ev:evPct,edge:0,decision,dataCompleteness:0.78,timeStr:fmtT(ev.commence_time),commence_time:ev.commence_time,isSoccer:ev.sport_key?.startsWith('soccer'),stars,
              // 重要：不自動生成，等 Admin 或 Cron 提供
              analysis:'', aiStatus:'idle'};
            })
            .sort((a,b)=>new Date(a.commence_time)-new Date(b.commence_time))
            .slice(0,10);
          setItems(evs);
          setSource('odds_api');
        }
      }catch(e){console.error('[Dashboard]',e);}
      setLoading(false);
    };
    load();
  },[]);

  // Admin 手動為單一場次生成分析（存 Firestore 讓所有人看到）
  const adminGenerateOne=async(card)=>{
    if(!isAdmin)return;
    setGeneratingId(card.id);
    try{
      const analysis=await generateSingleAI(card);
      // 更新本地狀態
      setItems(p=>p.map(a=>a.id===card.id?{...a,analysis,aiStatus:'done'}:a));
      // 存 Firestore → 所有用戶下次刷新就能看到
      try{
        const mod=await import('../services/firestore.js');
        await mod.saveAnalysis?.({
          ...card, analysis, aiStatus:'done',
          createdAt:new Date(), autoGenerated:true,
        });
      }catch(e){console.warn('Save to Firestore:',e.message);}
    }catch(e){
      setItems(p=>p.map(a=>a.id===card.id?{...a,analysis:'生成失敗：'+e.message,aiStatus:'error'}:a));
    }
    setGeneratingId(null);
  };

  const sports=['全部',...new Set(items.map(a=>a.sport).filter(Boolean))];
  const filtered=items.filter(a=>{
    if(filter!=='全部'&&a.sport!==filter)return false;
    if(role==='free'&&a.accessLevel==='vip')return false;
    if(role==='guest')return false;
    return true;
  });

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'28px 20px'}}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:C.amber,marginBottom:6,textTransform:'uppercase'}}>
            {source==='firestore'?'🔴 Firestore 即時':source==='odds_api'?'📊 The Odds API':'📋 本地模式'}
          </div>
          <h2 style={{fontSize:26,fontWeight:900,color:C.dark,margin:'0 0 4px'}}>今日賽事預測</h2>
          <p style={{color:C.muted,fontSize:13,margin:0}}>
            {source==='odds_api'?'分析由 Admin 定時生成 · 用戶無需等待 · 即時顯示':source==='firestore'?'Admin 建立的深度分析報告':'載入中'}
          </p>
        </div>

        {(role==='guest'||!role)&&(
          <div style={{background:C.navy,borderRadius:12,padding:'28px 24px',textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:18,fontWeight:800,color:'#fff',marginBottom:8}}>📊 每日賽事 AI 分析報告</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.7)',marginBottom:16}}>免費加入即可查看今日完整分析</div>
            <button onClick={()=>setPage?.('login')} style={{background:'#E9B44C',color:C.navy,border:'none',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:800}}>免費加入 →</button>
          </div>
        )}

        {isAdmin&&source==='odds_api'&&(
          <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:12,color:C.navy,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>📋 目前顯示市場賠率數據，AI分析尚未生成</span>
            <button onClick={async()=>{
              // 觸發批次生成（所有場次）
              const r=await fetch('/api/cron/generate-analysis',{method:'POST',headers:{'Content-Type':'application/json','x-admin-trigger':'1'}});
              const d=await r.json();
              if(d.success)alert(`✅ 已生成 ${d.generated} 場分析，刷新頁面即可看到`);
              else alert('❌ 生成失敗：'+d.error);
            }} style={{background:C.navy,color:C.white,border:'none',padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700}}>
              🤖 批次生成所有分析
            </button>
          </div>
        )}

        {sports.length>1&&(
          <div style={{overflowX:'auto',marginBottom:16}}>
            <div style={{display:'flex',border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',background:C.white,width:'max-content'}}>
              {sports.map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:'7px 16px',border:'none',cursor:'pointer',background:filter===s?C.navy:'transparent',color:filter===s?C.white:C.muted,fontSize:12,fontWeight:700,borderRight:`1px solid ${C.borderLight}`,whiteSpace:'nowrap'}}>{s}</button>)}
            </div>
          </div>
        )}

        {loading&&<div style={{textAlign:'center',padding:48}}><Spinner size={36}/><div style={{marginTop:10,color:C.muted}}>載入今日賽事...</div></div>}
        {!loading&&role!=='guest'&&filtered.length===0&&(
          <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:'48px',textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:16}}>📊</div>
            <div style={{fontSize:16,fontWeight:700,color:C.dark,marginBottom:8}}>暫無今日賽事</div>
          </div>
        )}

        {filtered.map(a=>{
          const sc=SC[a.sport]||C.navy;
          const ds=DS[a.decision]||DS.WAIT;
          const isOpen=expanded===a.id;
          const canVIP=role==='vip'||isAdmin;

          return(
            <div key={a.id} style={{background:C.white,border:`1.5px solid ${C.border}`,borderLeft:`5px solid ${sc}`,borderRadius:'0 12px 12px 0',marginBottom:12,overflow:'hidden'}}>
              <div style={{padding:'16px 20px'}}>
                {/* Header */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10,flexWrap:'wrap',gap:6}}>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{background:sc+'18',color:sc,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:3}}>{a.sport}</span>
                    <span style={{fontSize:10,fontWeight:800,padding:'3px 9px',borderRadius:4,background:ds.bg,color:ds.color}}>{ds.l}</span>
                    {a.aiStatus==='done'&&a.analysis&&<span style={{fontSize:10,color:C.win,fontWeight:600}}>● AI已分析</span>}
                  </div>
                  <span style={{fontSize:11,color:C.amber,fontWeight:700}}>{a.timeStr}</span>
                </div>

                {/* 比賽名稱 */}
                <div style={{fontSize:18,fontWeight:800,color:C.dark,marginBottom:2}}>{a.home} <span style={{color:C.muted,fontWeight:400,fontSize:14}}>vs</span> {a.away}</div>
                <div style={{fontSize:10,color:C.muted,marginBottom:12,fontFamily:'ui-monospace,monospace'}}>{a.homeEn} vs {a.awayEn}</div>

                {/* 星級 + 模型傾向 */}
                <div style={{background:sc+'08',borderRadius:8,padding:'12px 14px',marginBottom:12,border:`1px solid ${sc}22`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                    <div>
                      <Stars n={a.stars||3}/>
                      <div style={{fontSize:13,fontWeight:700,color:C.dark,marginTop:4}}>
                        模型傾向：{a.nvH>a.nvA?a.home:a.away}優勢
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:10,color:C.muted,marginBottom:2}}>信心指數</div>
                      <div style={{fontSize:22,fontWeight:900,color:sc,fontFamily:'ui-monospace,monospace'}}>{Math.round((a.dataCompleteness||0.78)*100)}</div>
                      <div style={{fontSize:9,color:C.muted}}>/100</div>
                    </div>
                  </div>
                </div>

                {/* 比分預測 + 大小分 */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                  <div style={{background:C.panelAlt,borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:6}}>🎯 預測比分</div>
                    {a.isSoccer?['2-1','1-0','2-0'].map((s,i)=><div key={i} style={{fontSize:i===0?14:12,fontWeight:i===0?800:400,color:i===0?sc:C.muted,marginBottom:2,fontFamily:'ui-monospace,monospace'}}>{i===0?'📍':i===1?'2.':'3.'} {s}</div>)
                    :['110-105','108-101','115-109'].map((s,i)=><div key={i} style={{fontSize:i===0?14:12,fontWeight:i===0?800:400,color:i===0?sc:C.muted,marginBottom:2,fontFamily:'ui-monospace,monospace'}}>{i===0?'📍':i===1?'2.':'3.'} {s}</div>)}
                  </div>
                  <div style={{background:C.panelAlt,borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:6}}>📊 大小分</div>
                    <div style={{fontSize:16,fontWeight:900,color:C.navy,fontFamily:'ui-monospace,monospace'}}>{Math.round(a.nvH/1.6)}%</div>
                    <div style={{fontSize:11,color:C.muted}}>大分（&gt;2.5）概率</div>
                  </div>
                </div>

                {/* 概率條 */}
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.muted,marginBottom:3}}>
                    <span>主勝 {a.nvH}%</span>{a.nvD>0&&<span>平 {a.nvD}%</span>}<span>客勝 {a.nvA}%</span>
                  </div>
                  <div style={{height:6,background:'#FECACA',borderRadius:3,overflow:'hidden',display:'flex'}}>
                    <div style={{width:`${a.nvH}%`,background:C.win}}/>{a.nvD>0&&<div style={{width:`${a.nvD}%`,background:C.amber}}/>}
                  </div>
                </div>

                {/* AI 分析（從 Firestore 讀，不由用戶觸發）*/}
                <div style={{borderTop:`1px solid ${C.borderLight}`,paddingTop:10}}>
                  {a.aiStatus==='done'&&a.analysis?(
                    <div>
                      <div style={{fontSize:12,color:'#374151',lineHeight:1.7,maxHeight:isOpen?'none':60,overflow:'hidden',position:'relative',cursor:'pointer'}} onClick={()=>setExpanded(isOpen?null:a.id)}>
                        🤖 {a.analysis}
                        {!isOpen&&a.analysis.length>120&&<div style={{position:'absolute',bottom:0,left:0,right:0,height:24,background:'linear-gradient(transparent,#fff)'}}/>}
                      </div>
                      {a.analysis.length>120&&(
                        <button onClick={()=>setExpanded(isOpen?null:a.id)} style={{fontSize:11,color:C.navy,background:'none',border:'none',cursor:'pointer',padding:'2px 0'}}>{isOpen?'收起 ▲':'展開完整分析 ▾'}</button>
                      )}
                    </div>
                  ):(
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:12,color:C.muted,fontStyle:'italic'}}>🤖 AI分析由每日 06:00 自動生成</span>
                      {/* 只有 Admin 看到手動生成按鈕 */}
                      {isAdmin&&(
                        <button onClick={()=>adminGenerateOne(a)} disabled={generatingId===a.id}
                          style={{fontSize:11,padding:'5px 10px',border:`1px solid ${C.navy}`,color:C.navy,background:'transparent',borderRadius:5,cursor:'pointer',fontWeight:600,opacity:generatingId===a.id?0.5:1}}>
                          {generatingId===a.id?<><Spinner size={11}/> 生成中...</>:'🤖 Admin 生成'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* VIP 層 */}
                {canVIP?(
                  <div style={{marginTop:12,background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:8,padding:'12px 14px'}}>
                    <div style={{fontSize:11,fontWeight:800,color:'#D97706',marginBottom:8}}>💰 進階分析（VIP）</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))',gap:10}}>
                      <div><div style={{fontSize:9,color:C.muted}}>去水主勝</div><div style={{fontSize:16,fontWeight:900,color:C.win,fontFamily:'ui-monospace,monospace'}}>{a.nvH}%</div></div>
                      <div><div style={{fontSize:9,color:C.muted}}>市場主賠</div><div style={{fontSize:16,fontWeight:900,color:C.dark,fontFamily:'ui-monospace,monospace'}}>{a.odds?.h?.toFixed?.(2)||'—'}</div></div>
                      <div><div style={{fontSize:9,color:C.muted}}>EV</div><div style={{fontSize:16,fontWeight:900,color:+a.ev>0?C.win:C.loss,fontFamily:'ui-monospace,monospace'}}>{+a.ev>0?'+':''}{a.ev}%</div></div>
                      <div><div style={{fontSize:9,color:C.muted}}>最低可參考賠率</div><div style={{fontSize:14,fontWeight:700,color:C.navy,fontFamily:'ui-monospace,monospace'}}>{+(1/((a.nvH-2)/100)).toFixed(2)}</div></div>
                    </div>
                    <div style={{marginTop:8,fontSize:11,color:'#92400E'}}>
                      📌 取消條件：賠率跌破 {+(1/((a.nvH-2)/100)).toFixed(2)} | 首發輪換超過3人
                    </div>
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

        <div style={{marginTop:20,padding:'10px',background:'#F6F7FA',border:'1px solid #D4D8DF',borderRadius:8,fontSize:11,color:C.muted,textAlign:'center'}}>
          ★ 星級代表「模型傾向強度 + 資料完整度」，不代表勝率保證 · 不提供投注服務
        </div>
      </div>
    </div>
  );
}
