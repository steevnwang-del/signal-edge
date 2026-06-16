import { useEffect, useState } from 'react';

const C={navy:'#0F3460',navy2:'#092744',gold:'#E9B44C',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',bg:'#ECEEF2',win:'#059669',loss:'#DC2626',amber:'#D97706'};
const SPORT_MAP={soccer_world_cup:'世界杯',soccer_fifa_world_cup:'世界杯',basketball_nba:'NBA',baseball_mlb:'MLB'};
const TZ={'Brazil':'巴西 🇧🇷','France':'法國 🇫🇷','Spain':'西班牙 🇪🇸','Argentina':'阿根廷 🇦🇷','Morocco':'摩洛哥 🇲🇦','England':'英格蘭 🏴','Portugal':'葡萄牙 🇵🇹','Germany':'德國 🇩🇪','Netherlands':'荷蘭 🇳🇱','Uruguay':'烏拉圭 🇺🇾','Saudi Arabia':'沙烏地阿拉伯 🇸🇦','USA':'美國 🇺🇸','United States':'美國 🇺🇸','Mexico':'墨西哥 🇲🇽'};
const zh=en=>TZ[en]||en;
const noVig=(h,d,a)=>{const arr=[h,d,a].filter(Boolean).map(Number).filter(v=>v>1);const imp=arr.map(o=>1/o);const tot=imp.reduce((s,p)=>s+p,0)||1;return{h:+((imp[0]||.5)/tot*100).toFixed(1),a:+((imp[d?2:1]||.5)/tot*100).toFixed(1),d:d?+((imp[1]||0)/tot*100).toFixed(1):0};};
const fallback=[
  {sport:'世界杯',home:'西班牙 🇪🇸',away:'維德角 🇨🇻',model:'西班牙優勢',score:'2-0 / 3-0',risk:'低賠過熱，需看價格',value:'中'},
  {sport:'世界杯',home:'沙烏地阿拉伯 🇸🇦',away:'烏拉圭 🇺🇾',model:'烏拉圭不敗',score:'0-1 / 1-2',risk:'首發與輪換待確認',value:'中高'},
  {sport:'MLB',home:'Dodgers',away:'Giants',model:'主隊略優',score:'投手確認後更新',risk:'先發投手與牛棚影響大',value:'觀望'},
];

export default function LandingPage({setPage}){
  const [cards,setCards]=useState(fallback);
  useEffect(()=>{(async()=>{try{const r=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'odds',action:'getUpcoming',params:{region:'eu',limit:24}})});const d=await r.json();const evs=(d.result?.events||[]).filter(e=>SPORT_MAP[e.sport_key]).slice(0,3).map(e=>{const bm=e.bookmakers?.[0];const oc=bm?.markets?.find(m=>m.key==='h2h')?.outcomes||[];const h=oc.find(o=>o.name===e.home_team)?.price||2;const a=oc.find(o=>o.name===e.away_team)?.price||2;const draw=oc.find(o=>o.name==='Draw')?.price;const nv=noVig(h,draw,a);return{sport:SPORT_MAP[e.sport_key],home:zh(e.home_team),away:zh(e.away_team),model:nv.h>nv.a?'主隊傾向':'客隊傾向',score:e.sport_key?.includes('baseball')?'投手確認後更新': nv.h>60?'2-0 / 2-1':'1-1 / 1-0',risk:'賠率與陣容需賽前確認',value:nv.h>60?'勝率高，價格需檢查':'可觀察'};});if(evs.length)setCards(evs);}catch{} })();},[]);
  const steps=[['免費看懂方向','今日熱門預測、比分傾向、風險提醒'],['註冊解鎖完整卡','勝率區間、大小分、隊伍資訊與收藏'],['Pro 看價格價值','去水機率、最低可參考賠率、賽前更新'],['代理一起推廣','全民可申請代理，主要代理可經營社群與流量']];
  const features=[['世界盃流量入口','冠軍機率、出線情境、每日賽事預測，適合社群分享。'],['台灣用戶本地化','用繁體中文解釋賠率、機率與風險，未來可接台灣運彩比價。'],['價格價值思維','不只看誰會贏，而是看目前價格是否值得關注。'],['可長期延伸','世界盃後接英超、歐冠、NBA、MLB、電競，形成長期品牌。']];
  return <div style={{background:C.bg,minHeight:'100vh'}}>
    <section style={{background:`linear-gradient(135deg, ${C.navy2} 0%, ${C.navy} 55%, #0B4A7A 100%)`,color:C.white,padding:'58px 20px 50px'}}>
      <div style={{maxWidth:1120,margin:'0 auto',display:'grid',gridTemplateColumns:'minmax(0,1.1fr) minmax(320px,.9fr)',gap:28,alignItems:'center'}}>
        <div>
          <div style={{display:'inline-flex',gap:8,alignItems:'center',background:'rgba(233,180,76,.15)',border:'1px solid rgba(233,180,76,.35)',color:C.gold,padding:'7px 12px',borderRadius:999,fontSize:12,fontWeight:800,marginBottom:16}}>🏆 2026 世界盃專題 · 繁體中文模型分析</div>
          <h1 style={{fontSize:46,lineHeight:1.05,letterSpacing:-1.2,margin:'0 0 16px',fontWeight:950}}>看懂比賽機率，<br/>找出真正有價值的價格。</h1>
          <p style={{fontSize:16,lineHeight:1.8,color:'rgba(255,255,255,.78)',margin:'0 0 24px',maxWidth:640}}>SignalEdge 不是報牌平台，而是面向台灣用戶的運動賽事分析網站：預測、比分、風險、賠率價值與賽前更新，一次看懂。</p>
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            <button onClick={()=>setPage('dashboard')} style={{background:C.gold,color:C.navy,border:'none',padding:'13px 22px',borderRadius:10,cursor:'pointer',fontWeight:900,fontSize:14}}>查看今日預測</button>
            <button onClick={()=>setPage('upgrade')} style={{background:'rgba(255,255,255,.12)',color:C.white,border:'1px solid rgba(255,255,255,.28)',padding:'13px 22px',borderRadius:10,cursor:'pointer',fontWeight:800,fontSize:14}}>世界盃 Pro 方案</button>
            <button onClick={()=>setPage('agent')} style={{background:'transparent',color:C.white,border:'1px solid rgba(255,255,255,.28)',padding:'13px 22px',borderRadius:10,cursor:'pointer',fontWeight:800,fontSize:14}}>加入代理推廣</button>
          </div>
        </div>
        <div style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.18)',borderRadius:20,padding:18,boxShadow:'0 18px 60px rgba(0,0,0,.24)'}}>
          <div style={{fontSize:13,fontWeight:900,marginBottom:12,color:C.gold}}>今日熱門賽事</div>
          {cards.map((c,i)=><div key={i} style={{background:C.white,color:C.dark,borderRadius:14,padding:'14px 15px',marginBottom:i===cards.length-1?0:10}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',marginBottom:8}}><span style={{fontSize:10,fontWeight:900,color:C.navy,background:'#EAF2FF',padding:'3px 7px',borderRadius:5}}>{c.sport}</span><span style={{fontSize:11,color:C.muted}}>價值：{c.value}</span></div>
            <div style={{fontSize:16,fontWeight:950,marginBottom:3}}>{c.home} vs {c.away}</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>模型傾向：<b style={{color:C.win}}>{c.model}</b> · 參考比分：{c.score}</div>
            <div style={{fontSize:11,color:C.amber,marginTop:6}}>⚠ {c.risk}</div>
          </div>)}
        </div>
      </div>
    </section>
    <section style={{maxWidth:1120,margin:'0 auto',padding:'34px 20px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14,marginBottom:28}}>{features.map(([t,d])=><div key={t} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}><div style={{fontSize:16,fontWeight:950,color:C.dark,marginBottom:8}}>{t}</div><div style={{fontSize:13,color:C.muted,lineHeight:1.7}}>{d}</div></div>)}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,alignItems:'stretch'}}>
        <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}><div style={{fontSize:20,fontWeight:950,color:C.dark,marginBottom:14}}>世界盃轉化漏斗</div>{steps.map((s,i)=><div key={s[0]} style={{display:'flex',gap:12,marginBottom:14}}><div style={{width:28,height:28,borderRadius:999,background:C.navy,color:C.white,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:12,flexShrink:0}}>{i+1}</div><div><div style={{fontWeight:900,color:C.dark,fontSize:14}}>{s[0]}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{s[1]}</div></div></div>)}</div>
        <div style={{background:'#FFF7E6',border:'1px solid #F5D38A',borderRadius:16,padding:22}}><div style={{fontSize:20,fontWeight:950,color:C.dark,marginBottom:10}}>全民代理計畫</div><p style={{fontSize:13,color:C.muted,lineHeight:1.8,margin:'0 0 16px'}}>每個註冊用戶都能產生推廣連結；主要代理可以經營社群、內容頁與活動碼。後台會統計註冊、轉付費與佣金。</p><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>{[['40%','直屬訂閱'],['20%','二級推薦'],['B2B','社群/店家']].map(x=><div key={x[1]} style={{background:C.white,border:'1px solid #F5D38A',borderRadius:10,padding:12,textAlign:'center'}}><div style={{fontSize:22,fontWeight:950,color:C.amber}}>{x[0]}</div><div style={{fontSize:11,color:C.muted}}>{x[1]}</div></div>)}</div><button onClick={()=>setPage('agent')} style={{background:C.navy,color:C.white,border:'none',padding:'11px 18px',borderRadius:9,cursor:'pointer',fontWeight:900}}>查看代理頁</button></div>
      </div>
    </section>
  </div>;
}
