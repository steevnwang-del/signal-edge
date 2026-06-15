import { useState, useEffect, useCallback } from 'react';
import ScorePrediction from '../components/ScorePrediction';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };

// ── 只顯示台灣用戶關注的聯賽 ────────────────────────────────────────────────
const SPORT_WHITELIST = {
  'soccer_world_cup':             { zh:'世界杯', color:'#1B5E20' },
  'soccer_fifa_world_cup':        { zh:'世界杯', color:'#1B5E20' },
  'soccer_concacaf_world_cup':    { zh:'世界杯', color:'#1B5E20' },
  'basketball_nba':               { zh:'NBA',   color:'#C9082A' },
  'baseball_mlb':                 { zh:'MLB',   color:'#002D72' },
  'icehockey_nhl':                { zh:'NHL',   color:'#002654' },
  'mma_mixed_martial_arts':       { zh:'UFC',   color:'#D20A0A' },
  'americanfootball_nfl':         { zh:'NFL',   color:'#013369' },
  'soccer_epl':                   { zh:'英超',  color:'#3D195B' },
  'soccer_uefa_champs_league':    { zh:'歐冠',  color:'#003399' },
  'soccer_spain_la_liga':         { zh:'西甲',  color:'#C60B1E' },
  'soccer_germany_bundesliga':    { zh:'德甲',  color:'#D20515' },
  'soccer_italy_serie_a':         { zh:'義甲',  color:'#009246' },
  'soccer_france_ligue_one':      { zh:'法甲',  color:'#003189' },
  'soccer_netherlands_eredivisie':{ zh:'荷甲',  color:'#FF6600' },
  'soccer_uefa_europa_league':    { zh:'歐聯',  color:'#FF6600' },
  'tennis_atp_french_open':       { zh:'法網',  color:'#C75B12' },
  'tennis_wimbledon':             { zh:'溫網',  color:'#006747' },
};

// ── 隊伍中文名稱（含所有 48 支世界杯隊伍）──────────────────────────────────
const TEAM_ZH = {
  // 南美
  'Brazil':'巴西','Argentina':'阿根廷','Uruguay':'烏拉圭','Colombia':'哥倫比亞',
  'Chile':'智利','Ecuador':'厄瓜多','Paraguay':'巴拉圭','Bolivia':'玻利維亞',
  'Peru':'秘魯','Venezuela':'委內瑞拉',
  // 北中美
  'USA':'美國','Mexico':'墨西哥','Canada':'加拿大','Costa Rica':'哥斯大黎加',
  'Jamaica':'牙買加','Panama':'巴拿馬','Honduras':'宏都拉斯',
  'El Salvador':'薩爾瓦多','Trinidad and Tobago':'千里達及托巴哥',
  // 歐洲
  'France':'法國','Spain':'西班牙','Germany':'德國','England':'英格蘭',
  'Portugal':'葡萄牙','Netherlands':'荷蘭','Belgium':'比利時','Italy':'義大利',
  'Croatia':'克羅埃西亞','Denmark':'丹麥','Switzerland':'瑞士','Austria':'奧地利',
  'Serbia':'塞爾維亞','Poland':'波蘭','Czechia':'捷克','Czech Republic':'捷克',
  'Sweden':'瑞典','Norway':'挪威','Scotland':'蘇格蘭','Wales':'威爾斯',
  'Ukraine':'烏克蘭','Hungary':'匈牙利','Slovakia':'斯洛伐克','Romania':'羅馬尼亞',
  'Greece':'希臘','Turkey':'土耳其','Slovenia':'斯洛維尼亞',
  // 非洲
  'Morocco':'摩洛哥','Senegal':'塞內加爾','Ghana':'迦納','Cameroon':'喀麥隆',
  'Nigeria':'奈及利亞','Egypt':'埃及','Ivory Coast':"象牙海岸",'Tunisia':'突尼西亞',
  'Algeria':'阿爾及利亞','Mali':'馬利','South Africa':'南非',
  // 亞洲
  'Japan':'日本','South Korea':'韓國','Australia':'澳洲','Iran':'伊朗',
  'Saudi Arabia':'沙烏地阿拉伯','Qatar':'卡達','China':'中國','Iraq':'伊拉克',
  'Jordan':'約旦','Uzbekistan':'烏茲別克',
  // 大洋洲
  'New Zealand':'紐西蘭',
};

