import { useState } from 'react';
import TeamCard from '../components/TeamCard';
import RadarChart from '../components/RadarChart';
import AIBox from '../components/AIBox';
import { buildComparePrompt } from '../services/aiAnalysis';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', panelAlt:'#F6F7FA' };
const SPORT_C = { 世界杯:'#1B5E20', NBA:'#C9082A', LOL:'#C89B3C' };

const WC_TEAMS = [
  { id:1, name:'巴西', flag:'🇧🇷', league:'世界杯 C組', rank:1, form:['W','W','D','W','W'],
    roster:['Vinicius Jr','Rodrygo','Raphinha','Casemiro','Alisson','Marquinhos','Militão','Danilo','Bruno Guimarães','Lucas Paquetá'],
    stats:[{ label:'進球效率', value:88, raw:'xG 2.1/場', rank:3, total:48 },{ label:'防守穩定', value:91, raw:'失球 0.7/場', rank:4, total:48 },{ label:'控球主導', value:82, raw:'控球率 58%', rank:8, total:48 },{ label:'傳球精準', value:85, raw:'傳球成功 87%', rank:6, total:48 },{ label:'壓迫強度', value:77, raw:'PPDA 9.2', rank:12, total:48 },{ label:'個人突破', value:90, raw:'盤帶 8.2/場', rank:5, total:48 }] },
  { id:2, name:'法國', flag:'🇫🇷', league:'世界杯 I組', rank:2, form:['W','W','L','W','D'],
    roster:['Mbappé','Griezmann','Dembelé','Tchouaméni','Lloris','Varane','Upamecano','Theo Hernandez','Camavinga','Rabiot'],
    stats:[{ label:'進球效率', value:86, raw:'xG 1.9/場', rank:5, total:48 },{ label:'防守穩定', value:83, raw:'失球 0.9/場', rank:9, total:48 },{ label:'控球主導', value:79, raw:'控球率 55%', rank:11, total:48 },{ label:'傳球精準', value:88, raw:'傳球成功 89%', rank:4, total:48 },{ label:'壓迫強度', value:81, raw:'PPDA 8.4', rank:8, total:48 },{ label:'個人突破', value:92, raw:'盤帶 9.1/場', rank:3, total:48 }] },
  { id:3, name:'西班牙', flag:'🇪🇸', league:'世界杯 H組', rank:3, form:['W','W','W','W','W'],
    roster:['Yamal','Morata','Pedri','Rodri','Unai Simón','Laporte','Carvajal','Alba','Fabián Ruiz','Olmo'],
    stats:[{ label:'進球效率', value:83, raw:'xG 1.8/場', rank:7, total:48 },{ label:'防守穩定', value:87, raw:'失球 0.6/場', rank:6, total:48 },{ label:'控球主導', value:95, raw:'控球率 66%', rank:1, total:48 },{ label:'傳球精準', value:96, raw:'傳球成功 92%', rank:1, total:48 },{ label:'壓迫強度', value:89, raw:'PPDA 7.1', rank:3, total:48 },{ label:'個人突破', value:72, raw:'盤帶 6.4/場', rank:18, total:48 }] },
  { id:4, name:'德國', flag:'🇩🇪', league:'世界杯 F組', rank:5, form:['W','L','W','W','D'],
    roster:['Musiala','Havertz','Gnabry','Kroos','Neuer','Rüdiger','Tah','Kimmich','Goretzka','Wirtz'],
    stats:[{ label:'進球效率', value:80, raw:'xG 1.7/場', rank:9, total:48 },{ label:'防守穩定', value:79, raw:'失球 1.0/場', rank:12, total:48 },{ label:'控球主導', value:84, raw:'控球率 57%', rank:7, total:48 },{ label:'傳球精準', value:87, raw:'傳球成功 88%', rank:5, total:48 },{ label:'壓迫強度', value:85, raw:'PPDA 8.0', rank:7, total:48 },{ label:'個人突破', value:74, raw:'盤帶 7.2/場', rank:14, total:48 }] },
];

