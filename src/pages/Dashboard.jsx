import { useState, useEffect } from 'react';
import { DECISIONS } from '../utils/evCalculator';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };
const SPORT_C = { 世界杯:'#1B5E20', NBA:'#C9082A', MLB:'#002D72', LOL:'#C89B3C', 足球:'#1B5E20', UFC:'#D20A0A' };

const TEAM_ZH_SIMPLE = {
  'Brazil':'巴西 🇧🇷','France':'法國 🇫🇷','Spain':'西班牙 🇪🇸','Argentina':'阿根廷 🇦🇷',
  'Morocco':'摩洛哥 🇲🇦','England':'英格蘭 🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'葡萄牙 🇵🇹','Germany':'德國 🇩🇪',
  'Netherlands':'荷蘭 🇳🇱','Ecuador':'厄瓜多 🇪🇨','Ivory Coast':'象牙海岸 🇨🇮',
  'Sweden':'瑞典 🇸🇪','Tunisia':'突尼西亞 🇹🇳','USA':'美國 🇺🇸','Mexico':'墨西哥 🇲🇽',
  'Japan':'日本 🇯🇵','South Korea':'韓國 🇰🇷','Canada':'加拿大 🇨🇦','Australia':'澳洲 🇦🇺',
};
const zhTeam = (en) => TEAM_ZH_SIMPLE[en] || en;

const SPORT_WL = {
  'soccer_world_cup':'世界杯','soccer_fifa_world_cup':'世界杯','basketball_nba':'NBA',
  'baseball_mlb':'MLB','icehockey_nhl':'NHL','mma_mixed_martial_arts':'UFC',
  'americanfootball_nfl':'NFL','soccer_epl':'英超','soccer_uefa_champs_league':'歐冠',
  'soccer_spain_la_liga':'西甲','soccer_germany_bundesliga':'德甲',
};

// 把 Odds API 賽事轉成分析卡片
const transformOddsToCard = (ev) => {
  const sportZh = SPORT_WL[ev.sport_key];
  if (!sportZh) return null;
  const bm = ev.bookmakers?.[0];
  const h2h = bm?.markets?.find(m=>m.key==='h2h');
  const oc = h2h?.outcomes||[];
  const homeO = oc.find(o=>o.name===ev.home_team)?.price||2;
  const awayO = oc.find(o=>o.name===ev.away_team)?.price||2;
  const drawO = oc.find(o=>o.name==='Draw')?.price;
  const arr = [homeO,drawO,awayO].filter(Boolean);
  const imp = arr.map(o=>1/o);
  const tot = imp.reduce((s,p)=>s+p,0);
  const nv = imp.map(p=>+(p/tot*100).toFixed(1));
  const nvHome=nv[0], nvDraw=drawO?nv[1]:0, nvAway=nv[drawO?2:1];
  const edge = 0; const ev_ = +(nvHome/100*homeO-1)*100;
  const decision = ev_>4?'BET':ev_>2?'LEAN':'WAIT';
  const now = new Date(ev.commence_time);
  return {
    id:ev.id, sport:sportZh, status:'pending', accessLevel:'free',
    home:zhTeam(ev.home_team), away:zhTeam(ev.away_team),
    homeEn:ev.home_team, awayEn:ev.away_team,
    pick: `${zhTeam(ev.home_team)} 主場優勢`,
    modelHome:nvHome, modelDraw:nvDraw, modelAway:nvAway,
    ev:ev_.toFixed(1), edge:edge,
    decision, dataCompleteness:0.75, isFromOddsAPI:true,
    timeStr: now.toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}),
    analysis:'此為市場賠率自動生成預覽。Admin 手動建立或 AI 自動生成的深度分析將取代此卡片。',
    topScores: sportZh==='世界杯'||sportZh.includes('甲')||sportZh==='英超'||sportZh==='歐冠' ? [
      {home:Math.round(nvHome/55), away:Math.round(nvAway/45), prob:+(nvHome/7).toFixed(1)},
      {home:Math.round(nvHome/55)+1, away:Math.round(nvAway/45), prob:+(nvHome/10).toFixed(1)},
    ] : [],
  };
};

