import { useState, useEffect } from 'react';
import RadarChart from '../components/RadarChart';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };
const SPORT_C = { 世界杯:'#1B5E20', NBA:'#C9082A', MLB:'#002D72', LOL:'#C89B3C' };

const callGW = async (source, action, params) => {
  const r = await fetch('/api/gateway', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({source,action,params}) });
  const d = await r.json();
  return d.success ? d.result : null;
};

// ── WC 隊伍 ────────────────────────────────────────────────────────────────
const WC_MAP = {
  'Brazil':'巴西','France':'法國','Spain':'西班牙','Argentina':'阿根廷','Germany':'德國',
  'England':'英格蘭','Portugal':'葡萄牙','Netherlands':'荷蘭','Belgium':'比利時',
  'Morocco':'摩洛哥','Uruguay':'烏拉圭','USA':'美國','Mexico':'墨西哥','Canada':'加拿大',
  'Japan':'日本','South Korea':'韓國','Senegal':'塞內加爾','Ecuador':'厄瓜多',
  'Australia':'澳洲','Switzerland':'瑞士','Poland':'波蘭','Serbia':'塞爾維亞',
  'Croatia':'克羅埃西亞','Denmark':'丹麥','Czechia':'捷克','Czech Republic':'捷克',
  'Sweden':'瑞典','Colombia':'哥倫比亞','Chile':'智利','Ivory Coast':'象牙海岸',
  'Ghana':'迦納','Cameroon':'喀麥隆','Tunisia':'突尼西亞','Costa Rica':'哥斯大黎加',
  'Qatar':'卡達','Saudi Arabia':'沙烏地阿拉伯','Iran':'伊朗','Panama':'巴拿馬',
  'Austria':'奧地利','Turkey':'土耳其','Paraguay':'巴拉圭',
};
const FLAG={巴西:'🇧🇷',法國:'🇫🇷',西班牙:'🇪🇸',阿根廷:'🇦🇷',德國:'🇩🇪',英格蘭:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',葡萄牙:'🇵🇹',荷蘭:'🇳🇱',比利時:'🇧🇪',摩洛哥:'🇲🇦',烏拉圭:'🇺🇾',美國:'🇺🇸',墨西哥:'🇲🇽',加拿大:'🇨🇦',日本:'🇯🇵',韓國:'🇰🇷',塞內加爾:'🇸🇳',厄瓜多:'🇪🇨',澳洲:'🇦🇺',瑞士:'🇨🇭',波蘭:'🇵🇱',塞爾維亞:'🇷🇸',克羅埃西亞:'🇭🇷',丹麥:'🇩🇰',捷克:'🇨🇿',瑞典:'🇸🇪',哥倫比亞:'🇨🇴',智利:'🇨🇱',象牙海岸:'🇨🇮',迦納:'🇬🇭',喀麥隆:'🇨🇲',突尼西亞:'🇹🇳',哥斯大黎加:'🇨🇷',卡達:'🇶🇦',沙烏地阿拉伯:'🇸🇦',伊朗:'🇮🇷',巴拿馬:'🇵🇦',奧地利:'🇦🇹',土耳其:'🇹🇷',巴拉圭:'🇵🇾'};

// NBA 隊伍中文名
const NBA_ZH = {
  'Boston Celtics':'波士頓塞爾提克','Golden State Warriors':'金州勇士','Los Angeles Lakers':'洛杉磯湖人',
  'Miami Heat':'邁阿密熱火','Milwaukee Bucks':'密爾瓦基公鹿','Phoenix Suns':'鳳凰城太陽',
  'Denver Nuggets':'丹佛金塊','Philadelphia 76ers':'費城76人','New York Knicks':'紐約尼克',
  'Oklahoma City Thunder':'奧克拉荷馬城雷霆','Minnesota Timberwolves':'明尼蘇達灰狼',
  'Cleveland Cavaliers':'克里夫蘭騎士','Indiana Pacers':'印第安納溜馬','Orlando Magic':'奧蘭多魔術',
  'Dallas Mavericks':'達拉斯獨行俠','Sacramento Kings':'沙加緬度國王',
  'New Orleans Pelicans':'紐奧良鵜鶘','Toronto Raptors':'多倫多暴龍',
  'Memphis Grizzlies':'曼菲斯灰熊','Atlanta Hawks':'亞特蘭大老鷹',
  'Houston Rockets':'休士頓火箭','San Antonio Spurs':'聖安東尼奧馬刺',
  'Los Angeles Clippers':'洛杉磯快艇','Utah Jazz':'猶他爵士',
  'Portland Trail Blazers':'波特蘭拓荒者','Chicago Bulls':'芝加哥公牛',
  'Brooklyn Nets':'布魯克林籃網','Washington Wizards':'華盛頓巫師',
  'Charlotte Hornets':'夏洛特黃蜂','Detroit Pistons':'底特律活塞',
};

// MLB 隊伍中文名
const MLB_ZH = {
  'Los Angeles Dodgers':'洛杉磯道奇','New York Yankees':'紐約洋基','Houston Astros':'休士頓太空人',
  'Atlanta Braves':'亞特蘭大勇士','New York Mets':'紐約大都會','Boston Red Sox':'波士頓紅襪',
  'Chicago Cubs':'芝加哥小熊','San Francisco Giants':'舊金山巨人','St. Louis Cardinals':'聖路易紅雀',
  'Philadelphia Phillies':'費城費城人','San Diego Padres':'聖地牙哥教士','Toronto Blue Jays':'多倫多藍鳥',
  'Seattle Mariners':'西雅圖水手','Texas Rangers':'德州遊騎兵','Tampa Bay Rays':'坦帕灣光芒',
  'Cleveland Guardians':'克里夫蘭守護者','Minnesota Twins':'明尼蘇達雙城',
  'Baltimore Orioles':'巴爾的摩金鶯','Milwaukee Brewers':'密爾瓦基釀酒人',
  'Miami Marlins':'邁阿密馬林魚',
};

// LOL 隊伍
const LOL_TEAMS = [
  {id:101,name:'T1',enName:'T1',flag:'🎮',league:'LCK',rank:1,info:'LCK王朝，Faker史上最偉大選手',roster:[{name:'Zeus',pos:'上路'},{name:'Oner',pos:'打野'},{name:'Faker',pos:'中路',star:true},{name:'Gumayushi',pos:'射手'},{name:'Keria',pos:'輔助',star:true}],stats:[{label:'勝率',value:88,raw:'88%'},{label:'對線',value:91,raw:'CSD+'},{label:'視野',value:85,raw:'VS45'},{label:'團戰',value:93,raw:'KP82%'},{label:'資源',value:87,raw:'大龍率'},{label:'逆境',value:82,raw:'落後反勝'}]},
  {id:102,name:'Gen.G',enName:'Gen.G',flag:'🎮',league:'LCK',rank:2,info:'Chovy對線稱霸',roster:[{name:'Doran',pos:'上路'},{name:'Canyon',pos:'打野',star:true},{name:'Chovy',pos:'中路',star:true},{name:'Peyz',pos:'射手'},{name:'Lehends',pos:'輔助'}],stats:[{label:'勝率',value:82,raw:'82%'},{label:'對線',value:95,raw:'最高'},{label:'視野',value:82,raw:'VS43'},{label:'團戰',value:88,raw:'KP79%'},{label:'資源',value:84,raw:'先鋒'},{label:'逆境',value:75,raw:'落後反勝'}]},
  {id:103,name:'JDG',enName:'JDG',flag:'🎮',league:'LPL',rank:3,info:'knight中單 + Kanavi打野',roster:[{name:'369',pos:'上路'},{name:'Kanavi',pos:'打野',star:true},{name:'knight',pos:'中路',star:true},{name:'Ruler',pos:'射手',star:true},{name:'Missing',pos:'輔助'}],stats:[{label:'勝率',value:79,raw:'79%'},{label:'對線',value:83,raw:'前三'},{label:'視野',value:80,raw:'VS41'},{label:'團戰',value:90,raw:'KP84%'},{label:'資源',value:86,raw:'龍魂'},{label:'逆境',value:78,raw:'落後反勝'}]},
  {id:104,name:'BLG',enName:'Bilibili Gaming',flag:'🎮',league:'LPL',rank:4,info:'Bin上單強勢領銜',roster:[{name:'Bin',pos:'上路',star:true},{name:'Xun',pos:'打野'},{name:'Yika',pos:'中路'},{name:'Elk',pos:'射手'},{name:'ON',pos:'輔助'}],stats:[{label:'勝率',value:76,raw:'76%'},{label:'對線',value:80,raw:'上路主導'},{label:'視野',value:78,raw:'VS40'},{label:'團戰',value:87,raw:'KP81%'},{label:'資源',value:82,raw:'強勢'},{label:'逆境',value:75,raw:'落後反勝'}]},
  {id:105,name:'KT',enName:'KT Rolster',flag:'🎮',league:'LCK',rank:5,info:'Bdd中單+Deft老將',roster:[{name:'Kiin',pos:'上路'},{name:'Cuzz',pos:'打野'},{name:'Bdd',pos:'中路',star:true},{name:'Deft',pos:'射手',star:true},{name:'Lehends',pos:'輔助'}],stats:[{label:'勝率',value:74,raw:'74%'},{label:'對線',value:78,raw:'穩定'},{label:'視野',value:82,raw:'VS42'},{label:'團戰',value:86,raw:'KP80%'},{label:'資源',value:80,raw:'均衡'},{label:'逆境',value:80,raw:'落後反勝'}]},
];

const WC_SEEDS=[{id:1,enName:'Brazil',name:'巴西',flag:'🇧🇷',rank:1,info:'世界杯最熱門奪冠候選，維尼修斯Jr為核心',stats:[{label:'攻擊力',value:91,raw:'2.3進球/場'},{label:'防守力',value:88,raw:'失球最少'},{label:'控球率',value:84,raw:'58%'},{label:'傳球精準',value:87,raw:'87%'},{label:'個人技術',value:93,raw:'最多盤帶'},{label:'整體實力',value:92,raw:'FIFA前5'}]},{id:2,enName:'France',name:'法國',flag:'🇫🇷',rank:2,info:'衛冕冠軍，姆巴佩最快前鋒',stats:[{label:'攻擊力',value:89,raw:'姆巴佩'},{label:'防守力',value:83,raw:'穩定'},{label:'控球率',value:79,raw:'55%'},{label:'傳球精準',value:86,raw:'88%'},{label:'個人技術',value:90,raw:'速度'},{label:'整體實力',value:88,raw:'衛冕'}]},{id:3,enName:'Spain',name:'西班牙',flag:'🇪🇸',rank:3,info:'控球流，亞馬爾天才新星',stats:[{label:'攻擊力',value:85,raw:'多元'},{label:'防守力',value:86,raw:'穩健'},{label:'控球率',value:95,raw:'65%'},{label:'傳球精準',value:96,raw:'92%'},{label:'個人技術',value:88,raw:'亞馬爾'},{label:'整體實力',value:88,raw:'控球王'}]},{id:4,enName:'Argentina',name:'阿根廷',flag:'🇦🇷',rank:4,info:'衛冕冠軍，梅西最後一屆',stats:[{label:'攻擊力',value:88,raw:'梅西'},{label:'防守力',value:82,raw:'穩定'},{label:'控球率',value:82,raw:'54%'},{label:'傳球精準',value:85,raw:'86%'},{label:'個人技術',value:92,raw:'GOAT'},{label:'整體實力',value:89,raw:'衛冕'}]},{id:5,enName:'Germany',name:'德國',flag:'🇩🇪',rank:5,info:'主辦國之一，科學化戰術',stats:[{label:'攻擊力',value:85,raw:'多組合'},{label:'防守力',value:84,raw:'穩固'},{label:'控球率',value:88,raw:'60%'},{label:'傳球精準',value:89,raw:'90%'},{label:'個人技術',value:84,raw:'全面'},{label:'整體實力',value:86,raw:'主辦國'}]},{id:6,enName:'Morocco',name:'摩洛哥',flag:'🇲🇦',rank:6,info:'2022黑馬，防守極強',stats:[{label:'攻擊力',value:76,raw:'防守反擊'},{label:'防守力',value:92,raw:'最強'},{label:'控球率',value:72,raw:'51%'},{label:'傳球精準',value:82,raw:'85%'},{label:'個人技術',value:78,raw:'紀律'},{label:'整體實力',value:82,raw:'黑馬'}]}];

// 轉換 ESPN NBA 數據
const transformNBATeam = (team, standing, rank) => {
  const record = standing?.records?.[0];
  const wins = record?.wins||0, losses = record?.losses||0;
  const pct = wins+losses ? Math.round(wins/(wins+losses)*100) : 0;
  const zhName = NBA_ZH[team.displayName] || team.displayName;
  return {
    id: team.id, name: zhName, enName: team.displayName,
    flag: team.abbreviation||'', league: standing?.conference?.name?.includes('East')?'東區':'西區',
    rank, info: `${wins}勝${losses}負 · 勝率${pct}%`,
    stats: [
      {label:'本賽季勝率',value:pct,raw:`${pct}%`},
      {label:'勝負差',value:Math.max(0,Math.min(100,50+(wins-losses)*3)),raw:`${wins}勝${losses}負`},
      {label:'聯區排名',value:Math.max(10,100-rank*6),raw:`#${rank}`},
      {label:'主場優勢',value:Math.min(100,pct+5),raw:`主場`},
      {label:'客場戰績',value:Math.max(20,pct-10),raw:`客場`},
      {label:'整體實力',value:Math.max(20,100-rank*4),raw:`排名#${rank}`},
    ],
  };
};

// 轉換 MLB 數據
const transformMLBTeam = (team, rank) => {
  const zhName = MLB_ZH[team.teamName] || MLB_ZH[team.name] || team.teamName || team.name;
  const wins = team.wins||0, losses = team.losses||0;
  const pct = wins+losses ? Math.round(wins/(wins+losses)*100) : 0;
  return {
    id:team.id, name:zhName||'未知', enName:team.teamName||team.name,
    flag:'⚾', league:'MLB', rank,
    info:`${wins}勝${losses}負 · 勝率${pct}%`,
    stats:[
      {label:'勝率',value:pct,raw:`${pct}%`},
      {label:'勝負差',value:Math.max(0,Math.min(100,50+(wins-losses)*2)),raw:`${wins}勝${losses}負`},
      {label:'聯區排名',value:Math.max(10,100-rank*8),raw:`#${rank}`},
      {label:'打線實力',value:Math.max(30,pct+10),raw:`打線`},
      {label:'投手群',value:Math.max(30,pct),raw:`輪值`},
      {label:'整體實力',value:Math.max(20,100-rank*5),raw:`排名#${rank}`},
    ],
  };
};

const TeamCard = ({ team, sc, onCompare, isSelected }) => {
  const [tab, setTab] = useState('stats');
  return (
    <div style={{ background:C.white, border:`1.5px solid ${isSelected?sc:C.border}`, borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'14px 16px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <div style={{ background:sc, color:C.white, borderRadius:7, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900 }}>#{team.rank}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.dark }}>{team.flag} {team.name}</div>
            <div style={{ fontSize:10, color:C.muted }}>{team.enName!==team.name?team.enName:''}{team.league?` · ${team.league}`:''}</div>
          </div>
          <button onClick={onCompare} style={{ fontSize:10, fontWeight:700, padding:'3px 8px', border:`1px solid ${isSelected?sc:C.border}`, borderRadius:5, cursor:'pointer', background:isSelected?sc:'transparent', color:isSelected?C.white:C.muted }}>
            {isSelected?'✓':'＋'}比較
          </button>
        </div>
        <div style={{ display:'flex', borderBottom:`1px solid ${C.borderLight}`, marginBottom:8 }}>
          {[['stats','統計'],['roster','球員'],['info','簡介']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'5px 10px', border:'none', cursor:'pointer', background:'transparent', color:tab===t?sc:C.muted, fontSize:11, fontWeight:700, borderBottom:tab===t?`2px solid ${sc}`:'2px solid transparent' }}>{l}</button>
          ))}
        </div>
        {tab==='stats'&&(
          <>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}><RadarChart stats={team.stats} color={sc} size={70}/></div>
            {team.stats.map(s=>(
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'3px 0', borderBottom:`1px solid ${C.borderLight}` }}>
                <span style={{ fontSize:10, color:C.muted }}>{s.label}</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:10, color:C.muted }}>{s.raw}</span>
                  <div style={{ width:45, height:4, background:'#E9EBF0', borderRadius:2, overflow:'hidden' }}><div style={{ width:`${s.value}%`, height:'100%', background:sc }}/></div>
                  <span style={{ fontSize:10, fontWeight:700, color:sc, width:22, textAlign:'right' }}>{s.value}</span>
                </div>
              </div>
            ))}
          </>
        )}
        {tab==='roster'&&team.roster&&(
          <div style={{ padding:'6px 0' }}>
            {team.roster.map((p,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:`1px solid ${C.borderLight}` }}>
                <span style={{ fontSize:9, color:C.white, background:sc, padding:'2px 5px', borderRadius:3, minWidth:24, textAlign:'center' }}>{p.pos}</span>
                <span style={{ fontSize:12, fontWeight:p.star?800:500, color:C.dark, flex:1 }}>{p.name}</span>
                {p.star&&<span style={{ fontSize:12, color:C.amber }}>⭐</span>}
                {p.info&&<span style={{ fontSize:10, color:C.muted }}>{p.info}</span>}
              </div>
            ))}
          </div>
        )}
        {tab==='roster'&&!team.roster&&<div style={{ padding:'12px 0', fontSize:12, color:C.muted, textAlign:'center' }}>球員數據載入中...</div>}
        {tab==='info'&&<div style={{ fontSize:12, color:C.muted, lineHeight:1.7, padding:'4px 0 10px' }}>{team.info}</div>}
      </div>
      <div style={{ height:8 }}/>
    </div>
  );
};

