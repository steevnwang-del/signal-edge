import { useEffect, useMemo, useState } from 'react';

const C={navy:'#0F3460',navy2:'#092744',gold:'#E9B44C',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',bg:'#ECEEF2',win:'#059669',loss:'#DC2626',amber:'#D97706',panelAlt:'#F6F7FA'};
const SPORT_MAP={soccer_world_cup:'世界杯',soccer_fifa_world_cup:'世界杯',basketball_nba:'NBA',baseball_mlb:'MLB'};
const TZ={'Brazil':'巴西 🇧🇷','France':'法國 🇫🇷','Spain':'西班牙 🇪🇸','Argentina':'阿根廷 🇦🇷','Morocco':'摩洛哥 🇲🇦','England':'英格蘭 🏴','Portugal':'葡萄牙 🇵🇹','Germany':'德國 🇩🇪','Netherlands':'荷蘭 🇳🇱','Uruguay':'烏拉圭 🇺🇾','Saudi Arabia':'沙烏地阿拉伯 🇸🇦','USA':'美國 🇺🇸','United States':'美國 🇺🇸','Mexico':'墨西哥 🇲🇽'};
const zh=en=>TZ[en]||en;
const noVig=(h,d,a)=>{const arr=[h,d,a].filter(Boolean).map(Number).filter(v=>v>1);const imp=arr.map(o=>1/o);const tot=imp.reduce((s,p)=>s+p,0)||1;return{h:+((imp[0]||.5)/tot*100).toFixed(1),a:+((imp[d?2:1]||.5)/tot*100).toFixed(1),d:d?+((imp[1]||0)/tot*100).toFixed(1):0};};
const fallback=[
  {sport:'世界杯',home:'西班牙 🇪🇸',away:'維德角 🇨🇻',model:'西班牙優勢',score:'2-0 / 3-0',risk:'低賠過熱，需看價格',value:'中'},
  {sport:'世界杯',home:'沙烏地阿拉伯 🇸🇦',away:'烏拉圭 🇺🇾',model:'烏拉圭不敗',score:'0-1 / 1-2',risk:'首發與輪換待確認',value:'中高'},
  {sport:'MLB',home:'Dodgers',away:'Giants',model:'主隊略優',score:'投手確認後更新',risk:'先發投手與牛棚影響大',value:'觀望'},
];

function AdSlot({ ad, fallbackText='' }) {
  if (!ad?.enabled) return fallbackText ? <div style={{border:'1px dashed #CBD5E1',background:'#F8FAFC',borderRadius:14,padding:18,textAlign:'center',color:'#64748B',fontSize:12}}>{fallbackText}</div> : null;
  const body = <div style={{border:`1px solid ${C.border}`,background:C.white,borderRadius:14,padding:16,display:'flex',alignItems:'center',gap:14}}>
    {ad.imageUrl && <img src={ad.imageUrl} alt="" style={{width:120,height:64,objectFit:'cover',borderRadius:10}}/>}
    <div style={{flex:1}}><div style={{fontSize:10,color:C.amber,fontWeight:900,letterSpacing:1}}>贊助內容</div><div style={{fontSize:15,fontWeight:900,color:C.dark}}>{ad.title || ad.sponsorName || '合作品牌'}</div><div style={{fontSize:12,color:C.muted,marginTop:4}}>{ad.description || '世界盃期間品牌曝光版位'}</div></div>
  </div>;
  return ad.linkUrl ? <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>{body}</a> : body;
}

export default function LandingPage({setPage, siteSettings}){
  const [cards,setCards]=useState(fallback);
  const [odds,setOdds]=useState('1.85');
  const [prob,setProb]=useState('56');
  const ads = (siteSettings?.ads || []).filter(a=>a.enabled);
  const homeTopAd = ads.find(a=>a.placement==='home_top') || ads[0];
  const inFeedAd = ads.find(a=>a.placement==='home_feed') || ads[1];
  const ev = useMemo(()=>{const o=Number(odds),p=Number(prob)/100;if(!o||!p)return null;return +((p*o-1)*100).toFixed(1);},[odds,prob]);

  useEffect(()=>{(async()=>{try{const r=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'odds',action:'getUpcoming',params:{region:'eu',limit:24}})});const d=await r.json();const evs=(d.result?.events||[]).filter(e=>SPORT_MAP[e.sport_key]).slice(0,3).map(e=>{const bm=e.bookmakers?.[0];const oc=bm?.markets?.find(m=>m.key==='h2h')?.outcomes||[];const h=oc.find(o=>o.name===e.home_team)?.price||2;const a=oc.find(o=>o.name===e.away_team)?.price||2;const draw=oc.find(o=>o.name==='Draw')?.price;const nv=noVig(h,draw,a);return{sport:SPORT_MAP[e.sport_key],home:zh(e.home_team),away:zh(e.away_team),model:nv.h>nv.a?'主隊傾向':'客隊傾向',score:e.sport_key?.includes('baseball')?'投手確認後更新': nv.h>60?'2-0 / 2-1':'1-1 / 1-0',risk:'賠率與陣容需賽前確認',value:nv.h>60?'勝率高，價格需檢查':'可觀察'};});if(evs.length)setCards(evs);}catch{} })();},[]);

  const steps=[['查看今日賽事分析','每日更新世界杯、MLB、NBA 等熱門賽事預測與風險提醒'],['免費加入解鎖更多','查看完整機率比較、台彩試算器與賽前關注'],['邀請好友獲得進階內容','每邀請一位好友，雙方各獲得進階分析解鎖額度'],['升級 VIP 享完整功能','完整 EV 分析、最低參考賠率、所有賽事深度報告']];
  const features=[['2026 世界盃專題','冠軍機率、小組出線、每日賽事預測，繁體中文深度解析。'],['台灣用戶本地化','搭配台彩賠率試算器，快速對比官方賠率與模型機率。'],['價格價值思維','不只看誰會贏，而是幫你判斷目前市場賠率是否合理。'],['多運動持續更新','世界盃、英超、歐冠、NBA、MLB、電競，持續追蹤分析。']];

  return <div style={{background:C.bg,minHeight:'100vh'}}>
    <section style={{background:`linear-gradient(135deg, ${C.navy2} 0%, ${C.navy} 55%, #0B4A7A 100%)`,color:C.white,padding:'62px 20px 54px'}}>
      <div style={{maxWidth:1120,margin:'0 auto',display:'grid',gridTemplateColumns:'minmax(0,1.1fr) minmax(320px,.9fr)',gap:28,alignItems:'center'}}>
        <div>
          <div style={{display:'inline-flex',gap:8,alignItems:'center',background:'rgba(233,180,76,.15)',border:'1px solid rgba(233,180,76,.35)',color:C.gold,padding:'7px 12px',borderRadius:999,fontSize:12,fontWeight:850,marginBottom:16}}>🏆 2026 世界盃專題 · 每日賽事分析</div>
          <h1 style={{fontSize:48,lineHeight:1.05,letterSpacing:-1.2,margin:'0 0 16px',fontWeight:950}}>今日賽事、比分預測、<br/>賠率是否合理，一頁看懂。</h1>
          <p style={{fontSize:16,lineHeight:1.8,color:'rgba(255,255,255,.78)',margin:'0 0 24px',maxWidth:650}}>SignalEdge 面向台灣用戶，提供世界盃、MLB、NBA 與電競的賽事分析、價格觀察與風險提醒。免費看方向，進階報告可透過會員、邀請或贊助解鎖。</p>
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            <button onClick={()=>setPage('dashboard')} style={{background:C.gold,color:C.navy,border:'none',padding:'13px 22px',borderRadius:10,cursor:'pointer',fontWeight:950,fontSize:14}}>查看今日預測</button>
            <button onClick={()=>setPage('news')} style={{background:'rgba(255,255,255,.12)',color:C.white,border:'1px solid rgba(255,255,255,.28)',padding:'13px 22px',borderRadius:10,cursor:'pointer',fontWeight:850,fontSize:14}}>最新體育速報</button>
            <button onClick={()=>setPage('upgrade')} style={{background:'transparent',color:C.white,border:'1px solid rgba(255,255,255,.28)',padding:'13px 22px',borderRadius:10,cursor:'pointer',fontWeight:850,fontSize:14}}>升級 Pro</button>
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

    <section style={{maxWidth:1120,margin:'0 auto',padding:'26px 20px 0'}}><AdSlot ad={homeTopAd} fallbackText="" /></section>

    <section style={{maxWidth:1120,margin:'0 auto',padding:'26px 20px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14,marginBottom:26}}>{features.map(([t,d])=><div key={t} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}><div style={{fontSize:16,fontWeight:950,color:C.dark,marginBottom:8}}>{t}</div><div style={{fontSize:13,color:C.muted,lineHeight:1.7}}>{d}</div></div>)}</div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(320px,.9fr)',gap:18,alignItems:'stretch'}}>
        <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}><div style={{fontSize:20,fontWeight:950,color:C.dark,marginBottom:14}}>如何使用 SignalEdge</div>{steps.map((s,i)=><div key={s[0]} style={{display:'flex',gap:12,marginBottom:14}}><div style={{width:28,height:28,borderRadius:999,background:C.navy,color:C.white,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:12,flexShrink:0}}>{i+1}</div><div><div style={{fontWeight:900,color:C.dark,fontSize:14}}>{s[0]}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{s[1]}</div></div></div>)}</div>
        <div style={{background:'#FFF7E6',border:'1px solid #F5D38A',borderRadius:16,padding:22}}><div style={{fontSize:20,fontWeight:950,color:C.dark,marginBottom:10}}>台彩賠率試算器</div><p style={{fontSize:13,color:C.muted,lineHeight:1.8,margin:'0 0 14px'}}>輸入你看到的賠率與模型機率，快速估算價格是否合理。此工具僅供機率教育與賽事分析參考。</p><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}><label style={{fontSize:12,color:C.muted,fontWeight:800}}>賠率<input value={odds} onChange={e=>setOdds(e.target.value)} style={{marginTop:5,width:'100%',boxSizing:'border-box',padding:'10px',border:`1px solid ${C.border}`,borderRadius:8}}/></label><label style={{fontSize:12,color:C.muted,fontWeight:800}}>模型機率 %<input value={prob} onChange={e=>setProb(e.target.value)} style={{marginTop:5,width:'100%',boxSizing:'border-box',padding:'10px',border:`1px solid ${C.border}`,borderRadius:8}}/></label></div><div style={{background:C.white,border:'1px solid #F5D38A',borderRadius:10,padding:14}}><div style={{fontSize:12,color:C.muted}}>試算 EV</div><div style={{fontSize:30,fontWeight:950,color:ev>=0?C.win:C.loss}}>{ev===null?'—':`${ev>0?'+':''}${ev}%`}</div><div style={{fontSize:11,color:C.muted}}>正值代表理論價格較有利，仍需確認資料完整度與風險。</div></div></div>
      </div>

      <div style={{marginTop:18}}><AdSlot ad={inFeedAd} fallbackText="" /></div>
    </section>
  </div>;
}

