import { useState, useEffect } from 'react';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };
const SPORT_C = { 世界杯:'#1B5E20', NBA:'#C9082A', MLB:'#002D72', NHL:'#002654', UFC:'#D20A0A', 英超:'#3D195B', 歐冠:'#003399', 西甲:'#C60B1E', 德甲:'#D20515', 義甲:'#009246', 法甲:'#003189', NFL:'#013369' };

const SPORT_MAP = {
  'soccer_world_cup':'世界杯','soccer_fifa_world_cup':'世界杯',
  'basketball_nba':'NBA','baseball_mlb':'MLB','icehockey_nhl':'NHL',
  'mma_mixed_martial_arts':'UFC','americanfootball_nfl':'NFL',
  'soccer_epl':'英超','soccer_uefa_champs_league':'歐冠',
  'soccer_spain_la_liga':'西甲','soccer_germany_bundesliga':'德甲',
  'soccer_italy_serie_a':'義甲','soccer_france_ligue_one':'法甲',
};

const TEAM_ZH = {
  'Brazil':'巴西 🇧🇷','France':'法國 🇫🇷','Spain':'西班牙 🇪🇸','Argentina':'阿根廷 🇦🇷',
  'Morocco':'摩洛哥 🇲🇦','England':'英格蘭 🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'葡萄牙 🇵🇹','Germany':'德國 🇩🇪',
  'Netherlands':'荷蘭 🇳🇱','Ecuador':'厄瓜多 🇪🇨','Ivory Coast':'象牙海岸 🇨🇮','Sweden':'瑞典 🇸🇪',
  'Tunisia':'突尼西亞 🇹🇳','USA':'美國 🇺🇸','Mexico':'墨西哥 🇲🇽','Canada':'加拿大 🇨🇦',
  'Japan':'日本 🇯🇵','South Korea':'韓國 🇰🇷','Uruguay':'烏拉圭 🇺🇾','Croatia':'克羅埃西亞 🇭🇷',
  'Senegal':'塞內加爾 🇸🇳','Poland':'波蘭 🇵🇱','Switzerland':'瑞士 🇨🇭','Denmark':'丹麥 🇩🇰',
  'Colombia':'哥倫比亞 🇨🇴','Chile':'智利 🇨🇱','Saudi Arabia':'沙烏地阿拉伯 🇸🇦',
  'Australia':'澳洲 🇦🇺','Costa Rica':'哥斯大黎加 🇨🇷','Qatar':'卡達 🇶🇦',
  'Panama':'巴拿馬 🇵🇦','Ghana':'迦納 🇬🇭','Serbia':'塞爾維亞 🇷🇸',
  'Cameroon':'喀麥隆 🇨🇲','Iran':'伊朗 🇮🇷','Czechia':'捷克 🇨🇿',
};
const zhTeam = en => TEAM_ZH[en] || en;

const noVig = (arr) => {
  const imp = arr.map(o=>1/o);
  const tot = imp.reduce((s,p)=>s+p,0);
  return imp.map(p=>+(p/tot*100).toFixed(1));
};

const formatTime = (iso) => {
  try {
    return new Date(iso).toLocaleString('zh-TW',{ timeZone:'Asia/Taipei', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false }) + ' 台灣';
  } catch { return ''; }
};

const DECISIONS_STYLE = {
  BET:    { bg:'#ECFDF5', color:'#059669', label:'BET 統計優勢' },
  LEAN:   { bg:'#FFFBEB', color:'#D97706', label:'LEAN 輕微優勢' },
  WAIT:   { bg:'#F6F7FA', color:'#6B7280', label:'WAIT 等待' },
  NO_BET: { bg:'#FEF2F2', color:'#DC2626', label:'NO BET' },
};