export default function TeamAnalysis() {
  const [sport, setSport] = useState('世界杯');
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [showCompare, setShowCompare] = useState(false);

  const teams = WC_TEAMS;
  const sc = SPORT_C[sport] || C.navy;

  const toggleCompare = (team) => {
    if (!compareA) { setCompareA(team); return; }
    if (compareA.id === team.id) { setCompareA(null); return; }
    if (!compareB) { setCompareB(team); setShowCompare(true); return; }
    if (compareB.id === team.id) { setCompareB(null); setShowCompare(false); return; }
    setCompareB(team);
  };

  const comparePrompt = compareA && compareB ? buildComparePrompt(
    { name: compareA.name, team: compareA.name, stats: Object.fromEntries(compareA.stats.map(s=>[s.label,s.raw])) },
    { name: compareB.name, team: compareB.name, stats: Object.fromEntries(compareB.stats.map(s=>[s.label,s.raw])) },
    sport
  ) : '';

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>隊伍數據庫</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 6px' }}>隊伍數據分析</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>選擇兩支隊伍進行比較 · 所有數據基於真實統計</p>
        </div>

        {/* Sport Tabs */}
        <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, marginBottom:16, width:'fit-content' }}>
          {['世界杯','NBA','LOL'].map(s => (
            <button key={s} onClick={()=>setSport(s)} style={{ padding:'8px 20px', border:'none', cursor:'pointer', background:sport===s?(SPORT_C[s]||C.navy):'transparent', color:sport===s?C.white:C.muted, fontSize:13, fontWeight:700, borderRight:`1px solid ${C.borderLight}` }}>{s}</button>
          ))}
        </div>

        {/* Compare Banner */}
        {compareA && (
          <div style={{ background:compareA&&compareB?C.navy:C.panelAlt, border:`1px solid ${compareA&&compareB?C.navy:C.border}`, borderRadius:8, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <div style={{ fontSize:12, fontWeight:700, color:compareA&&compareB?C.white:C.dark }}>
              {compareA&&compareB?'✅ 比較':'選擇第二支隊伍進行比較'} {compareA.flag} {compareA.name}
              {compareB && <> vs {compareB.flag} {compareB.name}</>}
            </div>
            {compareA&&compareB && (
              <button onClick={()=>setShowCompare(!showCompare)} style={{ background:'rgba(255,255,255,0.2)', color:C.white, border:'1px solid rgba(255,255,255,0.4)', padding:'5px 14px', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:700 }}>
                {showCompare?'收合比較':'展開比較'}
              </button>
            )}
            <button onClick={()=>{setCompareA(null);setCompareB(null);setShowCompare(false);}} style={{ background:'transparent', color:compareA&&compareB?'rgba(255,255,255,0.6)':C.muted, border:'none', cursor:'pointer', fontSize:12 }}>✕ 清除</button>
          </div>
        )}

        {/* Compare Panel */}
        {showCompare && compareA && compareB && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'20px', marginBottom:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:20, alignItems:'center' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{compareA.flag}</div>
                <div style={{ fontSize:16, fontWeight:800, color:C.dark }}>{compareA.name}</div>
                <RadarChart stats={compareA.stats} color={sc} size={80}/>
              </div>
              <div style={{ fontSize:16, fontWeight:800, color:C.muted }}>VS</div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{compareB.flag}</div>
                <div style={{ fontSize:16, fontWeight:800, color:C.dark }}>{compareB.name}</div>
                <RadarChart stats={compareB.stats} color="#DC2626" size={80}/>
              </div>
            </div>
            <div style={{ marginTop:16 }}>
              {comparePrompt && <AIBox prompt={comparePrompt} type="compare" title="AI 隊伍比較分析"/>}
            </div>
          </div>
        )}

        {/* Team Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {teams.map(team => (
            <div key={team.id} style={{ position:'relative' }}>
              <button onClick={()=>toggleCompare(team)} style={{
                position:'absolute', top:10, right:10, zIndex:2,
                background: (compareA?.id===team.id||compareB?.id===team.id) ? sc : 'rgba(255,255,255,0.9)',
                color: (compareA?.id===team.id||compareB?.id===team.id) ? C.white : C.muted,
                border:`1px solid ${C.border}`, borderRadius:5, padding:'3px 8px', cursor:'pointer', fontSize:10, fontWeight:700,
              }}>
                {compareA?.id===team.id||compareB?.id===team.id ? '✓ 已選' : '+ 比較'}
              </button>
              <TeamCard team={team} sportColor={sc}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