const FLAG = {
  '巴西':'🇧🇷','阿根廷':'🇦🇷','法國':'🇫🇷','西班牙':'🇪🇸','德國':'🇩🇪',
  '英格蘭':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','葡萄牙':'🇵🇹','荷蘭':'🇳🇱','比利時':'🇧🇪','義大利':'🇮🇹',
  '墨西哥':'🇲🇽','美國':'🇺🇸','加拿大':'🇨🇦','日本':'🇯🇵','韓國':'🇰🇷',
  '摩洛哥':'🇲🇦','烏拉圭':'🇺🇾','克羅埃西亞':'🇭🇷','丹麥':'🇩🇰','瑞士':'🇨🇭',
  '波蘭':'🇵🇱','厄瓜多':'🇪🇨','塞內加爾':'🇸🇳','澳洲':'🇦🇺','伊朗':'🇮🇷',
  '沙烏地阿拉伯':'🇸🇦','卡達':'🇶🇦','象牙海岸':'🇨🇮','迦納':'🇬🇭','喀麥隆':'🇨🇲',
  '突尼西亞':'🇹🇳','哥斯大黎加':'🇨🇷','塞爾維亞':'🇷🇸','巴拿馬':'🇵🇦',
  '哥倫比亞':'🇨🇴','捷克':'🇨🇿','瑞典':'🇸🇪','奧地利':'🇦🇹','土耳其':'🇹🇷',
};

const zhTeam = (enName) => {
  const zh = TEAM_ZH[enName];
  if (!zh) return enName; // 找不到就顯示英文
  const flag = FLAG[zh] || '';
  return `${flag} ${zh}`;
};

const formatTime = (iso) => {
  try {
    return new Date(iso).toLocaleString('zh-TW', {
      timeZone:'Asia/Taipei', month:'numeric', day:'numeric',
      hour:'2-digit', minute:'2-digit', hour12:false,
    }) + ' 台灣';
  } catch { return iso; }
};

const isUpcoming = (iso) => {
  const now = Date.now();
  const t = new Date(iso).getTime();
  return t > now - 3*3600000 && t < now + 5*24*3600000;
};

