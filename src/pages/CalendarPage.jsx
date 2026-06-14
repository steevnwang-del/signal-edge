import { useState, useEffect } from 'react';
import ScorePrediction from '../components/ScorePrediction';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };

const SPORT_C = { 世界杯:'#1B5E20', NBA:'#C9082A', MLB:'#002D72', NFL:'#013369', LOL:'#C89B3C', Valorant:'#FF4655', 足球:'#1B5E20' };

const TEAM_ZH = {
  'Brazil':'巴西 🇧🇷','France':'法國 🇫🇷','Morocco':'摩洛哥 🇲🇦','Spain':'西班牙 🇪🇸',
  'Argentina':'阿根廷 🇦🇷','Germany':'德國 🇩🇪','England':'英格蘭 🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'葡萄牙 🇵🇹',
  'Netherlands':'荷蘭 🇳🇱','Belgium':'比利時 🇧🇪','Uruguay':'烏拉圭 🇺🇾','Mexico':'墨西哥 🇲🇽',
  'USA':'美國 🇺🇸','Canada':'加拿大 🇨🇦','Japan':'日本 🇯🇵','South Korea':'韓國 🇰🇷',
  'Senegal':'塞內加爾 🇸🇳','Ghana':'迦納 🇬🇭','Croatia':'克羅埃西亞 🇭🇷','Poland':'波蘭 🇵🇱',
  'Australia':'澳洲 🇦🇺','Switzerland':'瑞士 🇨🇭','Denmark':'丹麥 🇩🇰','Serbia':'塞爾維亞 🇷🇸',
  'Ecuador':'厄瓜多 🇪🇨','Qatar':'卡達 🇶🇦','Iran':'伊朗 🇮🇷','Saudi Arabia':'沙烏地阿拉伯 🇸🇦',
  'Costa Rica':'哥斯大黎加 🇨🇷','Tunisia':'突尼西亞 🇹🇳','Cameroon':'喀麥隆 🇨🇲',
};

const SPORT_MAP = {
  'soccer_world_cup':'世界杯','soccer_fifa_world_cup':'世界杯','basketball_nba':'NBA',
  'baseball_mlb':'MLB','americanfootball_nfl':'NFL','soccer_epl':'英超',
  'soccer_spain_la_liga':'西甲','soccer_germany_bundesliga':'德甲','soccer_italy_serie_a':'義甲',
  'soccer_france_ligue_one':'法甲','soccer_uefa_champs_league':'歐冠',
};

const zhTeam = (name) => TEAM_ZH[name] || name;
const formatTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-TW', { timeZone:'Asia/Taipei', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false });
  } catch { return iso; }
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
  return {
    id: ev.id,
    sport: SPORT_MAP[ev.sport_key] || ev.sport_title,
    home: { name: zhTeam(ev.home_team) },
    away: { name: zhTeam(ev.away_team) },
    time: formatTime(ev.commence_time),
    stage: ev.sport_title,
    modelHome: Math.round(iH/total*100),
    modelDraw: drawO ? Math.round(iD/total*100) : 0,
    modelAway: Math.round(iA/total*100),
    odds: { home: homeO, away: awayO, draw: drawO },
    isSoccer: ev.sport_key.startsWith('soccer'),
    homeLambda: null, awayLambda: null, analysis: '',
  };
};

const Spinner = () => (
  <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
    <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTopColor:C.navy, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('全部');
  const [expanded, setExpanded] = useState(null);
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/gateway', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ source:'odds', action:'getUpcoming', params:{ region:'eu', limit:30 } }),
        });
        const data = await r.json();
        if (data.success && data.result.events) {
          setEvents(data.result.events.map(transformEvent));
          setRemaining(data.result.remaining);
        } else {
          setError('無法取得賽事數據，請確認 ODDS_API_KEY 已設定');
        }
      } catch (e) {
        setError('連線失敗：' + e.message);
      }
      setLoading(false);
    };
    fetch_();
  }, []);

  const sports = ['全部', ...new Set(events.map(e => e.sport))];
  const filtered = events.filter(e => filter === '全部' || e.sport === filter);

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22, display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>真實賽事數據</div>
            <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 4px' }}>即將開賽 · 真實賠率</h2>
            <p style={{ color:C.muted, fontSize:13, margin:0 }}>數據來源：The Odds API · 台灣時間</p>
          </div>
          {remaining !== null && (
            <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:7, padding:'8px 14px', fontSize:12 }}>
              <span style={{ color:C.muted }}>API 剩餘額度：</span>
              <span style={{ fontWeight:700, color:remaining > 100 ? C.win : C.amber, fontFamily:'ui-monospace,monospace' }}>{remaining}</span>
              <span style={{ color:C.muted }}>/500</span>
            </div>
          )}
        </div>

        {/* Sport Tabs */}
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
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'16px 18px', color:C.loss, fontSize:13 }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:9, padding:'32px', textAlign:'center', color:C.muted }}>
            目前沒有符合條件的賽事
          </div>
        )}

        <div style={{ display:'grid', gap:10 }}>
          {filtered.map(ev => {
            const sc = SPORT_C[ev.sport] || C.navy;
            const isOpen = expanded === ev.id;
            return (
              <div key={ev.id} style={{ background:C.white, border:`1px solid ${isOpen?sc:C.border}`, borderLeft:`4px solid ${sc}`, borderRadius:'0 9px 9px 0', overflow:'hidden' }}>
                <div onClick={()=>setExpanded(isOpen?null:ev.id)} style={{ padding:'14px 18px', cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.panelAlt}
                  onMouseLeave={e=>e.currentTarget.style.background=C.white}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10, flexWrap:'wrap' }}>
                    <span style={{ background:sc+'18', color:sc, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:3 }}>{ev.sport}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:C.amber }}>{ev.time}</span>
                    <span style={{ fontSize:10, color:C.muted }}>{ev.stage}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:C.dark }}>{ev.home.name} <span style={{ color:C.muted, fontWeight:400 }}>vs</span> {ev.away.name}</div>
                      {ev.odds.home && (
                        <div style={{ fontSize:11, color:C.muted, marginTop:4, fontFamily:'ui-monospace,monospace' }}>
                          主 {ev.odds.home.toFixed(2)} {ev.odds.draw?`平 ${ev.odds.draw.toFixed(2)} `:''} 客 {ev.odds.away.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign:'center', minWidth:150 }}>
                      <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>市場隱含概率</div>
                      <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'center' }}>
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
                  <div style={{ padding:'0 18px 18px', borderTop:`1px solid ${C.borderLight}` }}>
                    {ev.isSoccer && (
                      <div style={{ marginTop:14 }}>
                        <ScorePrediction homeName={ev.home.name} awayName={ev.away.name}
                          homeLambda={ev.homeLambda||+(ev.modelHome/40).toFixed(1)}
                          awayLambda={ev.awayLambda||+(ev.modelAway/40).toFixed(1)}/>
                      </div>
                    )}
                    <div style={{ marginTop:10, fontSize:10, color:C.muted }}>
                      ⓘ 概率基於市場賠率計算，統計參數僅供研究參考，不構成任何投注建議
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
