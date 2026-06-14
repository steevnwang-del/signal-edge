import { useState, useEffect, useCallback } from 'react';
import ScorePrediction from '../components/ScorePrediction';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };

const SPORT_C = { '世界杯':'#1B5E20', 'NBA':'#C9082A', 'MLB':'#002D72', 'NFL':'#013369', 'LOL':'#C89B3C', '足球':'#1B5E20', '英超':'#3D195B', '西甲':'#C60B1E', '德甲':'#D20515' };

const TEAM_ZH = {
  'Brazil':'巴西 🇧🇷','France':'法國 🇫🇷','Morocco':'摩洛哥 🇲🇦','Spain':'西班牙 🇪🇸','Argentina':'阿根廷 🇦🇷',
  'Germany':'德國 🇩🇪','England':'英格蘭 🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'葡萄牙 🇵🇹','Netherlands':'荷蘭 🇳🇱',
  'Belgium':'比利時 🇧🇪','Uruguay':'烏拉圭 🇺🇾','Mexico':'墨西哥 🇲🇽','USA':'美國 🇺🇸','Canada':'加拿大 🇨🇦',
  'Japan':'日本 🇯🇵','South Korea':'韓國 🇰🇷','Senegal':'塞內加爾 🇸🇳','Croatia':'克羅埃西亞 🇭🇷',
  'Ecuador':'厄瓜多 🇪🇨','Saudi Arabia':'沙烏地阿拉伯 🇸🇦','Qatar':'卡達 🇶🇦','Iran':'伊朗 🇮🇷',
  'Ivory Coast':"象牙海岸 🇨🇮",'Sweden':'瑞典 🇸🇪','Australia':'澳洲 🇦🇺','Switzerland':'瑞士 🇨🇭',
  'Denmark':'丹麥 🇩🇰','Serbia':'塞爾維亞 🇷🇸','Poland':'波蘭 🇵🇱','Tunisia':'突尼西亞 🇹🇳',
  'Ghana':'迦納 🇬🇭','Cameroon':'喀麥隆 🇨🇲','Colombia':'哥倫比亞 🇨🇴','Chile':'智利 🇨🇱',
  'Paraguay':'巴拉圭 🇵🇾','Costa Rica':'哥斯大黎加 🇨🇷', 'Panama':'巴拿馬 🇵🇦',
};

const SPORT_MAP = {
  'soccer_world_cup':'世界杯','soccer_fifa_world_cup':'世界杯','basketball_nba':'NBA',
  'baseball_mlb':'MLB','americanfootball_nfl':'NFL','soccer_epl':'英超',
  'soccer_spain_la_liga':'西甲','soccer_germany_bundesliga':'德甲','soccer_italy_serie_a':'義甲',
  'soccer_france_ligue_one':'法甲','soccer_uefa_champs_league':'歐冠','soccer_uefa_europa_league':'歐聯',
  'icehockey_nhl':'NHL','tennis_atp_french_open':'法網','mma_mixed_martial_arts':'UFC',
};

const zhTeam = (name) => TEAM_ZH[name] || name;

const formatTime = (iso) => {
  try {
    const d = new Date(iso);
    // 顯示台灣時間
    return d.toLocaleString('zh-TW', { timeZone:'Asia/Taipei', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false }) + ' (台灣)';
  } catch { return iso; }
};

const isUpcoming = (iso) => {
  // 只顯示未來 5 天以內的賽事
  const now = Date.now();
  const gameTime = new Date(iso).getTime();
  const fiveDays = 5 * 24 * 3600 * 1000;
  // 允許已開始但不超過 3 小時的比賽（可能仍在進行）
  return gameTime > now - 3 * 3600 * 1000 && gameTime < now + fiveDays;
};

