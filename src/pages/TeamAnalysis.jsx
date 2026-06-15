import { useState, useEffect } from 'react';
import RadarChart from '../components/RadarChart';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };

const TEAM_ZH = {
  'Brazil':'巴西','France':'法國','Spain':'西班牙','Argentina':'阿根廷','Germany':'德國',
  'England':'英格蘭','Portugal':'葡萄牙','Netherlands':'荷蘭','Belgium':'比利時','Croatia':'克羅埃西亞',
  'Denmark':'丹麥','Morocco':'摩洛哥','Uruguay':'烏拉圭','USA':'美國','Mexico':'墨西哥',
  'Canada':'加拿大','Japan':'日本','South Korea':'韓國','Senegal':'塞內加爾','Ecuador':'厄瓜多',
  'Australia':'澳洲','Switzerland':'瑞士','Poland':'波蘭','Serbia':'塞爾維亞','Ghana':'迦納',
  'Cameroon':'喀麥隆','Tunisia':'突尼西亞','Costa Rica':'哥斯大黎加','Qatar':'卡達',
  'Saudi Arabia':'沙烏地阿拉伯','Iran':'伊朗','Ivory Coast':"象牙海岸",'Panama':'巴拿馬',
  'Colombia':'哥倫比亞','Chile':'智利','Paraguay':'巴拉圭','Czech Republic':'捷克',
  'Czechia':'捷克','Sweden':'瑞典','Austria':'奧地利','Norway':'挪威','Turkey':'土耳其',
  'Ukraine':'烏克蘭','Romania':'羅馬尼亞','Nigeria':'奈及利亞','Egypt':'埃及',
  'Algeria':'阿爾及利亞','New Zealand':'紐西蘭','Jamaica':'牙買加',
};

const FLAG = {
  '巴西':'🇧🇷','法國':'🇫🇷','西班牙':'🇪🇸','阿根廷':'🇦🇷','德國':'🇩🇪','英格蘭':'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  '葡萄牙':'🇵🇹','荷蘭':'🇳🇱','比利時':'🇧🇪','克羅埃西亞':'🇭🇷','丹麥':'🇩🇰','摩洛哥':'🇲🇦',
  '烏拉圭':'🇺🇾','美國':'🇺🇸','墨西哥':'🇲🇽','加拿大':'🇨🇦','日本':'🇯🇵','韓國':'🇰🇷',
  '塞內加爾':'🇸🇳','厄瓜多':'🇪🇨','澳洲':'🇦🇺','瑞士':'🇨🇭','波蘭':'🇵🇱','塞爾維亞':'🇷🇸',
  '迦納':'🇬🇭','喀麥隆':'🇨🇲','突尼西亞':'🇹🇳','哥斯大黎加':'🇨🇷','卡達':'🇶🇦',
  '沙烏地阿拉伯':'🇸🇦','伊朗':'🇮🇷','象牙海岸':'🇨🇮','巴拿馬':'🇵🇦','哥倫比亞':'🇨🇴',
  '捷克':'🇨🇿','瑞典':'🇸🇪','奧地利':'🇦🇹','土耳其':'🇹🇷','奈及利亞':'🇳🇬','埃及':'🇪🇬',
};

const callGateway = async (source, action, params) => {
  const r = await fetch('/api/gateway', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({source,action,params}) });
  const d = await r.json();
  return d.success ? d.result : null;
};