export default function TeamAnalysis() {
  const [sport, setSport] = useState('世界杯');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const sc = SPORT_C[sport] || C.navy;

  const loadTeams = async (s) => {
    setLoading(true); setError(''); setTeams([]);

    if (s==='LOL') { setTeams(LOL_TEAMS); setLoading(false); return; }

    if (s==='世界杯') {
      const result = await callGW('football','getStandings',{competition:'WC'});
      if (result?.standings?.length>0) {
        const flat = result.standings.flatMap(g=>g.table||[]);
        const wc = flat.slice(0,32).map((st,i)=>{
          const t=st.team||{}; const zh=WC_MAP[t.name]||t.name; const flag=FLAG[zh]||'';
          const w=st.won||0,d=st.draw||0,l=st.lost||0,gf=st.goalsFor||0,ga=st.goalsAgainst||0,played=w+d+l;
          const wr=played?Math.round(w/played*100):0;
          return { id:t.id, name:zh, enName:t.name, flag, league:'世界杯', rank:i+1,
            info:`${w}勝${d}平${l}負 · 進球${gf} 失球${ga}`,
            stats:[{label:'進球效率',value:Math.min(100,Math.round(gf/(played||1)*30)),raw:`${gf}球`},{label:'防守穩定',value:Math.min(100,100-Math.round(ga/(played||1)*30)),raw:`失${ga}球`},{label:'控場能力',value:Math.min(100,50+wr/2),raw:`勝率${wr}%`},{label:'積分效率',value:Math.min(100,Math.round((st.points||0)/(played*3||1)*100)),raw:`${st.points||0}分`},{label:'近況',value:Math.min(100,wr),raw:`${w}勝${d}平${l}負`},{label:'實力評估',value:Math.max(20,100-i*3),raw:`#${i+1}`}] };
        });
        setTeams(wc); setLastUpdated(new Date());
      } else { setTeams(WC_SEEDS); setError('世界杯賽事尚未開始，顯示種子隊'); }
    }

    if (s==='NBA') {
      try {
        const r = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings');
        const data = await r.json();
        const children = data.children||[];
        const all = [];
        for (const conf of children) {
          for (const [i,entry] of (conf.standings?.entries||[]).entries()) {
            const team = transformNBATeam(entry.team||{}, entry, i+1);
            team.league = conf.name||'NBA';
            all.push(team);
          }
        }
        all.sort((a,b)=>a.rank-b.rank);
        setTeams(all.slice(0,30)); setLastUpdated(new Date());
      } catch(e) { setError('NBA數據載入失敗：'+e.message); }
    }

    if (s==='MLB') {
      try {
        const r = await fetch('https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=2025&standingsTypes=regularSeason');
        const data = await r.json();
        const records = data.records||[];
        const all = [];
        for (const rec of records) {
          for (const [i,tr] of (rec.teamRecords||[]).entries()) {
            const team = transformMLBTeam(tr.team||{}, i+1);
            team.league = rec.division?.name||'MLB';
            all.push(team);
          }
        }
        setTeams(all.slice(0,30)); setLastUpdated(new Date());
      } catch(e) { setError('MLB數據載入失敗：'+e.message); }
    }

    setLoading(false);
  };

  useEffect(() => { loadTeams(sport); }, [sport]);

  const filtered = teams.filter(t=>{
    if (!search) return true;
    const q=search.toLowerCase();
    return t.name?.includes(q)||t.enName?.toLowerCase().includes(q);
  });

  const toggleCompare = (t) => {
    if (!compareA||compareA.id===t.id){setCompareA(compareA?.id===t.id?null:t);return;}
    if (!compareB||compareB.id===t.id){setCompareB(compareB?.id===t.id?null:t);return;}
    setCompareB(t);
  };

  const SPORTS = ['世界杯','NBA','MLB','LOL'];

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>隊伍數據分析</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 4px' }}>隊伍能力分析</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>
            NBA・MLB 數據每次點擊自動更新 · 世界杯讀取官方積分榜 · LOL 讀取靜態賽季數據
            {lastUpdated&&<span style={{ marginLeft:8, fontSize:11 }}>· 更新於 {lastUpdated.toLocaleTimeString('zh-TW')}</span>}
          </p>
        </div>

        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white }}>
            {SPORTS.map(s=>(
              <button key={s} onClick={()=>{setSport(s);setSearch('');setCompareA(null);setCompareB(null);}}
                style={{ padding:'8px 18px', border:'none', cursor:'pointer', background:sport===s?(SPORT_C[s]||C.navy):'transparent', color:sport===s?C.white:C.muted, fontSize:13, fontWeight:700, borderRight:`1px solid ${C.borderLight}` }}>{s}</button>
            ))}
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="搜尋隊伍（中英文均可）..." style={{ flex:1, minWidth:200, padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, color:C.dark, outline:'none', background:C.white }}/>
          <button onClick={()=>loadTeams(sport)} disabled={loading}
            style={{ padding:'8px 14px', background:loading?C.muted:C.navy, color:C.white, border:'none', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700 }}>
            🔄 更新
          </button>
        </div>

        {error&&<div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:7, padding:'10px 14px', fontSize:12, color:'#92400E', marginBottom:14 }}>⚠️ {error}</div>}
        {loading&&<div style={{ textAlign:'center', padding:40, color:C.muted }}>載入中...</div>}

        {/* 比較 */}
        {compareA&&compareB&&(
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 20px', marginBottom:16 }}>
            <div style={{ textAlign:'center', fontWeight:700, color:C.dark, marginBottom:10 }}>
              {compareA.flag} {compareA.name} vs {compareB.flag} {compareB.name}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:16, alignItems:'center' }}>
              <div style={{ textAlign:'center' }}><div style={{ fontWeight:800, marginBottom:8 }}>{compareA.flag} {compareA.name}</div><RadarChart stats={compareA.stats} color={sc} size={70}/></div>
              <div style={{ fontSize:18, fontWeight:800, color:C.muted }}>VS</div>
              <div style={{ textAlign:'center' }}><div style={{ fontWeight:800, marginBottom:8 }}>{compareB.flag} {compareB.name}</div><RadarChart stats={compareB.stats} color='#DC2626' size={70}/></div>
            </div>
            <div style={{ textAlign:'center', marginTop:10 }}><button onClick={()=>{setCompareA(null);setCompareB(null);}} style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, padding:'5px 14px', borderRadius:5, cursor:'pointer', fontSize:12 }}>清除比較</button></div>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:12 }}>
          {filtered.map(team=>(
            <TeamCard key={team.id} team={team} sc={sc}
              onCompare={()=>toggleCompare(team)}
              isSelected={compareA?.id===team.id||compareB?.id===team.id}/>
          ))}
        </div>
        {filtered.length===0&&!loading&&(
          <div style={{ textAlign:'center', padding:32, color:C.muted }}>搜尋無結果</div>
        )}
      </div>
    </div>
  );
}