const transformEvent = (ev) => {
  const bookmaker = ev.bookmakers?.[0];
  const h2h = bookmaker?.markets?.find(m => m.key === 'h2h');
  const outcomes = h2h?.outcomes || [];
  const homeO = outcomes.find(o => o.name === ev.home_team)?.price || 2.0;
  const awayO = outcomes.find(o => o.name === ev.away_team)?.price || 2.0;
  const drawO = outcomes.find(o => o.name === 'Draw')?.price;
  const iH = 1/homeO, iA = 1/awayO, iD = drawO ? 1/drawO : 0;
  const total = iH + iA + iD;
  // 去水概率
  const noVigHome = Math.round(iH/total*100);
  const noVigAway = Math.round(iA/total*100);
  const noVigDraw  = drawO ? Math.round(iD/total*100) : 0;

  const now = Date.now();
  const gameTime = new Date(ev.commence_time).getTime();
  const status = gameTime < now ? 'live' : 'upcoming';

  return {
    id: ev.id, sport: SPORT_MAP[ev.sport_key] || ev.sport_title,
    sportKey: ev.sport_key,
    home: { name: zhTeam(ev.home_team), orig: ev.home_team },
    away: { name: zhTeam(ev.away_team), orig: ev.away_team },
    time: formatTime(ev.commence_time),
    commence_time: ev.commence_time,
    stage: ev.sport_title, status,
    modelHome: noVigHome, modelDraw: noVigDraw, modelAway: noVigAway,
    odds: { home: homeO, away: awayO, draw: drawO },
    isSoccer: ev.sport_key?.startsWith('soccer'),
    isLive: status === 'live',
  };
};