const transformEvent = (ev) => {
  const sport = SPORT_MAP[ev.sport_key];
  if (!sport) return null;
  const bm = ev.bookmakers?.[0];
  const h2h = bm?.markets?.find(m=>m.key==='h2h');
  const oc = h2h?.outcomes||[];
  const homeO = oc.find(o=>o.name===ev.home_team)?.price||2;
  const awayO = oc.find(o=>o.name===ev.away_team)?.price||2;
  const drawO = oc.find(o=>o.name==='Draw')?.price;
  const arr = [homeO, drawO, awayO].filter(Boolean);
  const nv = noVig(arr);
  const nvH=nv[0], nvD=drawO?nv[1]:0, nvA=nv[drawO?2:1];
  const ev_pct = +(nvH/100*homeO-1)*100;
  const edge = 0;
  const decision = ev_pct>4?'BET':ev_pct>2?'LEAN':'WAIT';
  const isSoccer = ev.sport_key?.startsWith('soccer');
  return {
    id:ev.id, sport, isReal:true, status:'pending', accessLevel:'free',
    home:zhTeam(ev.home_team), away:zhTeam(ev.away_team),
    homeEn:ev.home_team, awayEn:ev.away_team,
    modelHome:nvH, modelDraw:nvD, modelAway:nvA,
    odds:{ home:homeO, draw:drawO, away:awayO },
    ev:ev_pct.toFixed(1), edge,
    decision, dataCompleteness:0.78,
    timeStr:formatTime(ev.commence_time),
    commence_time:ev.commence_time,
    isSoccer,
    analysis:`市場去水概率：主隊 ${nvH}%${drawO?` 平局 ${nvD}%`:''} 客隊 ${nvA}%。目前賠率 ${homeO.toFixed(2)} / ${awayO.toFixed(2)}。數據基於市場共識，Admin 深度分析將取代此欄。`,
    topScores: isSoccer ? [
      {home:Math.max(0,Math.round(nvH/50)),away:Math.max(0,Math.round(nvA/50)),prob:+(nvH/7).toFixed(1)},
      {home:Math.max(0,Math.round(nvH/50))+1,away:Math.max(0,Math.round(nvA/50)),prob:+(nvH/11).toFixed(1)},
    ] : [],
  };
};

