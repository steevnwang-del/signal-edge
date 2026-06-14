import { useState, useEffect } from 'react';
import TeamCard from '../components/TeamCard';
import RadarChart from '../components/RadarChart';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };
const SPORT_C = { 世界杯:'#1B5E20', NBA:'#C9082A', LOL:'#C89B3C' };

const FLAG = { 'Brazil':'🇧🇷','France':'🇫🇷','Morocco':'🇲🇦','Spain':'🇪🇸','Argentina':'🇦🇷','Germany':'🇩🇪','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'🇵🇹','Netherlands':'🇳🇱','Belgium':'🇧🇪','Uruguay':'🇺🇾','USA':'🇺🇸','Canada':'🇨🇦','Japan':'🇯🇵','South Korea':'🇰🇷','Senegal':'🇸🇳','Croatia':'🇭🇷','Poland':'🇵🇱','Australia':'🇦🇺','Switzerland':'🇨🇭','Denmark':'🇩🇰','Mexico':'🇲🇽','Ecuador':'🇪🇨','Qatar':'🇶🇦' };
const ZH = { 'Brazil':'巴西','France':'法國','Morocco':'摩洛哥','Spain':'西班牙','Argentina':'阿根廷','Germany':'德國','England':'英格蘭','Portugal':'葡萄牙','Netherlands':'荷蘭','Belgium':'比利時','Uruguay':'烏拉圭','USA':'美國','Canada':'加拿大','Japan':'日本','South Korea':'韓國','Senegal':'塞內加爾','Croatia':'克羅埃西亞','Poland':'波蘭','Australia':'澳洲','Switzerland':'瑞士','Denmark':'丹麥','Mexico':'墨西哥','Ecuador':'厄瓜多','Qatar':'卡達' };

const callGateway = async (source, action, params) => {
  const r = await fetch('/api/gateway', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ source, action, params }) });
  const d = await r.json();
  return d.success ? d.result : null;
};

const transformStanding = (standing, rank) => {
  const t = standing.team || {};
  const s = standing;
  const name = ZH[t.name] || t.name;
  const flag = FLAG[t.name] || '';
  const w = s.won||0, d_ = s.draw||0, l = s.lost||0, gf = s.goalsFor||0, ga = s.goalsAgainst||0;
  const played = w + d_ + l;
  const wr = played ? Math.round(w/played*100) : 0;
  return {
    id: t.id, name, flag: `${flag} ${name}`, league:'世界杯', rank,
    form: [...Array(Math.min(played,5))].map((_,i) => i < w ? 'W' : i < w+d_ ? 'D' : 'L'),
    roster: ['陣容數據載入中...'],
    analysis: '',
    stats: [
      { label:'進球效率', value:Math.min(100,Math.round(gf/(played||1)*35)), raw:`${gf}球/${played}場`, rank, total:32 },
      { label:'防守穩定', value:Math.min(100,100-Math.round(ga/(played||1)*35)), raw:`失${ga}球`, rank:33-rank, total:32 },
      { label:'控場能力', value:Math.min(100,50+wr/2), raw:`勝率${wr}%` },
      { label:'積分效率', value:Math.min(100,Math.round((s.points||0)/(played*3||1)*100)), raw:`${s.points||0}分` },
      { label:'近況', value:Math.min(100,wr), raw:`${w}勝${d_}平${l}負` },
      { label:'實力評估', value:Math.max(20,100-rank*3), raw:`排名 #${rank}` },
    ],
  };
};