const Spinner = () => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:60, color:C.muted }}>
    <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTopColor:C.navy, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    <div style={{ fontSize:13 }}>從 The Odds API 載入即時賽事...</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('全部');
  const [expanded, setExpanded] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchEvents = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/gateway', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ source:'odds', action:'getUpcoming', params:{ region:'eu', limit:50 } }),
      });
      const data = await r.json();
      if (data.success && data.result.events) {
        // 過濾：只顯示未來的賽事（不含已結束的）
        const upcoming = data.result.events
          .filter(ev => isUpcoming(ev.commence_time))
          .map(transformEvent)
          .sort((a,b) => new Date(a.commence_time) - new Date(b.commence_time));
        setEvents(upcoming);
        setLastUpdated(new Date());
      } else {
        setError(data.result?.error || '無法取得賽事，請確認 ODDS_API_KEY 已設定');
      }
    } catch(e) {
      setError('連線失敗：' + e.message);
    }
    if (showLoader) setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const sports = ['全部', ...new Set(events.map(e => e.sport))];
  const filtered = events.filter(e => filter === '全部' || e.sport === filter);

  // 今天的賽事
  const todayEvents = filtered.filter(e => {
    const d = new Date(e.commence_time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const otherEvents = filtered.filter(e => {
    const d = new Date(e.commence_time);
    const now = new Date();
    return d.toDateString() !== now.toDateString();
  });

  const renderEvent = (ev) => {
    const sc = SPORT_C[ev.sport] || C.navy;
    const isOpen = expanded === ev.id;
    return (
      <div key={ev.id} style={{ background:C.white, border:`1px solid ${isOpen?sc:C.border}`, borderLeft:`4px solid ${ev.isLive?C.loss:sc}`, borderRadius:'0 9px 9px 0', overflow:'hidden', marginBottom:8 }}>
        <div onClick={()=>setExpanded(isOpen?null:ev.id)} style={{ padding:'13px 18px', cursor:'pointer' }}
          onMouseEnter={e=>e.currentTarget.style.background=C.panelAlt}
          onMouseLeave={e=>e.currentTarget.style.background=C.white}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:9, flexWrap:'wrap' }}>
            <span style={{ background:sc+'18', color:sc, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:3 }}>{ev.sport}</span>
            {ev.isLive && <span style={{ background:'#FEF2F2', color:C.loss, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:3, animation:'pulse 1.5s infinite' }}>🔴 進行中</span>}
            <span style={{ fontSize:11, fontWeight:700, color:C.amber }}>{ev.time}</span>
            <span style={{ fontSize:10, color:C.muted }}>{ev.stage}</span>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.dark }}>{ev.home.name} <span style={{ color:C.muted, fontWeight:400 }}>vs</span> {ev.away.name}</div>
              {ev.odds.home && (
                <div style={{ fontSize:11, color:C.muted, marginTop:4, fontFamily:'ui-monospace,monospace' }}>
                  賠率：主 {ev.odds.home.toFixed(2)}{ev.odds.draw?` · 平 ${ev.odds.draw.toFixed(2)}`:''} · 客 {ev.odds.away.toFixed(2)}
                </div>
              )}
            </div>
            <div style={{ textAlign:'center', minWidth:150 }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>去水市場概率</div>
              <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:C.win, fontFamily:'ui-monospace,monospace' }}>{ev.modelHome}%</div>
                  <div style={{ fontSize:9, color:C.muted }}>主勝</div>
                </div>
                {ev.modelDraw > 0 && (
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.amber, fontFamily:'ui-monospace,monospace' }}>{ev.modelDraw}%</div>
                    <div style={{ fontSize:9, color:C.muted }}>平</div>
                  </div>
                )}
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:C.loss, fontFamily:'ui-monospace,monospace' }}>{ev.modelAway}%</div>
                  <div style={{ fontSize:9, color:C.muted }}>客勝</div>
                </div>
              </div>
              <div style={{ height:5, background:C.loss+'44', borderRadius:3, overflow:'hidden', marginTop:5 }}>
                <div style={{ width:`${ev.modelHome}%`, height:'100%', background:C.win }}/>
              </div>
            </div>
            <div style={{ color:isOpen?sc:C.muted, fontSize:12 }}>{isOpen?'▲':'▼'}</div>
          </div>
        </div>
        {isOpen && (
          <div style={{ padding:'0 18px 16px', borderTop:`1px solid ${C.borderLight}` }}>
            {ev.isSoccer && ev.modelHome > 0 && (
              <div style={{ marginTop:14 }}>
                <ScorePrediction homeName={ev.home.name} awayName={ev.away.name}
                  homeLambda={+(ev.modelHome/38).toFixed(1)}
                  awayLambda={+(ev.modelAway/38).toFixed(1)}/>
              </div>
            )}
            <div style={{ marginTop:10, fontSize:10, color:C.muted }}>
              ⓘ 概率基於市場賠率去水計算，統計參數僅供研究參考，不構成任何投注建議
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:10, marginBottom:22 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>即時賽事</div>
            <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 4px' }}>賽程 · 真實賠率</h2>
            <p style={{ color:C.muted, fontSize:13, margin:0 }}>
              來源：The Odds API · 台灣時間顯示
              {lastUpdated && <span style={{ marginLeft:8, fontSize:11 }}>· 更新於 {lastUpdated.toLocaleTimeString('zh-TW')}</span>}
            </p>
          </div>
          <button onClick={()=>fetchEvents(true)} disabled={loading}
            style={{ background:loading?C.muted:C.navy, color:C.white, border:'none', padding:'8px 16px', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
            {loading ? '載入中...' : '🔄 重新整理'}
          </button>
        </div>

        {/* 分類 */}
        {sports.length > 1 && (
          <div style={{ overflowX:'auto', marginBottom:16 }}>
            <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, width:'max-content' }}>
              {sports.map(s => (
                <button key={s} onClick={()=>setFilter(s)} style={{ padding:'7px 16px', border:'none', cursor:'pointer', background:filter===s?C.navy:'transparent', color:filter===s?C.white:C.muted, fontSize:12, fontWeight:700, borderRight:`1px solid ${C.borderLight}`, whiteSpace:'nowrap' }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {loading && <Spinner/>}

        {error && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'14px 16px', color:C.loss, fontSize:13, marginBottom:16 }}>
            ⚠️ {error}
            <div style={{ marginTop:8, fontSize:11, color:C.muted }}>
              請確認：1. ODDS_API_KEY 已設定 2. Vercel 已 Redeploy 3. Admin → API設定 → 測試連線
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* 今天的賽事 */}
            {todayEvents.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
                  📅 今日賽事
                  <span style={{ fontSize:11, color:C.muted, fontWeight:400 }}>（{todayEvents.length} 場）</span>
                </div>
                {todayEvents.map(renderEvent)}
              </div>
            )}

            {/* 未來賽事 */}
            {otherEvents.length > 0 && (
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:10 }}>
                  📆 未來賽事
                  <span style={{ fontSize:11, color:C.muted, fontWeight:400, marginLeft:8 }}>（{otherEvents.length} 場，未來 5 天）</span>
                </div>
                {otherEvents.map(renderEvent)}
              </div>
            )}

            {filtered.length === 0 && (
              <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:9, padding:'32px', textAlign:'center', color:C.muted }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:6 }}>暫無即將開賽的賽事</div>
                <div style={{ fontSize:12 }}>The Odds API 目前沒有返回開賽賽事，請稍後重新整理</div>
              </div>
            )}
          </>
        )}

        <div style={{ marginTop:14, padding:'10px 14px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, fontSize:11, color:C.navy }}>
          📊 賠率數據來源：The Odds API · 去水概率已移除莊家水錢 · 數據僅供參考，不構成投注建議
        </div>
      </div>
    </div>
  );
}