const Spinner = () => (
  <div style={{ textAlign:'center', padding:60, color:C.muted }}>
    <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTopColor:C.navy, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
    <div>從 The Odds API 載入賽事...</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function CalendarPage() {
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('全部');
  const [expanded, setExpanded]   = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/gateway', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ source:'odds', action:'getUpcoming', params:{ region:'eu', limit:100 } }),
      });
      const data = await r.json();
      if (data.success && data.result.events) {
        const filtered = data.result.events
          .filter(ev => SPORT_WHITELIST[ev.sport_key] && isUpcoming(ev.commence_time))
          .map(ev => {
            const sportInfo = SPORT_WHITELIST[ev.sport_key];
            const bm = ev.bookmakers?.[0];
            const h2h = bm?.markets?.find(m=>m.key==='h2h');
            const oc = h2h?.outcomes || [];
            const homeO = oc.find(o=>o.name===ev.home_team)?.price || 2;
            const awayO = oc.find(o=>o.name===ev.away_team)?.price || 2;
            const drawO = oc.find(o=>o.name==='Draw')?.price;
            const arr = [homeO, drawO, awayO].filter(Boolean);
            const imp = arr.map(o=>1/o);
            const tot = imp.reduce((s,p)=>s+p,0);
            const nv = imp.map(p=>+(p/tot*100).toFixed(0));
            return {
              id:ev.id, sport:sportInfo.zh, color:sportInfo.color,
              home: zhTeam(ev.home_team), away: zhTeam(ev.away_team),
              homeEn: ev.home_team, awayEn: ev.away_team,
              time: formatTime(ev.commence_time),
              commence_time: ev.commence_time,
              isSoccer: ev.sport_key?.startsWith('soccer'),
              isLive: Date.now() > new Date(ev.commence_time).getTime(),
              odds: { home:homeO, draw:drawO, away:awayO },
              nv: { home:nv[0], draw:drawO?nv[1]:0, away:nv[drawO?2:1] },
            };
          })
          .sort((a,b)=>new Date(a.commence_time)-new Date(b.commence_time));
        setEvents(filtered);
        setLastUpdated(new Date());
      } else {
        setError('無法取得賽事 · ' + (data.error || '請確認 ODDS_API_KEY'));
      }
    } catch(e) { setError('連線失敗：' + e.message); }
    setLoading(false);
  }, []);

  useEffect(()=>{ fetchEvents(); },[fetchEvents]);

  const sports = ['全部', ...new Set(events.map(e=>e.sport))];
  const filtered = events.filter(e=>filter==='全部'||e.sport===filter);
  const today = filtered.filter(e=>{
    const d=new Date(e.commence_time); const n=new Date();
    return d.toDateString()===n.toDateString();
  });
  const upcoming = filtered.filter(e=>{
    const d=new Date(e.commence_time); const n=new Date();
    return d.toDateString()!==n.toDateString();
  });

  const renderCard = (ev) => {
    const isOpen = expanded===ev.id;
    return (
      <div key={ev.id} style={{ background:C.white, border:`1px solid ${isOpen?ev.color:C.border}`, borderLeft:`4px solid ${ev.isLive?C.loss:ev.color}`, borderRadius:'0 10px 10px 0', marginBottom:8, overflow:'hidden' }}>
        <div onClick={()=>setExpanded(isOpen?null:ev.id)} style={{ padding:'13px 18px', cursor:'pointer' }}
          onMouseEnter={e=>e.currentTarget.style.background=C.panelAlt}
          onMouseLeave={e=>e.currentTarget.style.background=C.white}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:9, flexWrap:'wrap' }}>
            <span style={{ background:ev.color+'18', color:ev.color, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:3 }}>{ev.sport}</span>
            {ev.isLive && <span style={{ background:'#FEF2F2', color:C.loss, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:3 }}>🔴 進行中</span>}
            <span style={{ fontSize:11, fontWeight:700, color:C.amber }}>{ev.time}</span>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.dark, marginBottom:3 }}>
                {ev.home} <span style={{ color:C.muted, fontWeight:400 }}>vs</span> {ev.away}
              </div>
              {/* 中英文雙語 */}
              <div style={{ fontSize:10, color:C.muted, fontFamily:'ui-monospace,monospace' }}>
                {ev.homeEn} vs {ev.awayEn}
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:3, fontFamily:'ui-monospace,monospace' }}>
                賠率：主 {ev.odds.home.toFixed(2)}{ev.odds.draw?` 平 ${ev.odds.draw.toFixed(2)}`:''} 客 {ev.odds.away.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign:'center', minWidth:140 }}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>去水市場概率</div>
              <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:900, color:C.win, fontFamily:'ui-monospace,monospace' }}>{ev.nv.home}%</div>
                  <div style={{ fontSize:9, color:C.muted }}>主勝</div>
                </div>
                {ev.nv.draw>0&&<div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.amber, fontFamily:'ui-monospace,monospace' }}>{ev.nv.draw}%</div>
                  <div style={{ fontSize:9, color:C.muted }}>平</div>
                </div>}
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:900, color:C.loss, fontFamily:'ui-monospace,monospace' }}>{ev.nv.away}%</div>
                  <div style={{ fontSize:9, color:C.muted }}>客勝</div>
                </div>
              </div>
              <div style={{ height:5, background:C.loss+'44', borderRadius:3, overflow:'hidden', marginTop:4 }}>
                <div style={{ width:`${ev.nv.home}%`, height:'100%', background:C.win }}/>
              </div>
            </div>
            <div style={{ color:isOpen?ev.color:C.muted, fontSize:12 }}>{isOpen?'▲':'▼'}</div>
          </div>
        </div>
        {isOpen && (
          <div style={{ padding:'0 18px 14px', borderTop:`1px solid ${C.borderLight}` }}>
            {ev.isSoccer && (
              <div style={{ marginTop:12 }}>
                <ScorePrediction homeName={ev.home} awayName={ev.away}
                  homeLambda={+(ev.nv.home/40).toFixed(1)} awayLambda={+(ev.nv.away/40).toFixed(1)}/>
              </div>
            )}
            <div style={{ marginTop:10, fontSize:10, color:C.muted }}>
              ⓘ 去水概率已移除莊家水錢 · 數據僅供參考 · 不構成投注建議
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
          <button onClick={fetchEvents} disabled={loading}
            style={{ background:loading?C.muted:C.navy, color:C.white, border:'none', padding:'8px 16px', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:700 }}>
            {loading?'載入中...':'🔄 重新整理'}
          </button>
        </div>

        {/* 分類選單（只顯示已篩選的聯賽）*/}
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
        {error&&<div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'14px', color:C.loss, fontSize:13, marginBottom:12 }}>⚠️ {error}</div>}

        {!loading&&!error&&(
          <>
            {today.length>0&&(
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:10 }}>
                  📅 今日賽事 <span style={{ color:C.muted, fontWeight:400 }}>（{today.length} 場）</span>
                </div>
                {today.map(renderCard)}
              </div>
            )}
            {upcoming.length>0&&(
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:10 }}>
                  📆 未來賽事 <span style={{ color:C.muted, fontWeight:400 }}>（{upcoming.length} 場，未來 5 天）</span>
                </div>
                {upcoming.map(renderCard)}
              </div>
            )}
            {filtered.length===0&&(
              <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:9, padding:'32px', textAlign:'center', color:C.muted }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:6 }}>暫無符合條件的賽事</div>
              </div>
            )}
          </>
        )}

        <div style={{ marginTop:14, padding:'10px 14px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, fontSize:11, color:C.navy }}>
          📊 賠率來源：The Odds API · 去水概率已移除莊家水錢 · 數據僅供參考
        </div>
      </div>
    </div>
  );
}