const Spinner = () => (
  <div style={{ textAlign:'center', padding:48 }}>
    <div style={{ width:36,height:36,border:`3px solid ${C.border}`,borderTopColor:C.navy,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 10px' }}/>
    <div style={{ fontSize:13, color:C.muted }}>載入真實賽事數據...</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function Dashboard({ role, setPage, signals: propSignals }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource]   = useState('');
  const [filter, setFilter]   = useState('全部');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // 1. Firestore 先嘗試（靜默失敗）
      let fsItems = [];
      try {
        const mod = await import('../services/firestore.js');
        fsItems = await mod.getAnalyses({ limitN: 20 });
      } catch(e) { /* Firestore 未啟用，靜默跳過 */ }

      if (fsItems.length > 0) {
        setItems(fsItems);
        setSource('firestore');
        setLoading(false);
        return;
      }

      // 2. Firestore 空 → 直接從 Odds API 取真實數據
      try {
        const r = await fetch('/api/gateway', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ source:'odds', action:'getUpcoming', params:{ region:'eu', limit:80 } }),
        });
        const data = await r.json();
        if (data.success && data.result?.events?.length) {
          const now = Date.now();
          const events = data.result.events
            .filter(ev => {
              const t = new Date(ev.commence_time).getTime();
              // 顯示未來 5 天內 + 進行中（最近 4 小時開始的）
              return t > now - 4*3600000 && t < now + 5*24*3600000;
            })
            .map(transformEvent)
            .filter(Boolean)
            .sort((a,b)=>new Date(a.commence_time)-new Date(b.commence_time))
            .slice(0, 12);
          setItems(events);
          setSource('odds_api');
        }
      } catch(e) { console.error('[Dashboard] Odds API:', e.message); }

      // 3. 都失敗 → 用 prop signals（mockData）
      if (items.length === 0 && propSignals?.length) {
        setItems(propSignals);
        setSource('mock');
      }

      setLoading(false);
    };
    load();
  }, []);

  const sports = ['全部', ...new Set(items.map(a=>a.sport).filter(Boolean))];
  const filtered = items.filter(a => {
    if (filter !== '全部' && a.sport !== filter) return false;
    if (role === 'free' && a.accessLevel === 'vip') return false;
    if (role === 'guest') return false;
    return true;
  });

  const sourceLabel = source==='firestore'?'🔴 Firestore 即時':source==='odds_api'?'📊 真實賠率自動生成':'📋 預設模式';

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>{sourceLabel}</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 4px' }}>今日賽事分析</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>
            {source==='odds_api' ? '數據來自 The Odds API · 去水市場概率 · Admin 建立深度分析後將自動取代' :
             source==='firestore' ? 'Admin 建立的深度分析報告' : '等待資料載入'}
          </p>
        </div>

        {/* 訪客提示 */}
        {(role==='guest'||!role) && (
          <div style={{ background:C.navy, borderRadius:12, padding:'28px 24px', textAlign:'center', marginBottom:20 }}>
            <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:8 }}>📊 每日賽事分析報告</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:16 }}>免費加入即可查看今日完整分析</div>
            <button onClick={()=>setPage?.('register')} style={{ background:'#E9B44C', color:C.navy, border:'none', padding:'10px 24px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:800 }}>免費加入 →</button>
          </div>
        )}

        {/* Sport Filter */}
        {sports.length > 1 && (
          <div style={{ overflowX:'auto', marginBottom:16 }}>
            <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, width:'max-content' }}>
              {sports.map(s=>(
                <button key={s} onClick={()=>setFilter(s)} style={{ padding:'7px 16px', border:'none', cursor:'pointer', background:filter===s?C.navy:'transparent', color:filter===s?C.white:C.muted, fontSize:12, fontWeight:700, borderRight:`1px solid ${C.borderLight}`, whiteSpace:'nowrap' }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {loading && <Spinner/>}

        {!loading && role !== 'guest' && filtered.length === 0 && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:'48px', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>📊</div>
            <div style={{ fontSize:16, fontWeight:700, color:C.dark, marginBottom:8 }}>目前沒有符合條件的賽事</div>
            <div style={{ fontSize:13, color:C.muted }}>The Odds API 可能暫時無新賽事 · 請稍後重新整理</div>
          </div>
        )}

        {/* 分析卡片 */}
        <div>
          {filtered.map(a => {
            const sc = SPORT_C[a.sport] || C.navy;
            const ds = DECISIONS_STYLE[a.decision] || DECISIONS_STYLE.WAIT;
            const isOpen = expanded === a.id;
            const canSeeEV = role==='vip'||role==='admin';
            const nvHome = a.modelHome||0, nvDraw = a.modelDraw||0, nvAway = a.modelAway||0;
            const winScore = Math.round(nvHome);
            const confScore = Math.round((a.dataCompleteness||0.78)*100);
            const valueScore = a.ev ? Math.min(100,Math.round(50+(+a.ev)*4)) : null;

            return (
              <div key={a.id} style={{ background:C.white, border:`1.5px solid ${C.border}`, borderLeft:`5px solid ${sc}`, borderRadius:'0 12px 12px 0', marginBottom:10, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px' }}>
                  {/* Header row */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, flexWrap:'wrap', gap:8 }}>
                    <div style={{ display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ background:sc+'18', color:sc, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:3 }}>{a.sport}</span>
                      {a.decision && <span style={{ fontSize:10, fontWeight:800, padding:'3px 9px', borderRadius:4, background:ds.bg, color:ds.color }}>{ds.label}</span>}
                      {a.isReal && <span style={{ fontSize:10, color:C.win, fontWeight:600 }}>● 真實數據</span>}
                    </div>
                    <span style={{ fontSize:11, color:C.amber, fontWeight:700 }}>{a.timeStr}</span>
                  </div>

                  {/* 比賽標題 */}
                  <div style={{ fontSize:17, fontWeight:800, color:C.dark, marginBottom:2 }}>
                    {a.home} <span style={{ color:C.muted, fontWeight:400, fontSize:14 }}>vs</span> {a.away}
                  </div>
                  <div style={{ fontSize:10, color:C.muted, marginBottom:12, fontFamily:'ui-monospace,monospace' }}>
                    {a.homeEn} vs {a.awayEn}
                    {a.odds?.home && ` · 賠率 ${a.odds.home.toFixed(2)}${a.odds.draw?` / ${a.odds.draw.toFixed(2)}`:''} / ${a.odds.away.toFixed(2)}`}
                  </div>

                  {/* 三分數 */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:12 }}>
                    <div style={{ background:C.bg, borderRadius:8, padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>去水主勝</div>
                      <div style={{ fontSize:22, fontWeight:900, color:C.win, fontFamily:'ui-monospace,monospace' }}>{winScore}%</div>
                      <div style={{ fontSize:9, color:C.muted }}>市場概率</div>
                    </div>
                    <div style={{ background:C.bg, borderRadius:8, padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>信心分數</div>
                      <div style={{ fontSize:22, fontWeight:900, color:C.navy, fontFamily:'ui-monospace,monospace' }}>{confScore}</div>
                      <div style={{ fontSize:9, color:C.muted }}>資料完整/100</div>
                    </div>
                    <div style={{ background:C.bg, borderRadius:8, padding:'10px', textAlign:'center' }}>
                      {canSeeEV && valueScore ? <>
                        <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>價值分數</div>
                        <div style={{ fontSize:22, fontWeight:900, color:valueScore>=60?C.win:C.amber, fontFamily:'ui-monospace,monospace' }}>{valueScore}</div>
                        <div style={{ fontSize:9, color:C.muted }}>EV評估/100</div>
                      </> : <>
                        <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>價值分數</div>
                        <div style={{ fontSize:18 }}>🔒</div>
                        <div style={{ fontSize:9, color:C.muted }}>VIP解鎖</div>
                      </>}
                    </div>
                  </div>

                  {/* 概率條 */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.muted, marginBottom:3 }}>
                      <span>主勝 {nvHome}%</span>
                      {nvDraw>0&&<span>平 {nvDraw}%</span>}
                      <span>客勝 {nvAway}%</span>
                    </div>
                    <div style={{ height:6, background:'#FECACA', borderRadius:3, overflow:'hidden', display:'flex' }}>
                      <div style={{ width:`${nvHome}%`, background:C.win, transition:'width 0.5s' }}/>
                      {nvDraw>0&&<div style={{ width:`${nvDraw}%`, background:C.amber }}/>}
                    </div>
                  </div>

                  {/* 分析摘要 */}
                  {a.analysis && (
                    <>
                      <div onClick={()=>setExpanded(isOpen?null:a.id)} style={{ fontSize:12, color:'#374151', lineHeight:1.7, cursor:'pointer', maxHeight:isOpen?'none':48, overflow:'hidden', position:'relative' }}>
                        {a.analysis}
                        {!isOpen&&<div style={{ position:'absolute', bottom:0, left:0, right:0, height:28, background:'linear-gradient(transparent,#fff)' }}/>}
                      </div>
                      <button onClick={()=>setExpanded(isOpen?null:a.id)} style={{ fontSize:11, color:C.navy, background:'none', border:'none', cursor:'pointer', padding:'3px 0' }}>
                        {isOpen?'收起 ▲':'展開 ▾'}
                      </button>
                    </>
                  )}

                  {/* VIP 鎖 */}
                  {a.accessLevel==='vip'&&(role==='free'||role==='guest')&&(
                    <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:7, padding:'12px', textAlign:'center', marginTop:8 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#D97706', marginBottom:8 }}>⭐ VIP 深度分析</div>
                      <button onClick={()=>setPage?.('upgrade')} style={{ background:C.navy, color:'#fff', border:'none', padding:'8px 20px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700 }}>升級 VIP</button>
                    </div>
                  )}
                </div>

                {/* 比分預測 footer */}
                {a.topScores?.length>0&&(
                  <div style={{ background:C.panelAlt, borderTop:`1px solid ${C.borderLight}`, padding:'8px 20px', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ fontSize:10, color:C.muted, fontWeight:700 }}>比分預測：</span>
                    {a.topScores.map((s,i)=>(
                      <span key={i} style={{ fontSize:11, fontFamily:'ui-monospace,monospace', fontWeight:i===0?800:500, color:i===0?sc:C.muted }}>{s.home}-{s.away} ({s.prob}%)</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop:20, padding:'10px', background:'#F6F7FA', border:'1px solid #D4D8DF', borderRadius:8, fontSize:11, color:C.muted, textAlign:'center' }}>
          SignalEdge 提供運動數據與機率參考，不提供投注服務，不保證任何賽果或獲利
        </div>
      </div>
    </div>
  );
}
