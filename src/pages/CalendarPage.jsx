import { useState, useEffect } from 'react';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',borderLight:'#E9EBF0',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626',panelAlt:'#F6F7FA'};

const SPORT_MAP={'soccer_world_cup':'世界杯','soccer_fifa_world_cup':'世界杯','basketball_nba':'NBA','baseball_mlb':'MLB','icehockey_nhl':'NHL','mma_mixed_martial_arts':'UFC','americanfootball_nfl':'NFL','soccer_epl':'英超','soccer_uefa_champs_league':'歐冠','soccer_spain_la_liga':'西甲','soccer_germany_bundesliga':'德甲','soccer_italy_serie_a':'義甲','soccer_france_ligue_one':'法甲'};
const SPORT_C={'世界杯':'#1B5E20','NBA':'#C9082A','MLB':'#002D72','NHL':'#002654','UFC':'#D20A0A','NFL':'#013369','英超':'#3D195B','歐冠':'#003399','西甲':'#C60B1E','德甲':'#D20515'};
const TEAM_ZH={'Brazil':'巴西 🇧🇷','France':'法國 🇫🇷','Spain':'西班牙 🇪🇸','Argentina':'阿根廷 🇦🇷','Morocco':'摩洛哥 🇲🇦','England':'英格蘭 🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'葡萄牙 🇵🇹','Germany':'德國 🇩🇪','Netherlands':'荷蘭 🇳🇱','Ecuador':'厄瓜多 🇪🇨','Ivory Coast':'象牙海岸 🇨🇮','Sweden':'瑞典 🇸🇪','Tunisia':'突尼西亞 🇹🇳','USA':'美國 🇺🇸','Mexico':'墨西哥 🇲🇽','Canada':'加拿大 🇨🇦','Japan':'日本 🇯🇵','South Korea':'韓國 🇰🇷','Uruguay':'烏拉圭 🇺🇾','Croatia':'克羅埃西亞 🇭🇷','Senegal':'塞內加爾 🇸🇳','Panama':'巴拿馬 🇵🇦','Saudi Arabia':'沙烏地阿拉伯 🇸🇦','Colombia':'哥倫比亞 🇨🇴','Chile':'智利 🇨🇱','Australia':'澳洲 🇦🇺','Qatar':'卡達 🇶🇦','Costa Rica':'哥斯大黎加 🇨🇷','Switzerland':'瑞士 🇨🇭','Poland':'波蘭 🇵🇱','Serbia':'塞爾維亞 🇷🇸','Ghana':'迦納 🇬🇭','Cameroon':'喀麥隆 🇨🇲'};
const zh=en=>TEAM_ZH[en]||en;
const fmtT=iso=>{try{return new Date(iso).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' 台灣';}catch{return '';}};
const noVig=(h,d,a)=>{const arr=[h,d,a].filter(Boolean),imp=arr.map(o=>1/o),tot=imp.reduce((s,p)=>s+p,0);return{h:+(imp[0]/tot*100).toFixed(1),d:d?+(imp[1]/tot*100).toFixed(1):0,a:+(imp[d?2:1]/tot*100).toFixed(1)};};

const Spinner=()=><div style={{textAlign:'center',padding:48,color:C.muted}}><div style={{width:32,height:32,border:`3px solid ${C.border}`,borderTopColor:C.navy,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 10px'}}/><div>載入賽事...</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

export default function CalendarPage({role}){
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [filter,setFilter]=useState('全部');
  const [expanded,setExpanded]=useState(null);
  const [lastUpdated,setLastUpdated]=useState(null);

  const isAdmin=role==='admin'||role==='super_admin';

  // 用戶端：讀取快取數據（先從 Firestore，再從 API）
  const fetchEvents=async(forceRefresh=false)=>{
    // 只有 admin 可以強制刷新
    if(forceRefresh&&!isAdmin)return;
    setLoading(true);setError('');
    try{
      // 1. 先嘗試讀 Firestore 快取
      if(!forceRefresh){
        try{
          const mod=await import('../services/firestore.js');
          const cached=await mod.getCachedOdds?.();
          if(cached?.events?.length&&cached?.updatedAt){
            const age=(Date.now()-new Date(cached.updatedAt.toDate?.()??cached.updatedAt).getTime())/3600000;
            if(age<6){ // 6小時內的快取直接用
              setEvents(processEvents(cached.events));
              setLastUpdated(new Date(cached.updatedAt.toDate?.()??cached.updatedAt));
              setLoading(false);
              return;
            }
          }
        }catch{}
      }
      // 2. Firestore 無快取或 admin 強制刷新 → 打 API
      const r=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'odds',action:'getUpcoming',params:{region:'eu',limit:80}})});
      const data=await r.json();
      if(data.success&&data.result?.events?.length){
        const processed=processEvents(data.result.events);
        setEvents(processed);
        setLastUpdated(new Date());
        // 存回 Firestore 快取（只有 admin 操作才更新快取）
        if(isAdmin){
          try{
            const mod=await import('../services/firestore.js');
            await mod.setCachedOdds?.({events:data.result.events,updatedAt:new Date()});
          }catch{}
        }
      }else{setError('無法取得賽事');}
    }catch(e){setError('載入失敗：'+e.message);}
    setLoading(false);
  };

  const processEvents=(rawEvents)=>{
    const now=Date.now();
    return rawEvents
      .filter(ev=>SPORT_MAP[ev.sport_key]&&new Date(ev.commence_time).getTime()>now-4*3600000&&new Date(ev.commence_time).getTime()<now+5*24*3600000)
      .map(ev=>{
        const sport=SPORT_MAP[ev.sport_key];
        const bm=ev.bookmakers?.[0],h2h=bm?.markets?.find(m=>m.key==='h2h'),oc=h2h?.outcomes||[];
        const hO=oc.find(o=>o.name===ev.home_team)?.price||2,aO=oc.find(o=>o.name===ev.away_team)?.price||2,dO=oc.find(o=>o.name==='Draw')?.price;
        const nv=noVig(hO,dO,aO);
        return{id:ev.id,sport,color:SPORT_C[sport]||C.navy,home:zh(ev.home_team),away:zh(ev.away_team),homeEn:ev.home_team,awayEn:ev.away_team,time:fmtT(ev.commence_time),commence_time:ev.commence_time,odds:{h:hO,d:dO,a:aO},nv};
      })
      .sort((a,b)=>new Date(a.commence_time)-new Date(b.commence_time));
  };

  useEffect(()=>{fetchEvents();},[]);

  const sports=['全部',...new Set(events.map(e=>e.sport))];
  const filtered=events.filter(e=>filter==='全部'||e.sport===filter);
  const today=filtered.filter(e=>{const d=new Date(e.commence_time),n=new Date();return d.toDateString()===n.toDateString();});
  const upcoming=filtered.filter(e=>{const d=new Date(e.commence_time),n=new Date();return d.toDateString()!==n.toDateString();});

  const renderCard=ev=>{
    const isOpen=expanded===ev.id;
    return(
      <div key={ev.id} style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`4px solid ${ev.color}`,borderRadius:'0 10px 10px 0',marginBottom:8,overflow:'hidden'}}>
        <div onClick={()=>setExpanded(isOpen?null:ev.id)} style={{padding:'13px 18px',cursor:'pointer'}}
          onMouseEnter={e=>e.currentTarget.style.background='#F6F7FA'}
          onMouseLeave={e=>e.currentTarget.style.background=C.white}>
          <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
            <span style={{background:ev.color+'18',color:ev.color,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:3}}>{ev.sport}</span>
            <span style={{fontSize:11,fontWeight:700,color:C.amber}}>{ev.time}</span>
          </div>
          <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:C.dark,marginBottom:2}}>{ev.home} <span style={{color:C.muted,fontWeight:400}}>vs</span> {ev.away}</div>
              <div style={{fontSize:10,color:C.muted,fontFamily:'ui-monospace,monospace'}}>{ev.homeEn} vs {ev.awayEn}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2,fontFamily:'ui-monospace,monospace'}}>
                賠率：主 {ev.odds.h.toFixed(2)}{ev.odds.d?` 平 ${ev.odds.d.toFixed(2)}`:''} 客 {ev.odds.a.toFixed(2)}
              </div>
            </div>
            <div style={{textAlign:'center',minWidth:130}}>
              <div style={{fontSize:9,color:C.muted,marginBottom:3}}>去水市場概率</div>
              <div style={{display:'flex',gap:6,justifyContent:'center'}}>
                <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:900,color:C.win,fontFamily:'ui-monospace,monospace'}}>{ev.nv.h}%</div><div style={{fontSize:9,color:C.muted}}>主勝</div></div>
                {ev.nv.d>0&&<div style={{textAlign:'center'}}><div style={{fontSize:14,fontWeight:700,color:C.amber,fontFamily:'ui-monospace,monospace'}}>{ev.nv.d}%</div><div style={{fontSize:9,color:C.muted}}>平</div></div>}
                <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:900,color:C.loss,fontFamily:'ui-monospace,monospace'}}>{ev.nv.a}%</div><div style={{fontSize:9,color:C.muted}}>客勝</div></div>
              </div>
              <div style={{height:5,background:'#FECACA',borderRadius:3,overflow:'hidden',marginTop:4}}><div style={{width:`${ev.nv.h}%`,height:'100%',background:C.win}}/></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'28px 20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:10,marginBottom:22}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:C.amber,marginBottom:6,textTransform:'uppercase'}}>即時賽事</div>
            <h2 style={{fontSize:26,fontWeight:900,color:C.dark,margin:'0 0 4px'}}>賽程 · 真實賠率</h2>
            <p style={{color:C.muted,fontSize:13,margin:0}}>
              來源：The Odds API · 台灣時間顯示
              {lastUpdated&&<span style={{marginLeft:8,fontSize:11}}>· 更新於 {lastUpdated.toLocaleTimeString('zh-TW')}</span>}
            </p>
          </div>
          {/* 只有 Admin 才看得到重新整理按鈕 */}
          {isAdmin&&(
            <button onClick={()=>fetchEvents(true)} disabled={loading}
              style={{background:loading?C.muted:C.navy,color:C.white,border:'none',padding:'8px 16px',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:700}}>
              {loading?'載入中...':'🔄 Admin 更新'}
            </button>
          )}
        </div>

        {sports.length>1&&(
          <div style={{overflowX:'auto',marginBottom:16}}>
            <div style={{display:'flex',border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',background:C.white,width:'max-content'}}>
              {sports.map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:'7px 16px',border:'none',cursor:'pointer',background:filter===s?C.navy:'transparent',color:filter===s?C.white:C.muted,fontSize:12,fontWeight:700,borderRight:`1px solid ${C.borderLight}`,whiteSpace:'nowrap'}}>{s}</button>)}
            </div>
          </div>
        )}

        {loading&&<Spinner/>}
        {error&&<div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'14px',color:C.loss,fontSize:13,marginBottom:12}}>⚠️ {error}</div>}

        {!loading&&!error&&(
          <>
            {today.length>0&&<div style={{marginBottom:20}}><div style={{fontSize:12,fontWeight:700,color:C.dark,marginBottom:10}}>📅 今日賽事 <span style={{color:C.muted,fontWeight:400}}>（{today.length} 場）</span></div>{today.map(renderCard)}</div>}
            {upcoming.length>0&&<div><div style={{fontSize:12,fontWeight:700,color:C.dark,marginBottom:10}}>📆 即將到來 <span style={{color:C.muted,fontWeight:400}}>（{upcoming.length} 場）</span></div>{upcoming.map(renderCard)}</div>}
            {filtered.length===0&&<div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:9,padding:'32px',textAlign:'center',color:C.muted}}><div style={{fontSize:32,marginBottom:12}}>📅</div><div>暫無賽事</div></div>}
          </>
        )}

        <div style={{marginTop:14,padding:'10px',background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:8,fontSize:11,color:C.navy}}>
          📊 賠率來源：The Odds API · 去水概率已移除莊家水錢 · 數據每日定時更新 · 僅供參考
        </div>
      </div>
    </div>
  );
}