const DecisionBadge = ({ decision }) => {
  const d = DECISIONS?.[decision] || { label:decision||'—', color:C.muted, bg:C.panelAlt };
  return <span style={{ fontSize:10, fontWeight:800, padding:'3px 9px', borderRadius:4, background:d.bg, color:d.color }}>{d.label}</span>;
};

const Spinner = () => (
  <div style={{ textAlign:'center', padding:48, color:C.muted }}>
    <div style={{ width:32, height:32, border:`3px solid ${C.border}`, borderTopColor:C.navy, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
    <div style={{ fontSize:13 }}>載入分析報告...</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function Dashboard({ role, setPage, signals: propSignals }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('全部');
  const [expanded, setExpanded] = useState(null);
  const [dataSource, setDataSource] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // 嘗試 Firestore
      let firestoreData = [];
      try {
        const { subscribeToAnalyses } = await import('../services/firestore.js');
        await new Promise((resolve) => {
          const unsub = subscribeToAnalyses((docs) => {
            firestoreData = docs;
            unsub();
            resolve();
          });
          setTimeout(resolve, 3000); // 3秒 timeout
        });
      } catch(e) { console.warn('[Dashboard] Firestore:', e.message); }

      if (firestoreData.length > 0) {
        setAnalyses(firestoreData);
        setDataSource('firestore');
        setLoading(false);
        return;
      }

      // Firestore 空/失敗 → 從 Odds API 抓今日真實賽事
      try {
        const r = await fetch('/api/gateway', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ source:'odds', action:'getUpcoming', params:{ region:'eu', limit:30 } }),
        });
        const data = await r.json();
        if (data.success && data.result?.events?.length) {
          const now = Date.now();
          const today = data.result.events
            .filter(ev => {
              const t = new Date(ev.commence_time).getTime();
              return SPORT_WL[ev.sport_key] && t > now - 3*3600000 && t < now + 24*3600000;
            })
            .map(transformOddsToCard)
            .filter(Boolean)
            .slice(0,8);
          setAnalyses(today);
          setDataSource('odds_api');
        } else {
          setAnalyses(propSignals||[]);
          setDataSource('mock');
        }
      } catch(e) {
        setAnalyses(propSignals||[]);
        setDataSource('mock');
      }
      setLoading(false);
    };
    loadData();
  }, [propSignals]);

  const sports = ['全部', ...new Set(analyses.map(a=>a.sport).filter(Boolean))];
  const filtered = analyses.filter(a => {
    if (filter!=='全部'&&a.sport!==filter) return false;
    if (role==='free'&&a.accessLevel==='vip') return false;
    if (role==='guest') return false;
    return true;
  });

  const renderCard = (a) => {
    const sc = SPORT_C[a.sport]||C.navy;
    const statusC = a.status==='win'?C.win:a.status==='loss'?C.loss:C.amber;
    const isOpen = expanded===a.id;
    const canSeeEV = role==='vip'||role==='admin';
    const winScore = a.modelHome ? Math.round(a.modelHome) : null;
    const confScore = Math.round((a.dataCompleteness||0.8)*100);
    const valueScore = a.ev ? Math.min(100, Math.round(50+(+a.ev)*4)) : null;

    return (
      <div key={a.id} style={{ background:C.white, border:`1.5px solid ${C.border}`, borderLeft:`5px solid ${sc}`, borderRadius:'0 12px 12px 0', overflow:'hidden', marginBottom:10 }}>
        <div style={{ padding:'14px 20px' }}>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8, marginBottom:10 }}>
            <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ background:sc+'18', color:sc, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:3 }}>{a.sport}</span>
              {a.accessLevel==='vip'&&<span style={{ background:'#FFFBEB', color:'#D97706', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:3 }}>⭐ VIP</span>}
              {a.decision&&<DecisionBadge decision={a.decision}/>}
              <span style={{ fontSize:10, fontWeight:700, color:statusC }}>
                {a.status==='win'?'✅ 命中':a.status==='loss'?'❌ 未中':a.isFromOddsAPI?'📊 即時賠率':'⏳ 進行中'}
              </span>
            </div>
            <div style={{ fontSize:10, color:C.muted }}>{a.timeStr||a.createdAt?.toDate?.()?.toLocaleDateString('zh-TW')||''}</div>
          </div>

          {/* 比賽標題 */}
          <div style={{ fontSize:17, fontWeight:800, color:C.dark, marginBottom:3 }}>
            {a.home} <span style={{ color:C.muted, fontWeight:400, fontSize:14 }}>vs</span> {a.away}
          </div>
          {a.homeEn && <div style={{ fontSize:10, color:C.muted, marginBottom:10, fontFamily:'ui-monospace,monospace' }}>{a.homeEn} vs {a.awayEn}</div>}

          {/* 三分數 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:12 }}>
            <div style={{ background:C.bg, borderRadius:8, padding:'10px 10px', textAlign:'center' }}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>勝率分數</div>
              {winScore ? <>
                <div style={{ fontSize:20, fontWeight:900, color:C.win, fontFamily:'ui-monospace,monospace' }}>{winScore}%</div>
                <div style={{ fontSize:9, color:C.muted }}>去水主勝概率</div>
              </> : <div style={{ color:C.muted, fontSize:13, marginTop:8 }}>—</div>}
            </div>
            <div style={{ background:C.bg, borderRadius:8, padding:'10px 10px', textAlign:'center' }}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>信心分數</div>
              <div style={{ fontSize:20, fontWeight:900, color:C.navy, fontFamily:'ui-monospace,monospace' }}>{confScore}</div>
              <div style={{ fontSize:9, color:C.muted }}>資料完整/100</div>
            </div>
            <div style={{ background:C.bg, borderRadius:8, padding:'10px 10px', textAlign:'center' }}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>價值分數</div>
              {canSeeEV && valueScore ? <>
                <div style={{ fontSize:20, fontWeight:900, color:valueScore>=65?C.win:valueScore>=50?C.amber:C.muted, fontFamily:'ui-monospace,monospace' }}>{valueScore}</div>
                <div style={{ fontSize:9, color:C.muted }}>EV/Edge/100</div>
              </> : (
                <div style={{ marginTop:4 }}>
                  <div style={{ fontSize:16 }}>🔒</div>
                  <div style={{ fontSize:9, color:C.muted }}>VIP解鎖</div>
                </div>
              )}
            </div>
          </div>

          {/* 概率進度條 */}
          {a.modelHome > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.muted, marginBottom:3 }}>
                <span>主勝 {a.modelHome}%</span>
                {a.modelDraw>0&&<span>平 {a.modelDraw}%</span>}
                <span>客勝 {a.modelAway}%</span>
              </div>
              <div style={{ height:6, background:'#FECACA', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${a.modelHome}%`, height:'100%', background:C.win }}/>
              </div>
            </div>
          )}

          {/* EV 數據 (VIP) */}
          {canSeeEV && (+a.ev!==0 || +a.edge!==0) && (
            <div style={{ display:'flex', gap:16, marginBottom:10, flexWrap:'wrap' }}>
              {a.ev!==undefined&&<span style={{ fontSize:12, color:C.muted }}>EV：<strong style={{ color:+a.ev>0?C.win:C.loss, fontFamily:'ui-monospace,monospace' }}>{+a.ev>0?'+':''}{a.ev}%</strong></span>}
              {a.edge!==undefined&&<span style={{ fontSize:12, color:C.muted }}>Edge：<strong style={{ color:C.amber, fontFamily:'ui-monospace,monospace' }}>+{a.edge}%</strong></span>}
            </div>
          )}

          {/* 分析方向 */}
          {a.pick && (
            <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:6, padding:'8px 12px', marginBottom:10, fontSize:12, color:C.navy, fontWeight:600 }}>
              📌 {a.pick}
            </div>
          )}

          {/* AI 分析 */}
          {a.analysis && (
            <div style={{ fontSize:12, color:'#374151', lineHeight:1.7, cursor:isOpen?'default':'pointer', maxHeight:isOpen?'none':48, overflow:'hidden', position:'relative' }}
              onClick={()=>!isOpen&&setExpanded(a.id)}>
              {a.analysis}
              {!isOpen && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:28, background:'linear-gradient(transparent,#fff)' }}/>}
            </div>
          )}
          {a.analysis && !isOpen && (
            <button onClick={()=>setExpanded(a.id)} style={{ fontSize:11, color:C.navy, background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>展開分析 ▾</button>
          )}
          {isOpen && (
            <button onClick={()=>setExpanded(null)} style={{ fontSize:11, color:C.muted, background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>收起 ▲</button>
          )}

          {/* VIP 鎖 */}
          {a.accessLevel==='vip'&&(role==='free'||role==='guest')&&(
            <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:7, padding:'12px 14px', textAlign:'center', marginTop:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#D97706', marginBottom:8 }}>⭐ VIP 專屬深度分析</div>
              <button onClick={()=>setPage?.('upgrade')} style={{ background:C.navy, color:'#fff', border:'none', padding:'8px 20px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700 }}>升級 VIP</button>
            </div>
          )}
        </div>

        {/* 比分預測 */}
        {a.topScores?.length>0&&(
          <div style={{ background:C.panelAlt, borderTop:`1px solid ${C.borderLight}`, padding:'8px 20px', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:10, color:C.muted, fontWeight:700 }}>比分預測：</span>
            {a.topScores.slice(0,3).map((s,i)=>(
              <span key={i} style={{ fontSize:11, fontFamily:'ui-monospace,monospace', fontWeight:i===0?800:500, color:i===0?C.navy:C.muted }}>
                {s.home}-{s.away} ({s.prob}%)
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10, marginBottom:20 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>
              {dataSource==='firestore'?'🔴 Firestore 即時':dataSource==='odds_api'?'📊 今日真實賽事':'📋 本地模式'}
            </div>
            <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 4px' }}>今日賽事分析</h2>
            <p style={{ color:C.muted, fontSize:13, margin:0 }}>
              {dataSource==='odds_api'?'從 The Odds API 自動生成 · Admin 建立的分析將取代':
               dataSource==='firestore'?'Admin 建立的分析報告':'分析報告由 Admin 手動建立'}
            </p>
          </div>
          {role==='admin'&&dataSource!=='firestore'&&(
            <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 14px', fontSize:12, color:C.navy }}>
              👉 Admin → API設定 → 立即生成分析
            </div>
          )}
        </div>

        {/* 訪客 */}
        {(role==='guest'||!role)&&(
          <div style={{ background:C.navy, borderRadius:12, padding:'28px 24px', textAlign:'center', marginBottom:20 }}>
            <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:8 }}>📊 每日賽事分析報告</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:16 }}>免費加入即可查看今日完整分析</div>
            <button onClick={()=>setPage?.('register')} style={{ background:'#E9B44C', color:C.navy, border:'none', padding:'10px 24px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:800 }}>免費加入 →</button>
          </div>
        )}

        {/* Sport filter */}
        {sports.length>1&&(
          <div style={{ overflowX:'auto', marginBottom:16 }}>
            <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, width:'max-content' }}>
              {sports.map(s=>(
                <button key={s} onClick={()=>setFilter(s)} style={{ padding:'7px 16px', border:'none', cursor:'pointer', background:filter===s?C.navy:'transparent', color:filter===s?C.white:C.muted, fontSize:12, fontWeight:700, borderRight:`1px solid ${C.borderLight}`, whiteSpace:'nowrap' }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {loading&&<Spinner/>}
        {!loading&&role!=='guest'&&filtered.length===0&&(
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:'48px 32px', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>📊</div>
            <div style={{ fontSize:16, fontWeight:700, color:C.dark, marginBottom:8 }}>今日分析報告尚未發布</div>
            <div style={{ fontSize:13, color:C.muted }}>每天早上 6 點自動生成 · 或 Admin 手動觸發</div>
            {role==='admin'&&<div style={{ marginTop:14, padding:'12px', background:'#EFF6FF', borderRadius:8, fontSize:12, color:C.navy }}>👉 Admin → API設定 → 立即生成所有分析</div>}
          </div>
        )}

        {!loading&&filtered.map(renderCard)}

        <div style={{ marginTop:20, padding:'10px 16px', background:'#F6F7FA', border:'1px solid #D4D8DF', borderRadius:8, fontSize:11, color:C.muted, textAlign:'center' }}>
          SignalEdge 提供運動數據與機率參考，不提供投注服務，不保證任何賽果或獲利。請理性參考，量力而為。
        </div>
      </div>
    </div>
  );
}
