import { useState } from 'react';
import PlayerCard from '../components/PlayerCard';
import RadarChart from '../components/RadarChart';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };
const SPORT_C = { NBA:'#C9082A', 足球:'#065F46', MLB:'#002D72', LOL:'#C89B3C' };

const callGateway = async (source, action, params) => {
  const r = await fetch('/api/gateway', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ source, action, params }) });
  const d = await r.json();
  return d.success ? d.result : null;
};

// NBA stats → radar
const nbaToRadar = (s) => s ? [
  { label:'得分效率', value:Math.min(100,Math.round((s.fg_pct||0.4)*220)), raw:`FG% ${((s.fg_pct||0)*100).toFixed(1)}%` },
  { label:'得分貢獻', value:Math.min(100,Math.round((s.pts||10)*3)),        raw:`${(s.pts||0).toFixed(1)} PPG` },
  { label:'防守貢獻', value:Math.min(100,Math.round((s.stl||0.7)*55+(s.blk||0.3)*35)), raw:`抄 ${(s.stl||0).toFixed(1)} 蓋 ${(s.blk||0).toFixed(1)}` },
  { label:'籃板控制', value:Math.min(100,Math.round((s.reb||4)*8)),          raw:`${(s.reb||0).toFixed(1)} RPG` },
  { label:'傳球創造', value:Math.min(100,Math.round((s.ast||2.5)*11)),       raw:`${(s.ast||0).toFixed(1)} APG` },
  { label:'綜合效率', value:Math.min(100,Math.round(((s.pts||0)+(s.reb||0)+(s.ast||0))*2.2)), raw:`綜合 ${((s.pts||0)+(s.reb||0)+(s.ast||0)).toFixed(1)}` },
] : [];

const calcOVR = (stats) => {
  if (!stats.length) return 75;
  return Math.min(99, Math.round(stats.reduce((s,v)=>s+v.value,0)/stats.length));
};