const Spinner = () => (
  <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
    <div style={{ width:36, height:36, border:`3px solid #E9EBF0`, borderTopColor:C.navy, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// LOL 頂尖隊伍（靜態，從 Liquipedia 取得）
const LOL_TEAMS = [
  { id:101, name:'T1', flag:'T1', league:'LCK', rank:1, form:['W','W','W','W','W'], roster:['Faker','Zeus','Gumayusi','Keria','Oner'], analysis:'T1 本賽季正規賽戰績 28-4，Faker 個人評分達峰值。以強悍的後期團戰和 Faker 的核心操作為主要優勢。', stats:[{ label:'勝率', value:88, raw:'88%' },{ label:'對線優勢', value:91, raw:'CSD+15 領先' },{ label:'視野控制', value:85, raw:'VS 45/場' },{ label:'團戰參與', value:93, raw:'KP 82%' },{ label:'資源掌控', value:87, raw:'先拿大龍率' },{ label:'逆境能力', value:82, raw:'落後反勝率' }] },
  { id:102, name:'Gen.G', flag:'GEN', league:'LCK', rank:2, form:['W','W','L','W','W'], roster:['Chovy','Ruler','Doran','Lehends','Canyon'], analysis:'Gen.G 以 Chovy 的個人對線能力為核心。本賽季 Chovy 對線勝率 78%，補兵差距領先聯盟第一。', stats:[{ label:'勝率', value:82, raw:'82%' },{ label:'對線優勢', value:95, raw:'CSD+15 最高' },{ label:'視野控制', value:82, raw:'VS 43/場' },{ label:'團戰參與', value:88, raw:'KP 79%' },{ label:'資源掌控', value:84, raw:'先拿峽谷先鋒' },{ label:'逆境能力', value:75, raw:'落後反勝率' }] },
  { id:103, name:'JDG', flag:'JDG', league:'LPL', rank:3, form:['W','L','W','W','W'], roster:['369','knight','Ruler','Missing','Kanavi'], analysis:'JDG 擁有最強大的物理輸出陣容，knight 的中單操控和 Kanavi 的野區意識是核心優勢。', stats:[{ label:'勝率', value:79, raw:'79%' },{ label:'對線優勢', value:83, raw:'CSD+15 前三' },{ label:'視野控制', value:80, raw:'VS 41/場' },{ label:'團戰參與', value:90, raw:'KP 84%' },{ label:'資源掌控', value:86, raw:'龍魂掌控率' },{ label:'逆境能力', value:78, raw:'落後反勝率' }] },
];

export default function TeamAnalysis() {
  const [sport, setSport] = useState('世界杯');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);

  useEffect(() => {
    if (sport === 'LOL') { setTeams(LOL_TEAMS); return; }
    if (sport === '世界杯') {
      setLoading(true);
      setError('');
      callGateway('football', 'getStandings', { competition:'WC' }).then(result => {
        if (result?.standings?.length > 0) {
          const flat = result.standings.flatMap(g => g.table || []);
          const transformed = flat.slice(0,24).map((s,i) => transformStanding(s, i+1));
          setTeams(transformed);
        } else {
          setError('世界杯數據暫時無法取得（賽事尚未開始或API額度不足），顯示種子隊名單');
          setTeams(WC_SEEDS);
        }
      }).catch(() => { setError('連線失敗，顯示備用數據'); setTeams(WC_SEEDS); })
      .finally(() => setLoading(false));
    }
  }, [sport]);

  const sc = SPORT_C[sport] || C.navy;
  const toggleCompare = (t) => {
    if (!compareA || compareA.id===t.id) { setCompareA(compareA?.id===t.id?null:t); return; }
    if (!compareB || compareB.id===t.id) { setCompareB(compareB?.id===t.id?null:t); return; }
    setCompareB(t);
  };

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>隊伍數據分析</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 4px' }}>隊伍能力分析</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>點選兩支隊伍進行比較 · 數據來源：football-data.org / Liquipedia</p>
        </div>

        <div style={{ display:'flex', gap:0, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, marginBottom:16, width:'fit-content' }}>
          {['世界杯','LOL'].map(s => (
            <button key={s} onClick={()=>{setSport(s);setCompareA(null);setCompareB(null);}} style={{ padding:'8px 22px', border:'none', cursor:'pointer', background:sport===s?(SPORT_C[s]||C.navy):'transparent', color:sport===s?C.white:C.muted, fontSize:13, fontWeight:700, borderRight:`1px solid ${C.borderLight}` }}>{s}</button>
          ))}
        </div>

        {error && <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:7, padding:'10px 14px', fontSize:12, color:'#92400E', marginBottom:14 }}>⚠️ {error}</div>}

        {compareA && compareB && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 20px', marginBottom:16 }}>
            <div style={{ textAlign:'center', marginBottom:12, fontSize:13, fontWeight:700, color:C.dark }}>隊伍比較：{compareA.flag} vs {compareB.flag}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:16, alignItems:'center' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, color:C.dark, marginBottom:8 }}>{compareA.flag}</div>
                <RadarChart stats={compareA.stats} color={sc} size={70}/>
              </div>
              <div style={{ fontSize:18, fontWeight:800, color:C.muted }}>VS</div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, color:C.dark, marginBottom:8 }}>{compareB.flag}</div>
                <RadarChart stats={compareB.stats} color="#DC2626" size={70}/>
              </div>
            </div>
            <div style={{ marginTop:10, textAlign:'center' }}>
              <button onClick={()=>{setCompareA(null);setCompareB(null);}} style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, padding:'6px 14px', borderRadius:5, cursor:'pointer', fontSize:12 }}>清除比較</button>
            </div>
          </div>
        )}

        {compareA && !compareB && (
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:7, padding:'10px 14px', marginBottom:14, fontSize:12, color:C.navy }}>
            ✓ 已選 {compareA.flag}，再點一支隊伍進行比較
          </div>
        )}

        {loading && <Spinner/>}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {teams.map(team => (
            <div key={team.id} style={{ position:'relative' }}>
              <button onClick={()=>toggleCompare(team)} style={{
                position:'absolute', top:10, right:10, zIndex:2,
                background:(compareA?.id===team.id||compareB?.id===team.id)?sc:'rgba(255,255,255,0.9)',
                color:(compareA?.id===team.id||compareB?.id===team.id)?C.white:C.muted,
                border:`1px solid ${C.border}`, borderRadius:5, padding:'3px 8px', cursor:'pointer', fontSize:10, fontWeight:700,
              }}>
                {(compareA?.id===team.id||compareB?.id===team.id)?'✓ 已選':'+ 比較'}
              </button>
              <TeamCard team={team} sportColor={sc}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 世界杯種子隊備用數據
const WC_SEEDS = [
  { id:1, name:'巴西', flag:'🇧🇷 巴西', league:'世界杯', rank:1, form:['W','W','D','W','W'], roster:['Vinicius Jr','Rodrygo','Raphinha','Casemiro','Alisson'], analysis:'世界杯最熱門奪冠候選，擁有全世界最均衡的陣容。', stats:[{ label:'攻擊力', value:91, raw:'FIFA 排名 #1' },{ label:'防守力', value:88, raw:'預選賽失球最少' },{ label:'控球率', value:84, raw:'58% 場均' },{ label:'傳球精準', value:87, raw:'87%' },{ label:'個人技術', value:93, raw:'盤帶最多' },{ label:'整體實力', value:92, raw:'最熱奪冠大熱' }] },
  { id:2, name:'法國', flag:'🇫🇷 法國', league:'世界杯', rank:2, form:['W','W','L','W','D'], roster:['Mbappé','Griezmann','Dembelé','Tchouaméni','Lloris'], analysis:'衛冕冠軍，擁有 Mbappé 這個世界最快的前鋒。中場組織是關鍵。', stats:[{ label:'攻擊力', value:89, raw:'Mbappé 最強' },{ label:'防守力', value:83, raw:'穩定後防' },{ label:'控球率', value:79, raw:'55%' },{ label:'傳球精準', value:86, raw:'88%' },{ label:'個人技術', value:90, raw:'Mbappé速度' },{ label:'整體實力', value:88, raw:'衛冕熱門' }] },
  { id:3, name:'西班牙', flag:'🇪🇸 西班牙', league:'世界杯', rank:3, form:['W','W','W','W','W'], roster:['Yamal','Morata','Pedri','Rodri','Simón'], analysis:'歐洲最強控球型打法，Yamal 是本屆最年輕的超級新星。', stats:[{ label:'攻擊力', value:85, raw:'進攻多元化' },{ label:'防守力', value:86, raw:'穩健' },{ label:'控球率', value:95, raw:'65% 聯賽最高' },{ label:'傳球精準', value:96, raw:'92%' },{ label:'個人技術', value:88, raw:'Yamal天才' },{ label:'整體實力', value:88, raw:'控球王' }] },
];
