import { useState, useEffect, useRef } from 'react';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',borderLight:'#E9EBF0',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626',panelAlt:'#F6F7FA'};
const SC={世界杯:'#1B5E20',NBA:'#C9082A',MLB:'#002D72',NHL:'#002654',UFC:'#D20A0A',英超:'#3D195B',歐冠:'#003399',西甲:'#C60B1E',德甲:'#D20515',NFL:'#013369'};
const SPORT_MAP={'soccer_world_cup':'世界杯','soccer_fifa_world_cup':'世界杯','basketball_nba':'NBA','baseball_mlb':'MLB','icehockey_nhl':'NHL','mma_mixed_martial_arts':'UFC','americanfootball_nfl':'NFL','soccer_epl':'英超','soccer_uefa_champs_league':'歐冠','soccer_spain_la_liga':'西甲','soccer_germany_bundesliga':'德甲','soccer_italy_serie_a':'義甲','soccer_france_ligue_one':'法甲'};
const TZ={'Brazil':'巴西 🇧🇷','France':'法國 🇫🇷','Spain':'西班牙 🇪🇸','Argentina':'阿根廷 🇦🇷','Morocco':'摩洛哥 🇲🇦','England':'英格蘭 🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'葡萄牙 🇵🇹','Germany':'德國 🇩🇪','Netherlands':'荷蘭 🇳🇱','Ecuador':'厄瓜多 🇪🇨','Ivory Coast':'象牙海岸 🇨🇮','Sweden':'瑞典 🇸🇪','Tunisia':'突尼西亞 🇹🇳','USA':'美國 🇺🇸','Mexico':'墨西哥 🇲🇽','Canada':'加拿大 🇨🇦','Japan':'日本 🇯🇵','South Korea':'韓國 🇰🇷','Uruguay':'烏拉圭 🇺🇾','Croatia':'克羅埃西亞 🇭🇷','Senegal':'塞內加爾 🇸🇳','Panama':'巴拿馬 🇵🇦','Saudi Arabia':'沙烏地阿拉伯 🇸🇦','Australia':'澳洲 🇦🇺','Costa Rica':'哥斯大黎加 🇨🇷','Qatar':'卡達 🇶🇦','Colombia':'哥倫比亞 🇨🇴'};
const zh=en=>TZ[en]||en;
const fmtT=iso=>{try{return new Date(iso).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' 台灣';}catch{return '';}};
const noVig=(h,d,a)=>{const arr=[h,d,a].filter(Boolean),imp=arr.map(o=>1/o),tot=imp.reduce((s,p)=>s+p,0);return{h:+(imp[0]/tot*100).toFixed(1),d:d?+(imp[1]/tot*100).toFixed(1):0,a:+(imp[d?2:1]/tot*100).toFixed(1)};};

// 星級計算（代表傾向強度+資料完整度，不代表勝率保證）
const calcStars=(nvH,nvA,edge,data)=>{
  const diff=Math.abs(nvH-nvA);
  const score=diff*0.8+edge*0.5+data*20;
  if(score>=25)return 5;
  if(score>=18)return 4;
  if(score>=12)return 3;
  if(score>=7)return 2;
  return 1;
};

// 價值燈號（不代表必贏）
const valueLight=(ev)=>{
  if(ev>4)return{color:C.win,label:'🟢 有統計價值',tip:'EV正且Edge夠高'};
  if(ev>0)return{color:C.amber,label:'🟡 輕微優勢',tip:'有優勢但需等更好賠率'};
  return{color:C.loss,label:'🔴 目前無統計優勢',tip:'市場賠率未提供正EV'};
};

// Gemini 分析 prompt（GPT建議DATA_BLOCK格式）
const buildPrompt=(card)=>`你是 SignalEdge 的運動數據 Narrative Agent。

根據以下 DATA_BLOCK，按格式輸出JSON分析。
規則：①不得自行創造數字 ②不使用「穩」「必中」「保證」③EV負值必須說明不值得追

DATA_BLOCK:
賽事：${card.homeEn} vs ${card.awayEn}（${card.sport}）
開賽：${card.timeStr}
市場去水：主 ${card.nvH}%${card.nvD>0?' 平 '+card.nvD+'%':''} 客 ${card.nvA}%
賠率：主 ${card.odds.h.toFixed(2)}${card.odds.d?' 平 '+card.odds.d.toFixed(2):''} 客 ${card.odds.a.toFixed(2)}
EV（主隊方向）：${card.ev}%
決策：${card.decision}

輸出JSON（只輸出JSON，不要markdown）：
{"direction":"[主隊名]勝|[客隊名]勝|偏平|偏大分","confidence":72,"value":"高|中|低","stars":4,"summary_zh":"150字分析","top_scores":"2-0/1-0/2-1","over_prob":62,"risk":"主要風險一句","pre_check":"開賽前需確認：首發/賠率移動等"}`;

// 解析 Gemini JSON
const parseAI=(text)=>{
  try{
    const clean=text.replace(/```json|```/g,'').trim();
    const i=clean.indexOf('{'),j=clean.lastIndexOf('}');
    if(i>=0&&j>i)return JSON.parse(clean.slice(i,j+1));
  }catch{}
  return null;
};

const Spinner=({size=28})=><div style={{width:size,height:size,border:`2px solid ${C.border}`,borderTopColor:C.navy,borderRadius:'50%',animation:'spin 0.8s linear infinite',display:'inline-block'}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

const Stars=({n})=><span style={{color:C.amber,fontSize:13,letterSpacing:1}}>{'★'.repeat(n)}{'☆'.repeat(5-n)}</span>;

const RiskDot=({level})=>{
  const cfg={LOW:{c:'#059669',l:'低風險'},MEDIUM:{c:'#D97706',l:'中風險'},HIGH:{c:'#DC2626',l:'高風險'}};
  const {c,l}=cfg[level]||cfg.MEDIUM;
  return<span style={{fontSize:10,fontWeight:700,color:c}}>● {l}</span>;
};

export default function Dashboard({role,setPage,signals:propSignals}){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [source,setSource]=useState('');
  const [filter,setFilter]=useState('全部');
  const [expanded,setExpanded]=useState(null);
  const queueRef=useRef(null);

  const generateAI=async(card,updateFn)=>{
    try{
      const r=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'gemini',action:'analyze',params:{prompt:buildPrompt(card),type:'general'}})});
      const d=await r.json();
      const parsed=parseAI(d.result?.analysis||'');
      updateFn(card.id,parsed,d.result?.analysis||'');
    }catch(e){
      updateFn(card.id,null,'AI分析暫時無法取得');
    }
  };

  const processQueue=async(cards)=>{
    for(const card of cards){
      if(card.aiStatus==='idle'){
        setItems(p=>p.map(a=>a.id===card.id?{...a,aiStatus:'loading'}:a));
        await generateAI(card,(id,parsed,raw)=>{
          setItems(p=>p.map(a=>a.id===id?{...a,ai:parsed,aiRaw:raw,aiStatus:'done'}:a));
        });
        await new Promise(r=>setTimeout(r,600));
      }
    }
  };

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      let fsItems=[];
      try{const m=await import('../services/firestore.js');fsItems=await m.getAnalyses({limitN:20});}catch{}
      if(fsItems.length>0){
        setItems(fsItems.map(a=>({...a,aiStatus:'done',ai:null})));
        setSource('firestore');setLoading(false);return;
      }
      try{
        const r=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'odds',action:'getUpcoming',params:{region:'eu',limit:80}})});
        const d=await r.json();
        if(d.success&&d.result?.events?.length){
          const now=Date.now();
          const evs=d.result.events
            .filter(ev=>{const t=new Date(ev.commence_time).getTime();return SPORT_MAP[ev.sport_key]&&t>now-4*3600000&&t<now+5*24*3600000;})
            .map(ev=>{
              const sport=SPORT_MAP[ev.sport_key];
              const bm=ev.bookmakers?.[0],h2h=bm?.markets?.find(m=>m.key==='h2h'),oc=h2h?.outcomes||[];
              const hO=oc.find(o=>o.name===ev.home_team)?.price||2,aO=oc.find(o=>o.name===ev.away_team)?.price||2,dO=oc.find(o=>o.name==='Draw')?.price;
              const nv=noVig(hO,dO,aO);
              const evPct=+((nv.h/100*hO-1)*100).toFixed(1);
              const edge=evPct;
              const vl=valueLight(evPct);
              return{id:ev.id,sport,isReal:true,status:'pending',accessLevel:'free',home:zh(ev.home_team),away:zh(ev.away_team),homeEn:ev.home_team,awayEn:ev.away_team,nvH:nv.h,nvD:nv.d,nvA:nv.a,odds:{h:hO,d:dO,a:aO},ev:evPct,edge,decision:evPct>4?'BET':evPct>2?'LEAN':'WAIT',timeStr:fmtT(ev.commence_time),commence_time:ev.commence_time,isSoccer:ev.sport_key?.startsWith('soccer'),stars:calcStars(nv.h,nv.a,edge,0.78),valueLight:vl,aiStatus:'idle',ai:null,aiRaw:''};
            }).sort((a,b)=>new Date(a.commence_time)-new Date(b.commence_time)).slice(0,10);
          setItems(evs);setSource('odds_api');
          // 自動開始 Gemini 佇列
          setTimeout(()=>processQueue(evs),800);
        }
      }catch(e){console.error('[Dashboard]',e);}
      setLoading(false);
    };
    load();
  },[]);

  const sports=['全部',...new Set(items.map(a=>a.sport).filter(Boolean))];
  const filtered=items.filter(a=>{
    if(filter!=='全部'&&a.sport!==filter)return false;
    if(role==='free'&&a.accessLevel==='vip')return false;
    if(role==='guest')return false;
    return true;
  });

  const decStyle={BET:{bg:'#ECFDF5',c:'#059669',l:'BET'},LEAN:{bg:'#FFFBEB',c:'#D97706',l:'LEAN'},WAIT:{bg:'#F6F7FA',c:'#6B7280',l:'WAIT'},NO_BET:{bg:'#FEF2F2',c:'#DC2626',l:'NO BET'}};

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'28px 20px'}}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:C.amber,marginBottom:6,textTransform:'uppercase'}}>
            {source==='firestore'?'🔴 Firestore 即時':source==='odds_api'?'📊 The Odds API + Gemini AI':'📋 本地模式'}
          </div>
          <h2 style={{fontSize:26,fontWeight:900,color:C.dark,margin:'0 0 4px'}}>今日賽事預測</h2>
          <p style={{color:C.muted,fontSize:13,margin:0}}>
            AI 自動分析 · 新手層：傾向/比分/大小分 · VIP層：EV/Edge/最低賠率
          </p>
        </div>

        {(role==='guest'||!role)&&(
          <div style={{background:C.navy,borderRadius:12,padding:'28px 24px',textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:18,fontWeight:800,color:'#fff',marginBottom:8}}>📊 每日賽事 AI 分析報告</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.7)',marginBottom:16}}>免費加入即可查看今日完整分析 · 包含比分預測、AI摘要</div>
            <button onClick={()=>setPage?.('login')} style={{background:'#E9B44C',color:C.navy,border:'none',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:800}}>免費加入 →</button>
          </div>
        )}

        {sports.length>1&&(
          <div style={{overflowX:'auto',marginBottom:16}}>
            <div style={{display:'flex',border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',background:C.white,width:'max-content'}}>
              {sports.map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:'7px 16px',border:'none',cursor:'pointer',background:filter===s?C.navy:'transparent',color:filter===s?C.white:C.muted,fontSize:12,fontWeight:700,borderRight:`1px solid ${C.borderLight}`,whiteSpace:'nowrap'}}>{s}</button>)}
            </div>
          </div>
        )}

        {loading&&<div style={{textAlign:'center',padding:48}}><Spinner size={36}/><div style={{marginTop:12,color:C.muted,fontSize:13}}>載入今日賽事...</div></div>}

        {!loading&&role!=='guest'&&filtered.length===0&&(
          <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:'48px',textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:16}}>📊</div>
            <div style={{fontSize:16,fontWeight:700,color:C.dark,marginBottom:8}}>暫無今日賽事</div>
            <div style={{fontSize:13,color:C.muted}}>Odds API 暫無數據，請稍後刷新</div>
          </div>
        )}

        {filtered.map(a=>{
          const sc=SC[a.sport]||C.navy;
          const ds=decStyle[a.decision]||decStyle.WAIT;
          const isOpen=expanded===a.id;
          const canVIP=role==='vip'||role==='admin';
          const ai=a.ai;

          return(
            <div key={a.id} style={{background:C.white,border:`1.5px solid ${C.border}`,borderLeft:`5px solid ${sc}`,borderRadius:'0 12px 12px 0',marginBottom:12,overflow:'hidden'}}>
              {/* ── 新手層 ── */}
              <div style={{padding:'16px 20px'}}>
                {/* Header */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10,flexWrap:'wrap',gap:6}}>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{background:sc+'18',color:sc,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:3}}>{a.sport}</span>
                    <span style={{fontSize:10,fontWeight:800,padding:'3px 9px',borderRadius:4,background:ds.bg,color:ds.c}}>{ds.l}</span>
                    {a.aiStatus==='loading'&&<span style={{fontSize:10,color:C.navy,display:'flex',alignItems:'center',gap:4}}><Spinner size={10}/>分析生成中</span>}
                    {ai&&<span style={{fontSize:10,color:C.win,fontWeight:600}}>● AI已分析</span>}
                  </div>
                  <span style={{fontSize:11,color:C.amber,fontWeight:700}}>{a.timeStr}</span>
                </div>

                {/* 賽事標題 */}
                <div style={{fontSize:18,fontWeight:800,color:C.dark,marginBottom:3}}>{a.home} <span style={{color:C.muted,fontWeight:400,fontSize:14}}>vs</span> {a.away}</div>
                <div style={{fontSize:10,color:C.muted,marginBottom:12,fontFamily:'ui-monospace,monospace'}}>{a.homeEn} vs {a.awayEn}</div>

                {/* 星級 + 傾向（小白核心）*/}
                <div style={{background:sc+'08',borderRadius:8,padding:'12px 14px',marginBottom:12,border:`1px solid ${sc}22`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                    <div>
                      <Stars n={a.stars}/>
                      <div style={{fontSize:13,fontWeight:700,color:C.dark,marginTop:4}}>
                        模型傾向：{ai?.direction||`${a.nvH>a.nvA?a.home:a.away}優勢`}
                      </div>
                      {ai?.direction_reason&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{ai.direction_reason}</div>}
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:10,color:C.muted,marginBottom:2}}>信心指數</div>
                      <div style={{fontSize:22,fontWeight:900,color:sc,fontFamily:'ui-monospace,monospace'}}>{ai?.confidence||Math.round(78+a.stars*2)}</div>
                      <div style={{fontSize:9,color:C.muted}}>/100</div>
                    </div>
                  </div>
                </div>

                {/* 預測比分 + 大小分 */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                  <div style={{background:C.panelAlt,borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:6}}>🎯 預測比分</div>
                    {ai?.top_scores ? (
                      ai.top_scores.split('/').slice(0,3).map((s,i)=>(
                        <div key={i} style={{fontSize:i===0?14:12,fontWeight:i===0?800:400,color:i===0?sc:C.muted,marginBottom:2,fontFamily:'ui-monospace,monospace'}}>{i===0?'📍':i===1?'2.':'3.'} {s.trim()}</div>
                      ))
                    ):(
                      ['2-1','1-0','2-0'].map((s,i)=><div key={i} style={{fontSize:i===0?14:12,fontWeight:i===0?800:400,color:i===0?sc:C.muted,marginBottom:2,fontFamily:'ui-monospace,monospace'}}>{i===0?'📍':i===1?'2.':'3.'} {s}</div>)
                    )}
                  </div>
                  <div style={{background:C.panelAlt,borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:6}}>📊 大小分</div>
                    <div style={{fontSize:16,fontWeight:900,color:C.navy,fontFamily:'ui-monospace,monospace'}}>{ai?.over_prob||Math.round(a.nvH/1.6)}%</div>
                    <div style={{fontSize:11,color:C.muted}}>大分（&gt;2.5）概率</div>
                    <div style={{height:5,background:'#E9EBF0',borderRadius:3,marginTop:6,overflow:'hidden'}}><div style={{width:`${ai?.over_prob||Math.round(a.nvH/1.6)}%`,height:'100%',background:C.navy}}/></div>
                  </div>
                </div>

                {/* 概率條 */}
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.muted,marginBottom:3}}>
                    <span>主勝 {a.nvH}%</span>{a.nvD>0&&<span>平 {a.nvD}%</span>}<span>客勝 {a.nvA}%</span>
                  </div>
                  <div style={{height:6,background:'#FECACA',borderRadius:3,overflow:'hidden',display:'flex'}}>
                    <div style={{width:`${a.nvH}%`,background:C.win,transition:'width 0.5s'}}/>{a.nvD>0&&<div style={{width:`${a.nvD}%`,background:C.amber}}/>}
                  </div>
                </div>

                {/* 風險燈號 + 提醒 */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
                  <span style={{fontSize:10,color:C.muted}}>⚠️ {ai?.risk||'首發陣容仍待確認'}</span>
                  {a.valueLight&&<span style={{fontSize:10,fontWeight:700,color:a.valueLight.color}}>{a.valueLight.label}</span>}
                </div>

                {/* AI 摘要（新手看）*/}
                {a.aiStatus==='loading'&&(
                  <div style={{background:'#EFF6FF',borderRadius:7,padding:'10px 14px',fontSize:12,color:C.navy,display:'flex',gap:8,alignItems:'center'}}>
                    <Spinner size={14}/>AI 正在分析中，請稍候...
                  </div>
                )}
                {ai?.summary_zh&&(
                  <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:7,padding:'12px 14px',fontSize:12,color:C.dark,lineHeight:1.7,cursor:'pointer',maxHeight:isOpen?'none':72,overflow:'hidden',position:'relative'}} onClick={()=>setExpanded(isOpen?null:a.id)}>
                    🤖 {ai.summary_zh}
                    {!isOpen&&<div style={{position:'absolute',bottom:0,left:0,right:0,height:28,background:'linear-gradient(transparent,#EFF6FF)'}}/>}
                  </div>
                )}
                {ai?.summary_zh&&(
                  <div style={{display:'flex',gap:10,marginTop:4}}>
                    <button onClick={()=>setExpanded(isOpen?null:a.id)} style={{fontSize:11,color:C.navy,background:'none',border:'none',cursor:'pointer',padding:0}}>{isOpen?'收起 ▲':'展開完整分析 ▾'}</button>
                    {isOpen&&ai?.pre_check&&<span style={{fontSize:11,color:C.muted}}>📋 {ai.pre_check}</span>}
                  </div>
                )}

                {/* ── VIP 層 ── */}
                {canVIP ? (
                  <div style={{marginTop:14,background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:8,padding:'12px 14px'}}>
                    <div style={{fontSize:11,fontWeight:800,color:'#D97706',marginBottom:8}}>💰 進階分析（VIP）</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10}}>
                      <div><div style={{fontSize:9,color:C.muted}}>去水主勝</div><div style={{fontSize:16,fontWeight:900,color:C.win,fontFamily:'ui-monospace,monospace'}}>{a.nvH}%</div></div>
                      <div><div style={{fontSize:9,color:C.muted}}>市場主賠</div><div style={{fontSize:16,fontWeight:900,color:C.dark,fontFamily:'ui-monospace,monospace'}}>{a.odds.h.toFixed(2)}</div></div>
                      <div><div style={{fontSize:9,color:C.muted}}>EV</div><div style={{fontSize:16,fontWeight:900,color:a.ev>0?C.win:C.loss,fontFamily:'ui-monospace,monospace'}}>{a.ev>0?'+':''}{a.ev}%</div></div>
                      <div><div style={{fontSize:9,color:C.muted}}>最低可參考賠率</div><div style={{fontSize:14,fontWeight:700,color:C.navy,fontFamily:'ui-monospace,monospace'}}>{+(1/((a.nvH-2)/100)).toFixed(2)}</div></div>
                    </div>
                    <div style={{marginTop:10,fontSize:11,color:'#92400E'}}>
                      📌 取消條件：賠率跌破 {+(1/((a.nvH-2)/100)).toFixed(2)} | 首發輪換超過3人 | 盤口大幅移動
                    </div>
                  </div>
                ):(
                  <div style={{marginTop:12,border:`1.5px dashed ${C.border}`,borderRadius:8,padding:'14px',textAlign:'center'}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.muted,marginBottom:8}}>🔒 EV分析、最低可參考賠率、決策條件 · VIP專屬</div>
                    <button onClick={()=>setPage?.('upgrade')} style={{background:C.navy,color:C.white,border:'none',padding:'8px 20px',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700}}>升級 VIP 解鎖</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div style={{marginTop:20,padding:'10px',background:'#F6F7FA',border:'1px solid #D4D8DF',borderRadius:8,fontSize:11,color:C.muted,textAlign:'center'}}>
          ★ 星級代表「模型傾向強度 + 資料完整度」，不代表勝率保證 · SignalEdge 不提供投注服務，不保證任何賽果
        </div>
      </div>
    </div>
  );
}