const Spinner = () => (
  <div style={{ textAlign:'center', padding:40 }}>
    <div style={{ width:32, height:32, border:`3px solid ${C.border}`, borderTopColor:C.navy, borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [sport, setSport] = useState('NBA');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const sports = ['NBA', 'LOL', '足球', 'MLB'];

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    setError('');

    try {
      if (sport === 'NBA') {
        const players = await callGateway('nba', 'searchPlayer', { name: query });
        if (!players?.players?.length) { setError('找不到球員，試試英文名字（例：Curry, James, Durant）'); setSearching(false); return; }
        const found = [];
        for (const p of players.players.slice(0,3)) {
          const statsData = await callGateway('nba', 'getPlayerStats', { playerId: p.id, season: 2024 });
          const stats = nbaToRadar(statsData?.stats);
          found.push({
            id: p.id, name: `${p.first_name} ${p.last_name}`,
            team: p.team?.full_name || '未知隊伍', pos: p.position || 'N/A',
            sport: 'NBA', ovr: calcOVR(stats), stats,
            recent: statsData?.stats ? {
              '得分': (statsData.stats.pts||0).toFixed(1),
              '籃板': (statsData.stats.reb||0).toFixed(1),
              '助攻': (statsData.stats.ast||0).toFixed(1),
            } : {},
          });
        }
        setResults(found);
      }

      if (sport === 'LOL') {
        const data = await callGateway('esports', 'lolPlayer', { summonerName: query, region: 'kr' });
        if (data?.error || !data?.summoner) { setError('找不到召喚師，確認名字正確且是 KR 服（例：Faker, Chovy）'); setSearching(false); return; }
        const ranked = data.ranked;
        const wins = ranked?.wins || 0, losses = ranked?.losses || 0;
        const wr = wins+losses > 0 ? Math.round(wins/(wins+losses)*100) : 50;
        setResults([{
          id: data.summoner.id, name: query,
          team: ranked?.leagueName || 'KR 天梯', pos: '召喚師',
          sport: 'LOL', ovr: Math.min(99, 60 + Math.round(wr*0.4)),
          stats: [
            { label:'天梯段位', value: Math.min(100, (ranked?.leaguePoints||0)/100*30+40), raw: ranked ? `${ranked.tier} ${ranked.rank}` : 'Unranked' },
            { label:'勝率', value: wr, raw: `${wr}% (${wins}勝${losses}敗)` },
            { label:'LP', value: Math.min(100, (ranked?.leaguePoints||0)/10), raw: `${ranked?.leaguePoints||0} LP` },
          ],
          recent: { 勝場: wins, 敗場: losses, '勝率': `${wr}%` },
        }]);
      }

      if (sport === '足球') {
        const data = await callGateway('football', 'searchPlayer', { name: query });
        if (!data?.players?.length) { setError('找不到球員，試試英文名字（例：Mbappe, Haaland）'); setSearching(false); return; }
        setResults(data.players.slice(0,3).map(p => ({
          id: p.player?.id, name: p.player?.name || query,
          team: p.statistics?.[0]?.team?.name || '未知隊伍', pos: p.statistics?.[0]?.games?.position || 'N/A',
          sport: '足球', ovr: 80,
          stats: [
            { label:'出場數', value: Math.min(100, (p.statistics?.[0]?.games?.appearences||0)*3), raw: `${p.statistics?.[0]?.games?.appearences||0} 場` },
            { label:'進球', value: Math.min(100, (p.statistics?.[0]?.goals?.total||0)*8), raw: `${p.statistics?.[0]?.goals?.total||0} 球` },
            { label:'助攻', value: Math.min(100, (p.statistics?.[0]?.goals?.assists||0)*10), raw: `${p.statistics?.[0]?.goals?.assists||0} 次` },
          ],
          recent: {},
        })));
      }
    } catch (e) {
      setError('搜尋失敗：' + e.message);
    }
    setSearching(false);
  };

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>真實選手數據</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 6px' }}>選手即時搜尋</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>搜尋任何選手 → 即時拉取真實統計 → 生成能力雷達圖</p>
        </div>

        {/* 搜尋框 */}
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}
            placeholder={sport==='NBA'?'輸入球員英文名（例：Curry）':sport==='LOL'?'輸入召喚師名（例：Faker）':sport==='足球'?'輸入球員英文名（例：Mbappe）':'搜尋...'}
            style={{ flex:1, minWidth:220, padding:'11px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, color:C.dark, outline:'none', background:C.white }}/>
          <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white }}>
            {sports.map(s => (
              <button key={s} onClick={()=>setSport(s)} style={{ padding:'0 16px', border:'none', cursor:'pointer', background:sport===s?(SPORT_C[s]||C.navy):'transparent', color:sport===s?C.white:C.muted, fontSize:13, fontWeight:700 }}>{s}</button>
            ))}
          </div>
          <button onClick={search} disabled={searching||!query.trim()}
            style={{ padding:'11px 24px', background:C.navy, color:C.white, border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:700, opacity:searching||!query.trim()?0.6:1 }}>
            {searching?'搜尋中...':'🔍 搜尋'}
          </button>
        </div>

        {searching && <Spinner/>}

        {error && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'12px 16px', color:C.loss, fontSize:13, marginBottom:16 }}>
            ⚠️ {error}
          </div>
        )}

        {results.length > 0 && (
          <>
            <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:12 }}>找到 {results.length} 位選手</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
              {results.map(p => <PlayerCard key={p.id} player={p} sport={p.sport} sportColor={SPORT_C[p.sport]||C.navy}/>)}
            </div>
          </>
        )}

        {!searching && results.length === 0 && !error && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'40px 20px', textAlign:'center', color:C.muted }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:6 }}>搜尋任何選手</div>
            <div style={{ fontSize:13 }}>NBA：Curry / James / Tatum<br/>LOL：Faker / Chovy / Zeus<br/>足球：Mbappe / Haaland</div>
          </div>
        )}

        <div style={{ marginTop:18, padding:'10px 14px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, fontSize:12, color:C.navy }}>
          📊 NBA：Ball Don't Lie API · LOL：Riot Games API（24h key）· 足球：API-Football
        </div>
      </div>
    </div>
  );
}
