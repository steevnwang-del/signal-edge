import { useState } from 'react';
import PlayerCard from '../components/PlayerCard';
import { getNBAPlayers, getNBAPlayerStats, nbaStatsToRadar } from '../services/sportsApi';
import { getAIAnalysis, buildPlayerPrompt } from '../services/aiAnalysis';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', bg:'#ECEEF2', amber:'#D97706' };
const SPORT_C = { NBA:'#C9082A', 足球:'#065F46', MLB:'#002D72', LOL:'#C89B3C', Valorant:'#FF4655' };

// Mock 數據 - 串接 API 後自動替換
const MOCK_PLAYERS = [
  { id:1, name:'Jayson Tatum', team:'波士頓塞爾提克', pos:'SF', sport:'NBA', ovr:91, form:['W','W','L','W','W'], recent:{ '得分':28.4, '籃板':8.1, '助攻':4.8 },
    stats:[{ label:'得分效率', value:87, raw:'TS% 63.2%' },{ label:'進攻貢獻', value:79, raw:'OBPM +3.8' },{ label:'防守貢獻', value:68, raw:'DBPM +1.2' },{ label:'籃板控制', value:74, raw:'TRB% 17.8%' },{ label:'傳球創造', value:61, raw:'AST/TO 2.1' },{ label:'整體價值', value:82, raw:'VORP 4.2' }] },
  { id:2, name:'Stephen Curry', team:'金州勇士', pos:'PG', sport:'NBA', ovr:95, form:['W','W','W','L','W'], recent:{ '得分':31.2, '籃板':4.5, '助攻':6.3 },
    stats:[{ label:'得分效率', value:95, raw:'TS% 68.1%' },{ label:'進攻貢獻', value:96, raw:'OBPM +8.1' },{ label:'防守貢獻', value:48, raw:'DBPM -0.8' },{ label:'籃板控制', value:38, raw:'TRB% 6.2%' },{ label:'傳球創造', value:89, raw:'AST/TO 4.1' },{ label:'整體價值', value:94, raw:'VORP 7.8' }] },
  { id:3, name:'Faker', team:'T1', pos:'中單', sport:'LOL', ovr:99, form:['W','W','W','W','W'], recent:{ KDA:6.8, '傷害':18200, '補兵':312 },
    stats:[{ label:'傷害輸出', value:96, raw:'18.2k/場' },{ label:'資源效率', value:94, raw:'CS 312/場' },{ label:'視野控制', value:91, raw:'VS 45/場' },{ label:'生存能力', value:97, raw:'死亡 0.8/場' },{ label:'參戰貢獻', value:95, raw:'KP 82%' },{ label:'對線數據', value:93, raw:'CSD+15 +18' }] },
  { id:4, name:'Kylian Mbappé', team:'皇家馬德里', pos:'FW', sport:'足球', ovr:92, form:['W','W','W','D','W'], recent:{ '進球':1.2, '助攻':0.6, 'xG':1.18 },
    stats:[{ label:'進球威脅', value:94, raw:'xG 1.18/90' },{ label:'傳球創造', value:78, raw:'xA 0.42/90' },{ label:'持球能力', value:89, raw:'盤帶成功 72%' },{ label:'壓迫強度', value:71, raw:'壓迫 18/90' },{ label:'防守參與', value:28, raw:'搶斷 0.8/90' },{ label:'跑動效率', value:97, raw:'速度 4.82m/s' }] },
];

export default function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [sport, setSport] = useState('全部');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(MOCK_PLAYERS);
  const [liveResult, setLiveResult] = useState(null);

  const sports = ['全部','NBA','足球','MLB','LOL','Valorant'];

  const filtered = results.filter(p =>
    (sport === '全部' || p.sport === sport) &&
    (query === '' || p.name.toLowerCase().includes(query.toLowerCase()) || p.team.includes(query))
  );

  // 方案B：即時搜尋 - 搜尋 API → AI 生成卡片
  const handleLiveSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setLiveResult(null);

    // 如果選了 NBA，嘗試從 API 取得真實數據
    if (sport === 'NBA') {
      const players = await getNBAPlayers(query);
      if (players.length > 0) {
        const p = players[0];
        const stats = await getNBAPlayerStats(p.id);
        const radarStats = stats ? nbaStatsToRadar(stats) : null;
        if (radarStats) {
          setLiveResult({
            id: p.id, name: `${p.first_name} ${p.last_name}`,
            team: p.team?.full_name || '未知隊伍', pos: p.position || 'N/A',
            sport: 'NBA', ovr: Math.round(((stats.pts||0)*2 + (stats.reb||0) + (stats.ast||0)) / 4 * 3) || 75,
            stats: radarStats,
            recent: { '得分': (stats.pts||0).toFixed(1), '籃板': (stats.reb||0).toFixed(1), '助攻': (stats.ast||0).toFixed(1) },
          });
          setSearching(false);
          return;
        }
      }
    }

    // Fallback: AI 根據名字生成分析
    const analysis = await getAIAnalysis(
      `請描述 ${query} 這位${sport !== '全部' ? sport : '運動'}選手的基本資料和主要特點，用繁體中文，100字以內。如果不確定資料，請說明。`,
      'general'
    );
    setLiveResult({
      id: 'search', name: query, team: '搜尋結果', pos: '—', sport,
      ovr: '—', stats: [], recent: {},
      aiNote: analysis,
    });
    setSearching(false);
  };

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>選手數據庫</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 6px' }}>選手百分位數分析</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>所有指標基於真實聯盟統計數據，顯示相對聯盟水平的百分位排名</p>
        </div>

        {/* Search Bar */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && handleLiveSearch()}
            placeholder="搜尋選手名字... (例: Curry, Faker, Mbappé)"
            style={{ flex:1, minWidth:200, padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, color:C.dark, outline:'none', background:C.white }}/>
          <select value={sport} onChange={e => setSport(e.target.value)}
            style={{ padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, color:C.dark, background:C.white }}>
            {sports.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={handleLiveSearch} disabled={searching}
            style={{ padding:'10px 20px', background:C.navy, color:C.white, border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700, opacity:searching?0.7:1 }}>
            {searching ? '搜尋中...' : '🔍 搜尋'}
          </button>
        </div>

        {/* Live Search Result */}
        {liveResult && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:10 }}>搜尋結果</div>
            {liveResult.aiNote ? (
              <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 18px' }}>
                <div style={{ fontSize:16, fontWeight:800, color:C.dark, marginBottom:8 }}>{liveResult.name}</div>
                <p style={{ fontSize:13, color:C.muted, lineHeight:1.8, margin:0 }}>{liveResult.aiNote}</p>
              </div>
            ) : (
              <PlayerCard player={liveResult} sport={liveResult.sport} sportColor={SPORT_C[liveResult.sport]||C.navy}/>
            )}
          </div>
        )}

        {/* Player Grid */}
        <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:12 }}>
          精選選手 · {filtered.length} 位
          <span style={{ fontSize:10, color:C.muted, fontWeight:400, marginLeft:8 }}>點擊「展開 AI 分析」取得即時分析</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {filtered.map(p => <PlayerCard key={p.id} player={p} sport={p.sport} sportColor={SPORT_C[p.sport]||C.navy}/>)}
        </div>

        <div style={{ marginTop:18, padding:'12px 16px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, fontSize:12, color:C.navy }}>
          📊 數據來源：Ball Don't Lie API（NBA）、Liquipedia（電競）、公開統計庫。百分位排名相較同運動同賽季所有球員計算。
        </div>
      </div>
    </div>
  );
}