// 世界杯備用種子隊（API 失效時用）
const WC_SEEDS = [
  { id:1, enName:'Brazil', name:'巴西', flag:'🇧🇷', rank:1, stats:[{label:'攻擊力',value:91,raw:'場均進球2.3'},{label:'防守力',value:88,raw:'預選賽失球最少'},{label:'控球率',value:84,raw:'58%場均'},{label:'傳球精準',value:87,raw:'87%'},{label:'個人技術',value:93,raw:'盤帶最多'},{label:'實力評估',value:92,raw:'FIFA排名#5'}], info:'世界杯最熱門奪冠候選，2026主辦國之一' },
  { id:2, enName:'France', name:'法國', flag:'🇫🇷', rank:2, stats:[{label:'攻擊力',value:89,raw:'Mbappé領軍'},{label:'防守力',value:83,raw:'後防穩定'},{label:'控球率',value:79,raw:'55%'},{label:'傳球精準',value:86,raw:'88%'},{label:'個人技術',value:90,raw:'速度'},{label:'實力評估',value:88,raw:'衛冕熱門'}], info:'衛冕冠軍，擁有Mbappé' },
  { id:3, enName:'Spain', name:'西班牙', flag:'🇪🇸', rank:3, stats:[{label:'攻擊力',value:85,raw:'進攻多元'},{label:'防守力',value:86,raw:'穩健'},{label:'控球率',value:95,raw:'65%'},{label:'傳球精準',value:96,raw:'92%'},{label:'個人技術',value:88,raw:'Yamal天才'},{label:'實力評估',value:88,raw:'控球王'}], info:'歐洲最強控球流打法' },
  { id:4, enName:'Argentina', name:'阿根廷', flag:'🇦🇷', rank:4, stats:[{label:'攻擊力',value:88,raw:'Messi領導'},{label:'防守力',value:82,raw:'整體穩定'},{label:'控球率',value:82,raw:'54%'},{label:'傳球精準',value:85,raw:'86%'},{label:'個人技術',value:92,raw:'Messi'},{label:'實力評估',value:89,raw:'衛冕世界冠軍'}], info:'衛冕世界冠軍，有梅西' },
  { id:5, enName:'Germany', name:'德國', flag:'🇩🇪', rank:5, stats:[{label:'攻擊力',value:85,raw:'攻擊組合強'},{label:'防守力',value:84,raw:'穩固'},{label:'控球率',value:88,raw:'60%'},{label:'傳球精準',value:89,raw:'90%'},{label:'個人技術',value:84,raw:'技術全面'},{label:'實力評估',value:86,raw:'主辦國之一'}], info:'主辦國之一，科學化戰術' },
  { id:6, enName:'England', name:'英格蘭', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', rank:6, stats:[{label:'攻擊力',value:86,raw:'前場鋒群強'},{label:'防守力',value:84,raw:'穩健'},{label:'控球率',value:80,raw:'56%'},{label:'傳球精準',value:84,raw:'87%'},{label:'個人技術',value:85,raw:'Bellingham'},{label:'實力評估',value:85,raw:'奪冠熱門'}], info:'前場攻擊力超強，Bellingham領銜' },
  { id:7, enName:'Morocco', name:'摩洛哥', flag:'🇲🇦', rank:7, stats:[{label:'攻擊力',value:76,raw:'防守反擊'},{label:'防守力',value:92,raw:'2022年失球最少'},{label:'控球率',value:72,raw:'51%'},{label:'傳球精準',value:82,raw:'85%'},{label:'個人技術',value:78,raw:'整體紀律'},{label:'實力評估',value:82,raw:'黑馬大熱'}], info:'2022黑馬，防守極強' },
  { id:8, enName:'Portugal', name:'葡萄牙', flag:'🇵🇹', rank:8, stats:[{label:'攻擊力',value:87,raw:'Félix組合'},{label:'防守力',value:81,raw:'穩定'},{label:'控球率',value:78,raw:'54%'},{label:'傳球精準',value:85,raw:'87%'},{label:'個人技術',value:88,raw:'技術全面'},{label:'實力評估',value:84,raw:'B. Félix新生代'}], info:'後C羅時代，Félix引領新生代' },
];

// LOL 頂尖電競隊伍
const LOL_TEAMS = [
  { id:101, name:'T1', enName:'T1', flag:'🎮', league:'LCK', rank:1, info:'LCK王朝，Faker是史上最偉大選手', stats:[{label:'勝率',value:88,raw:'88%'},{label:'對線優勢',value:91,raw:'CSD領先'},{label:'視野控制',value:85,raw:'VS 45/場'},{label:'團戰參與',value:93,raw:'KP 82%'},{label:'資源掌控',value:87,raw:'大龍率'},{label:'逆境能力',value:82,raw:'落後反勝'}] },
  { id:102, name:'Gen.G', enName:'Gen.G', flag:'🎮', league:'LCK', rank:2, info:'Chovy對線稱霸，本賽季個人數據最高', stats:[{label:'勝率',value:82,raw:'82%'},{label:'對線優勢',value:95,raw:'CSD最高'},{label:'視野控制',value:82,raw:'VS 43/場'},{label:'團戰參與',value:88,raw:'KP 79%'},{label:'資源掌控',value:84,raw:'先鋒率'},{label:'逆境能力',value:75,raw:'落後反勝'}] },
  { id:103, name:'JDG', enName:'JDG', flag:'🎮', league:'LPL', rank:3, info:'LPL強隊，knight中單 + Kanavi打野', stats:[{label:'勝率',value:79,raw:'79%'},{label:'對線優勢',value:83,raw:'前三'},{label:'視野控制',value:80,raw:'VS 41/場'},{label:'團戰參與',value:90,raw:'KP 84%'},{label:'資源掌控',value:86,raw:'龍魂率'},{label:'逆境能力',value:78,raw:'落後反勝'}] },
  { id:104, name:'BLG', enName:'BLG', flag:'🎮', league:'LPL', rank:4, info:'Bin上單領銜，進攻型打法', stats:[{label:'勝率',value:76,raw:'76%'},{label:'對線優勢',value:80,raw:'上路主導'},{label:'視野控制',value:78,raw:'VS 40/場'},{label:'團戰參與',value:87,raw:'KP 81%'},{label:'資源掌控',value:82,raw:'強勢資源'},{label:'逆境能力',value:75,raw:'落後反勝'}] },
  { id:105, name:'KT', enName:'KT Rolster', flag:'🎮', league:'LCK', rank:5, info:'균형잡힌 팀 구성，Keria 替補期間的最強隊', stats:[{label:'勝率',value:74,raw:'74%'},{label:'對線優勢',value:78,raw:'穩定'},{label:'視野控制',value:82,raw:'VS 42/場'},{label:'團戰參與',value:86,raw:'KP 80%'},{label:'資源掌控',value:80,raw:'均衡'},{label:'逆境能力',value:80,raw:'落後反勝'}] },
  { id:106, name:'NRG', enName:'NRG', flag:'🎮', league:'LCS', rank:6, info:'北美頂尖隊伍，國際賽黑馬', stats:[{label:'勝率',value:71,raw:'71%'},{label:'對線優勢',value:72,raw:'穩定'},{label:'視野控制',value:75,raw:'VS 38/場'},{label:'團戰參與',value:84,raw:'KP 78%'},{label:'資源掌控',value:77,raw:'均衡'},{label:'逆境能力',value:76,raw:'落後反勝'}] },
];

const TeamCard = ({ team, sportColor, onCompare, isSelected }) => {
  const [tab, setTab] = useState('stats');
  const sc = sportColor || C.navy;

  return (
    <div style={{ background:C.white, border:`1.5px solid ${isSelected?sc:C.border}`, borderRadius:12, overflow:'hidden', position:'relative' }}>
      {/* 比較按鈕 */}
      <button onClick={onCompare} style={{
        position:'absolute', top:10, right:10, zIndex:2,
        background:isSelected?sc:'transparent', color:isSelected?C.white:C.muted,
        border:`1px solid ${isSelected?sc:C.border}`, borderRadius:5,
        padding:'3px 8px', cursor:'pointer', fontSize:10, fontWeight:700,
      }}>
        {isSelected?'✓ 已選':'+ 比較'}
      </button>

      <div style={{ padding:'16px 16px 0' }}>
        {/* 排名 */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <div style={{ background:sc, color:C.white, borderRadius:7, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900 }}>#{team.rank}</div>
          <div>
            {/* 中文名 + emoji */}
            <div style={{ fontSize:16, fontWeight:800, color:C.dark }}>
              {team.flag} {team.name}
            </div>
            {/* 英文名（較小） */}
            <div style={{ fontSize:11, color:C.muted }}>
              {team.enName !== team.name ? team.enName : ''} · {team.league}
            </div>
          </div>
        </div>

        {/* Tab */}
        <div style={{ display:'flex', borderBottom:`1px solid ${C.borderLight}`, marginBottom:12 }}>
          {['stats','info'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'6px 12px', border:'none', cursor:'pointer', background:'transparent', color:tab===t?sc:C.muted, fontSize:11, fontWeight:700, borderBottom:tab===t?`2px solid ${sc}`:'2px solid transparent' }}>
              {t==='stats'?'統計':'簡介'}
            </button>
          ))}
        </div>

        {tab==='stats'&&(
          <>
            {/* 雷達圖 */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
              <RadarChart stats={team.stats} color={sc} size={75}/>
            </div>
            {/* 數值列表 */}
            {team.stats.map(s=>(
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:`1px solid ${C.borderLight}` }}>
                <span style={{ fontSize:11, color:C.muted }}>{s.label}</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:11, color:C.muted }}>{s.raw}</span>
                  <div style={{ width:50, height:5, background:'#E9EBF0', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${s.value}%`, height:'100%', background:sc }}/>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:sc, fontFamily:'ui-monospace,monospace', width:24, textAlign:'right' }}>{s.value}</span>
                </div>
              </div>
            ))}
          </>
        )}
        {tab==='info'&&(
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.7, padding:'4px 0 12px' }}>{team.info||'暫無資料'}</div>
        )}
      </div>
    </div>
  );
};

export default function TeamAnalysis() {
  const [sport, setSport] = useState('世界杯');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);

  const sc = sport==='世界杯' ? '#1B5E20' : '#C89B3C';

  useEffect(() => {
    if (sport==='LOL') { setTeams(LOL_TEAMS); return; }

    // 世界杯：嘗試從 football-data.org 抓積分榜
    setLoading(true); setError('');
    callGateway('football','getStandings',{ competition:'WC' }).then(result => {
      if (result?.standings?.length > 0) {
        const flat = result.standings.flatMap(g => g.table||[]);
        const wc = flat.slice(0,32).map((s,i) => {
          const t = s.team||{};
          const zhName = TEAM_ZH[t.name] || t.name;
          const flag = FLAG[zhName] || '';
          const w=s.won||0, d=s.draw||0, l=s.lost||0, gf=s.goalsFor||0, ga=s.goalsAgainst||0;
          const played = w+d+l;
          const wr = played ? Math.round(w/played*100) : 0;
          return {
            id:t.id, name:zhName, enName:t.name, flag, league:'世界杯', rank:i+1,
            info:`小組賽戰績：${w}勝${d}平${l}負 · 進球：${gf} · 失球：${ga}`,
            stats:[
              {label:'進球效率',value:Math.min(100,Math.round(gf/(played||1)*30)),raw:`${gf}球/${played}場`},
              {label:'防守穩定',value:Math.min(100,100-Math.round(ga/(played||1)*30)),raw:`失${ga}球`},
              {label:'控場能力',value:Math.min(100,50+wr/2),raw:`勝率${wr}%`},
              {label:'積分效率',value:Math.min(100,Math.round((s.points||0)/(played*3||1)*100)),raw:`${s.points||0}分`},
              {label:'近況',value:Math.min(100,wr),raw:`${w}勝${d}平${l}負`},
              {label:'實力評估',value:Math.max(20,100-i*3),raw:`排名 #${i+1}`},
            ],
          };
        });
        setTeams(wc);
      } else {
        // API 沒資料，用備用種子隊
        setTeams(WC_SEEDS);
        setError('世界杯賽事尚未開始，顯示種子隊資料');
      }
    }).catch(()=>{ setTeams(WC_SEEDS); setError('API 暫時無法使用，顯示種子隊資料'); })
    .finally(()=>setLoading(false));
  }, [sport]);

  const toggleCompare = (team) => {
    if (!compareA || compareA.id===team.id) { setCompareA(compareA?.id===team.id?null:team); return; }
    if (!compareB || compareB.id===team.id) { setCompareB(compareB?.id===team.id?null:team); return; }
    setCompareB(team);
  };

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>隊伍數據分析</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 4px' }}>隊伍能力分析</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>點選兩支隊伍進行比較 · 數據來源：football-data.org / Liquipedia</p>
        </div>

        {/* 運動切換 */}
        <div style={{ display:'flex', gap:0, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, marginBottom:16, width:'fit-content' }}>
          {['世界杯','LOL'].map(s=>(
            <button key={s} onClick={()=>{setSport(s);setCompareA(null);setCompareB(null);}}
              style={{ padding:'8px 22px', border:'none', cursor:'pointer', background:sport===s?(s==='世界杯'?'#1B5E20':'#C89B3C'):'transparent', color:sport===s?C.white:C.muted, fontSize:13, fontWeight:700 }}>{s}</button>
          ))}
        </div>

        {error && <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:7, padding:'10px 14px', fontSize:12, color:'#92400E', marginBottom:14 }}>⚠️ {error}</div>}

        {/* 比較區域 */}
        {compareA && compareB && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 20px', marginBottom:16 }}>
            <div style={{ textAlign:'center', fontWeight:700, color:C.dark, marginBottom:12, fontSize:13 }}>
              {compareA.flag} {compareA.name} ({compareA.enName}) vs {compareB.flag} {compareB.name} ({compareB.enName})
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:16, alignItems:'center' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:14, fontWeight:800, color:C.dark, marginBottom:8 }}>{compareA.flag} {compareA.name}</div>
                <RadarChart stats={compareA.stats} color={sc} size={70}/>
              </div>
              <div style={{ fontSize:18, fontWeight:800, color:C.muted }}>VS</div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:14, fontWeight:800, color:C.dark, marginBottom:8 }}>{compareB.flag} {compareB.name}</div>
                <RadarChart stats={compareB.stats} color='#DC2626' size={70}/>
              </div>
            </div>
            <div style={{ textAlign:'center', marginTop:10 }}>
              <button onClick={()=>{setCompareA(null);setCompareB(null);}} style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, padding:'6px 14px', borderRadius:5, cursor:'pointer', fontSize:12 }}>清除比較</button>
            </div>
          </div>
        )}
        {compareA && !compareB && (
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:7, padding:'10px 14px', marginBottom:14, fontSize:12, color:C.navy }}>
            ✓ 已選 {compareA.flag} {compareA.name}（{compareA.enName}），再點一支隊伍進行比較
          </div>
        )}

        {loading && <div style={{ textAlign:'center', padding:40, color:C.muted }}>載入中...</div>}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {teams.map(team=>(
            <TeamCard key={team.id} team={team} sportColor={sc}
              onCompare={()=>toggleCompare(team)}
              isSelected={compareA?.id===team.id||compareB?.id===team.id}/>
          ))}
        </div>
      </div>
    </div>
  );
}
