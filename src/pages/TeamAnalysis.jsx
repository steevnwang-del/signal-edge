import { useState, useEffect } from 'react';
import RadarChart from '../components/RadarChart';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };

// 世界杯球員名單（包含首發/替補/明星）
const WC_SQUADS = {
  'Brazil': { formation:'4-2-3-1', stars:['Vinicius Jr','Rodrygo','Endrick'],
    players:[
      {name:'Alisson', enName:'Alisson', pos:'GK', num:1, role:'門將', club:'Liverpool', star:false},
      {name:'達尼洛', enName:'Danilo', pos:'RB', num:2, role:'右後衛', club:'Juventus', star:false},
      {name:'馬奎紐斯', enName:'Marquinhos', pos:'CB', num:4, role:'中後衛 ©', club:'PSG', star:false},
      {name:'加布里爾', enName:'Gabriel', pos:'CB', num:3, role:'中後衛', club:'Arsenal', star:false},
      {name:'基利亞', enName:'Guilherme Arana', pos:'LB', num:6, role:'左後衛', club:'Atlético', star:false},
      {name:'卡塞米洛', enName:'Casemiro', pos:'DM', num:5, role:'防守中場', club:'Man Utd', star:false},
      {name:'帕奎塔', enName:'Paquetá', pos:'CM', num:10, role:'進攻中場', club:'West Ham', star:false},
      {name:'哈菲紐', enName:'Raphinha', pos:'RW', num:11, role:'右翼', club:'Barcelona', star:true},
      {name:'羅德里戈', enName:'Rodrygo', pos:'AM', num:9, role:'影鋒 ⭐', club:'Real Madrid', star:true},
      {name:'維尼修斯', enName:'Vinicius Jr', pos:'LW', num:7, role:'左翼 ⭐ 核心', club:'Real Madrid', star:true},
      {name:'安德里克', enName:'Endrick', pos:'ST', num:12, role:'前鋒 新星', club:'Real Madrid', star:true},
    ]},
  'France': { formation:'4-3-3', stars:['Mbappé','Griezmann','Dembelé'],
    players:[
      {name:'馬南', enName:'Maignan', pos:'GK', num:1, role:'門將', club:'AC Milan', star:false},
      {name:'孔德', enName:'Kounde', pos:'RB', num:2, role:'右後衛', club:'Barcelona', star:false},
      {name:'薩利巴', enName:'Saliba', pos:'CB', num:5, role:'中後衛', club:'Arsenal', star:false},
      {name:'柯納泰', enName:'Konaté', pos:'CB', num:4, role:'中後衛', club:'Liverpool', star:false},
      {name:'泰奥', enName:'Theo Hernandez', pos:'LB', num:22, role:'左後衛', club:'AC Milan', star:false},
      {name:'坎塔', enName:'Kanté', pos:'DM', num:13, role:'後腰', club:'Al Ittihad', star:false},
      {name:'舒阿梅尼', enName:'Tchouameni', pos:'CM', num:8, role:'中場', club:'Real Madrid', star:false},
      {name:'葛里茲曼', enName:'Griezmann', pos:'AM', num:7, role:'攻擊中場 ⭐', club:'Atletico', star:true},
      {name:'登貝萊', enName:'Dembelé', pos:'RW', num:11, role:'右翼 ⭐', club:'PSG', star:true},
      {name:'科洛穆阿尼', enName:'Kolo Muani', pos:'ST', num:9, role:'中鋒', club:'PSG', star:false},
      {name:'姆巴佩', enName:'Mbappé', pos:'LW', num:10, role:'左翼 ⭐ 核心', club:'Real Madrid', star:true},
    ]},
  'Spain': { formation:'4-3-3', stars:['Yamal','Pedri','Morata'],
    players:[
      {name:'西蒙', enName:'Simón', pos:'GK', num:1, role:'門將', club:'Athletic', star:false},
      {name:'卡瓦哈', enName:'Carvajal', pos:'RB', num:2, role:'右後衛 ©', club:'Real Madrid', star:false},
      {name:'勒諾曼', enName:'Le Normand', pos:'CB', num:4, role:'中後衛', club:'Atletico', star:false},
      {name:'拉波特', enName:'Laporte', pos:'CB', num:14, role:'中後衛', club:'Al Nassr', star:false},
      {name:'奎魯斯', enName:'Cucurella', pos:'LB', num:3, role:'左後衛', club:'Chelsea', star:false},
      {name:'羅德里', enName:'Rodri', pos:'DM', num:16, role:'後腰 ⭐ Ballon d\'Or', club:'Man City', star:true},
      {name:'佩德里', enName:'Pedri', pos:'CM', num:8, role:'中場 ⭐', club:'Barcelona', star:true},
      {name:'法比安', enName:'Fabián Ruiz', pos:'CM', num:6, role:'中場', club:'PSG', star:false},
      {name:'亞馬爾', enName:'Yamal', pos:'RW', num:11, role:'右翼 ⭐ 神童', club:'Barcelona', star:true},
      {name:'莫拉塔', enName:'Morata', pos:'ST', num:7, role:'中鋒 ©', club:'AC Milan', star:false},
      {name:'尼可', enName:'Nico Williams', pos:'LW', num:17, role:'左翼', club:'Athletic', star:true},
    ]},
  'Argentina': { formation:'4-3-3', stars:['Messi','Álvarez','Di María'],
    players:[
      {name:'恩素', enName:'Emiliano Martínez', pos:'GK', num:23, role:'門將 ⭐', club:'Aston Villa', star:true},
      {name:'莫里納', enName:'Molina', pos:'RB', num:26, role:'右後衛', club:'Atletico', star:false},
      {name:'羅梅洛', enName:'Romero', pos:'CB', num:13, role:'中後衛', club:'Spurs', star:false},
      {name:'奧塔門迪', enName:'Otamendi', pos:'CB', num:19, role:'中後衛', club:'Benfica', star:false},
      {name:'阿庫尼亞', enName:'Acuña', pos:'LB', num:8, role:'左後衛', club:'Sevilla', star:false},
      {name:'德保羅', enName:'De Paul', pos:'CM', num:7, role:'中場', club:'Atletico', star:false},
      {name:'恩佐', enName:'Enzo Fernández', pos:'CM', num:24, role:'中場 ⭐', club:'Chelsea', star:true},
      {name:'麥卡利斯特', enName:'Mac Allister', pos:'CM', num:20, role:'中場', club:'Liverpool', star:false},
      {name:'梅西', enName:'Messi', pos:'RW', num:10, role:'⭐ 隊長 GOAT', club:'Inter Miami', star:true},
      {name:'阿爾瓦雷斯', enName:'Álvarez', pos:'ST', num:9, role:'中鋒 ⭐', club:'Atletico', star:true},
      {name:'迪馬利亞', enName:'Di María', pos:'LW', num:11, role:'左翼 老將', club:'Benfica', star:true},
    ]},
};

// LOL 球員名單
const LOL_ROSTERS = {
  'T1':    { coach:'Kkoma', players:[{name:'Zeus',pos:'上路',role:'⭐ 對線強手',real:'최우제'},{name:'Oner',pos:'打野',role:'主導型',real:'문현준'},{name:'Faker',pos:'中路',role:'⭐⭐ 傳奇',real:'이상혁'},{name:'Gumayushi',pos:'射手',role:'⭐ 輸出核心',real:'이민형'},{name:'Keria',pos:'輔助',role:'⭐ 世界最強輔助',real:'류민석'}]},
  'Gen.G': { coach:'Grab', players:[{name:'Doran',pos:'上路',role:'穩定輸出',real:'최현준'},{name:'Canyon',pos:'打野',role:'⭐ 頂尖打野',real:'김건부'},{name:'Chovy',pos:'中路',role:'⭐⭐ 對線神',real:'정지훈'},{name:'Peyz',pos:'射手',role:'新星',real:'김수환'},{name:'Lehends',pos:'輔助',role:'創意輔助',real:'손시우'}]},
  'JDG':   { coach:'Homme', players:[{name:'369',pos:'上路',role:'⭐ 上路霸主',real:'정인호'},{name:'Kanavi',pos:'打野',role:'⭐ 野區大師',real:'서진혁'},{name:'knight',pos:'中路',role:'⭐ 頂尖中單',real:'장준 🇨🇳'},{name:'Ruler',pos:'射手',role:'⭐ 世界頂尖射手',real:'박재혁'},{name:'Missing',pos:'輔助',role:'進取型',real:'오승근'}]},
  'BLG':   { coach:'Wayward', players:[{name:'Bin',pos:'上路',role:'⭐ 進攻型',real:'陳澤彬'},{name:'Xun',pos:'打野',role:'強勢打野',real:'柯其威'},{name:'Yika',pos:'中路',role:'潛力股',real:'聶家峻'},{name:'Elk',pos:'射手',role:'輸出核心',real:'謝嘉儀'},{name:'ON',pos:'輔助',role:'控制型',real:'金鴻俊'}]},
  'KT':    { coach:'Kim', players:[{name:'Kiin',pos:'上路',role:'老將穩定',real:'김기인'},{name:'Cuzz',pos:'打野',role:'老將',real:'문우찬'},{name:'Bdd',pos:'中路',role:'⭐ 頂尖中單',real:'곽보성'},{name:'Deft',pos:'射手',role:'⭐ 傳奇射手',real:'김혁규'},{name:'Lehends',pos:'輔助',role:'',real:'손시우'}]},
};

const TEAM_ZH = {
  'Brazil':'巴西','France':'法國','Spain':'西班牙','Argentina':'阿根廷','Germany':'德國',
  'England':'英格蘭','Portugal':'葡萄牙','Netherlands':'荷蘭','Belgium':'比利時',
  'Morocco':'摩洛哥','Uruguay':'烏拉圭','USA':'美國','Mexico':'墨西哥','Canada':'加拿大',
  'Japan':'日本','South Korea':'韓國','Senegal':'塞內加爾','Ecuador':'厄瓜多',
  'Australia':'澳洲','Switzerland':'瑞士','Poland':'波蘭','Serbia':'塞爾維亞',
  'Ghana':'迦納','Cameroon':'喀麥隆','Tunisia':'突尼西亞','Croatia':'克羅埃西亞',
  'Ivory Coast':'象牙海岸','Panama':'巴拿馬','Costa Rica':'哥斯大黎加','Qatar':'卡達',
  'Saudi Arabia':'沙烏地阿拉伯','Iran':'伊朗','Czechia':'捷克','Czech Republic':'捷克',
  'Sweden':'瑞典','Colombia':'哥倫比亞','Chile':'智利','Austria':'奧地利','Turkey':'土耳其',
};
const FLAG={巴西:'🇧🇷',法國:'🇫🇷',西班牙:'🇪🇸',阿根廷:'🇦🇷',德國:'🇩🇪',英格蘭:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',葡萄牙:'🇵🇹',荷蘭:'🇳🇱',比利時:'🇧🇪',摩洛哥:'🇲🇦',烏拉圭:'🇺🇾',美國:'🇺🇸',墨西哥:'🇲🇽',加拿大:'🇨🇦',日本:'🇯🇵',韓國:'🇰🇷',塞內加爾:'🇸🇳',厄瓜多:'🇪🇨',澳洲:'🇦🇺',瑞士:'🇨🇭',波蘭:'🇵🇱',塞爾維亞:'🇷🇸',迦納:'🇬🇭',喀麥隆:'🇨🇲',突尼西亞:'🇹🇳',克羅埃西亞:'🇭🇷',象牙海岸:'🇨🇮',巴拿馬:'🇵🇦',哥斯大黎加:'🇨🇷',卡達:'🇶🇦',沙烏地阿拉伯:'🇸🇦',伊朗:'🇮🇷',捷克:'🇨🇿',瑞典:'🇸🇪',哥倫比亞:'🇨🇴',奧地利:'🇦🇹',土耳其:'🇹🇷',智利:'🇨🇱'};

const callGateway = async (source, action, params) => {
  const r = await fetch('/api/gateway', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({source,action,params}) });
  const d = await r.json();
  return d.success ? d.result : null;
};

const POS_C = {GK:'#1B5E20',RB:'#0F3460',LB:'#0F3460',CB:'#0F3460',DM:'#6B2D8B',CM:'#6B2D8B',AM:'#C89B3C',RW:'#C9082A',LW:'#C9082A',ST:'#C9082A',FW:'#C9082A',MF:'#6B2D8B',DF:'#0F3460'};

// 球員列表元件
const PlayerRoster = ({ squad, color }) => {
  if (!squad?.players) return <div style={{ padding:'12px', fontSize:12, color:C.muted, textAlign:'center' }}>無球員名單資料</div>;
  const starters = squad.players.slice(0,11);
  const bench = squad.players.slice(11);
  return (
    <div style={{ padding:'12px 0' }}>
      {squad.formation && (
        <div style={{ fontSize:10, color:C.muted, marginBottom:10, display:'flex', gap:12 }}>
          <span>陣型：<strong style={{ color }}>{squad.formation}</strong></span>
          {squad.coach && <span>教練：<strong style={{ color:C.dark }}>{squad.coach}</strong></span>}
        </div>
      )}
      {/* 首發 */}
      <div style={{ fontSize:10, fontWeight:700, color:C.muted, marginBottom:6, letterSpacing:0.5 }}>▶ 首發11人</div>
      {starters.map((p,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:`1px solid ${C.borderLight}` }}>
          <span style={{ fontSize:9, fontWeight:700, color:C.white, background:POS_C[p.pos]||C.muted, padding:'2px 5px', borderRadius:3, minWidth:24, textAlign:'center' }}>{p.pos}</span>
          {p.num && <span style={{ fontSize:10, color:C.muted, fontFamily:'ui-monospace,monospace', width:18, textAlign:'right' }}>#{p.num}</span>}
          <div style={{ flex:1 }}>
            <span style={{ fontSize:12, fontWeight:p.star?800:500, color:p.star?C.dark:C.dark }}>{p.name}</span>
            {p.enName && p.enName!==p.name && <span style={{ fontSize:10, color:C.muted, marginLeft:6 }}>{p.enName}</span>}
            {p.real && <span style={{ fontSize:9, color:C.muted, marginLeft:4 }}>({p.real})</span>}
          </div>
          <div style={{ textAlign:'right' }}>
            {p.star && <span style={{ fontSize:9, color:'#D97706', marginRight:4 }}>⭐</span>}
            <span style={{ fontSize:10, color:C.muted }}>{p.club||p.role}</span>
          </div>
        </div>
      ))}
      {bench.length>0&&(
        <>
          <div style={{ fontSize:10, fontWeight:700, color:C.muted, margin:'10px 0 6px', letterSpacing:0.5 }}>▶ 替補</div>
          {bench.map((p,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', opacity:0.7 }}>
              <span style={{ fontSize:9, color:C.white, background:POS_C[p.pos]||C.muted, padding:'1px 4px', borderRadius:3, minWidth:24, textAlign:'center' }}>{p.pos}</span>
              <span style={{ fontSize:11, color:C.dark }}>{p.name}</span>
              {p.enName && p.enName!==p.name && <span style={{ fontSize:10, color:C.muted }}>{p.enName}</span>}
              <span style={{ fontSize:10, color:C.muted, marginLeft:'auto' }}>{p.club}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// LOL 球員列表
const LOLRoster = ({ roster, color }) => {
  if (!roster) return null;
  return (
    <div style={{ padding:'12px 0' }}>
      {roster.coach && <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>教練：<strong style={{ color:C.dark }}>{roster.coach}</strong></div>}
      {roster.players.map((p,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:`1px solid ${C.borderLight}` }}>
          <span style={{ fontSize:10, fontWeight:700, color:C.white, background:color, padding:'2px 6px', borderRadius:3, minWidth:28, textAlign:'center' }}>{p.pos}</span>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{p.name}</span>
            {p.real && <span style={{ fontSize:10, color:C.muted, marginLeft:6 }}>{p.real}</span>}
          </div>
          <span style={{ fontSize:11, color:p.role.includes('⭐')?'#D97706':C.muted }}>{p.role}</span>
        </div>
      ))}
    </div>
  );
};

const WC_SEEDS = [
  {id:1,enName:'Brazil',name:'巴西',flag:'🇧🇷',rank:1,info:'世界杯最熱門奪冠候選，維尼修斯Jr 為核心',stats:[{label:'攻擊力',value:91,raw:'場均進球2.3'},{label:'防守力',value:88,raw:'失球最少'},{label:'控球率',value:84,raw:'58%'},{label:'傳球精準',value:87,raw:'87%'},{label:'個人技術',value:93,raw:'盤帶最多'},{label:'整體實力',value:92,raw:'FIFA排名前5'}]},
  {id:2,enName:'France',name:'法國',flag:'🇫🇷',rank:2,info:'衛冕冠軍，姆巴佩是最快的前鋒',stats:[{label:'攻擊力',value:89,raw:'姆巴佩'},{label:'防守力',value:83,raw:'穩定'},{label:'控球率',value:79,raw:'55%'},{label:'傳球精準',value:86,raw:'88%'},{label:'個人技術',value:90,raw:'速度'},{label:'整體實力',value:88,raw:'衛冕熱門'}]},
  {id:3,enName:'Spain',name:'西班牙',flag:'🇪🇸',rank:3,info:'歐洲最強控球流，亞馬爾是天才新星',stats:[{label:'攻擊力',value:85,raw:'多元進攻'},{label:'防守力',value:86,raw:'穩健'},{label:'控球率',value:95,raw:'65%'},{label:'傳球精準',value:96,raw:'92%'},{label:'個人技術',value:88,raw:'亞馬爾'},{label:'整體實力',value:88,raw:'控球王'}]},
  {id:4,enName:'Argentina',name:'阿根廷',flag:'🇦🇷',rank:4,info:'衛冕世界冠軍，梅西最後一屆世界杯',stats:[{label:'攻擊力',value:88,raw:'梅西領導'},{label:'防守力',value:82,raw:'整體穩定'},{label:'控球率',value:82,raw:'54%'},{label:'傳球精準',value:85,raw:'86%'},{label:'個人技術',value:92,raw:'梅西'},{label:'整體實力',value:89,raw:'衛冕冠軍'}]},
  {id:5,enName:'Germany',name:'德國',flag:'🇩🇪',rank:5,info:'主辦國之一，科學化戰術',stats:[{label:'攻擊力',value:85,raw:'攻組合強'},{label:'防守力',value:84,raw:'穩固'},{label:'控球率',value:88,raw:'60%'},{label:'傳球精準',value:89,raw:'90%'},{label:'個人技術',value:84,raw:'技術全面'},{label:'整體實力',value:86,raw:'主辦國'}]},
  {id:6,enName:'England',name:'英格蘭',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',rank:6,info:'前場攻擊力超強，Bellingham領銜',stats:[{label:'攻擊力',value:86,raw:'前場強'},{label:'防守力',value:84,raw:'穩健'},{label:'控球率',value:80,raw:'56%'},{label:'傳球精準',value:84,raw:'87%'},{label:'個人技術',value:85,raw:'Bellingham'},{label:'整體實力',value:85,raw:'奪冠熱門'}]},
  {id:7,enName:'Morocco',name:'摩洛哥',flag:'🇲🇦',rank:7,info:'2022黑馬，防守型打法，失球最少',stats:[{label:'攻擊力',value:76,raw:'防守反擊'},{label:'防守力',value:92,raw:'最強防守'},{label:'控球率',value:72,raw:'51%'},{label:'傳球精準',value:82,raw:'85%'},{label:'個人技術',value:78,raw:'整體紀律'},{label:'整體實力',value:82,raw:'黑馬'}]},
  {id:8,enName:'Portugal',name:'葡萄牙',flag:'🇵🇹',rank:8,info:'後C羅時代，B.Félix引領新生代',stats:[{label:'攻擊力',value:87,raw:'組合強'},{label:'防守力',value:81,raw:'穩定'},{label:'控球率',value:78,raw:'54%'},{label:'傳球精準',value:85,raw:'87%'},{label:'個人技術',value:88,raw:'技術全面'},{label:'整體實力',value:84,raw:'奪冠候選'}]},
];

const LOL_TEAMS = [
  {id:101,name:'T1',enName:'T1',flag:'🎮',league:'LCK',rank:1,info:'LCK王朝，Faker是史上最偉大選手，本賽季28-4',stats:[{label:'勝率',value:88,raw:'88%'},{label:'對線優勢',value:91,raw:'CSD最高'},{label:'視野控制',value:85,raw:'VS 45/場'},{label:'團戰參與',value:93,raw:'KP 82%'},{label:'資源掌控',value:87,raw:'大龍率'},{label:'逆境能力',value:82,raw:'落後反勝'}]},
  {id:102,name:'Gen.G',enName:'Gen.G',flag:'🎮',league:'LCK',rank:2,info:'Chovy對線稱霸，本賽季個人對線勝率78%最高',stats:[{label:'勝率',value:82,raw:'82%'},{label:'對線優勢',value:95,raw:'CSD聯盟最高'},{label:'視野控制',value:82,raw:'VS 43/場'},{label:'團戰參與',value:88,raw:'KP 79%'},{label:'資源掌控',value:84,raw:'先鋒率'},{label:'逆境能力',value:75,raw:'落後反勝'}]},
  {id:103,name:'JDG',enName:'JDG',flag:'🎮',league:'LPL',rank:3,info:'LPL最強，knight中單 + Kanavi打野組合',stats:[{label:'勝率',value:79,raw:'79%'},{label:'對線優勢',value:83,raw:'前三'},{label:'視野控制',value:80,raw:'VS 41/場'},{label:'團戰參與',value:90,raw:'KP 84%'},{label:'資源掌控',value:86,raw:'龍魂率'},{label:'逆境能力',value:78,raw:'落後反勝'}]},
  {id:104,name:'BLG',enName:'Bilibili Gaming',flag:'🎮',league:'LPL',rank:4,info:'Bin上單強勢領銜，2024年S賽亞軍',stats:[{label:'勝率',value:76,raw:'76%'},{label:'對線優勢',value:80,raw:'上路主導'},{label:'視野控制',value:78,raw:'VS 40/場'},{label:'團戰參與',value:87,raw:'KP 81%'},{label:'資源掌控',value:82,raw:'強勢資源'},{label:'逆境能力',value:75,raw:'落後反勝'}]},
  {id:105,name:'KT',enName:'KT Rolster',flag:'🎮',league:'LCK',rank:5,info:'Bdd中單 + Deft老將組合，均衡戰術',stats:[{label:'勝率',value:74,raw:'74%'},{label:'對線優勢',value:78,raw:'穩定'},{label:'視野控制',value:82,raw:'VS 42/場'},{label:'團戰參與',value:86,raw:'KP 80%'},{label:'資源掌控',value:80,raw:'均衡'},{label:'逆境能力',value:80,raw:'落後反勝'}]},
  {id:106,name:'NRG',enName:'NRG Esports',flag:'🎮',league:'LCS',rank:6,info:'北美頂尖，國際賽黑馬',stats:[{label:'勝率',value:71,raw:'71%'},{label:'對線優勢',value:72,raw:'穩定'},{label:'視野控制',value:75,raw:'VS 38/場'},{label:'團戰參與',value:84,raw:'KP 78%'},{label:'資源掌控',value:77,raw:'均衡'},{label:'逆境能力',value:76,raw:'落後反勝'}]},
];

export default function TeamAnalysis() {
  const [sport, setSport] = useState('世界杯');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);

  const sc = sport==='世界杯'?'#1B5E20':'#C89B3C';

  useEffect(() => {
    if (sport==='LOL') { setTeams(LOL_TEAMS); return; }
    setLoading(true); setError('');
    callGateway('football','getStandings',{competition:'WC'}).then(result => {
      if (result?.standings?.length>0) {
        const flat = result.standings.flatMap(g=>g.table||[]);
        const wc = flat.slice(0,32).map((s,i)=>{
          const t=s.team||{}; const zhName=TEAM_ZH[t.name]||t.name; const flag=FLAG[zhName]||'';
          const w=s.won||0,d=s.draw||0,l=s.lost||0,gf=s.goalsFor||0,ga=s.goalsAgainst||0,played=w+d+l;
          const wr=played?Math.round(w/played*100):0;
          return { id:t.id, name:zhName, enName:t.name, flag, league:'世界杯', rank:i+1,
            info:`小組戰績：${w}勝${d}平${l}負 · 進球${gf} 失球${ga}`,
            stats:[{label:'進球效率',value:Math.min(100,Math.round(gf/(played||1)*30)),raw:`${gf}球/${played}場`},{label:'防守穩定',value:Math.min(100,100-Math.round(ga/(played||1)*30)),raw:`失${ga}球`},{label:'控場能力',value:Math.min(100,50+wr/2),raw:`勝率${wr}%`},{label:'積分效率',value:Math.min(100,Math.round((s.points||0)/(played*3||1)*100)),raw:`${s.points||0}分`},{label:'近況',value:Math.min(100,wr),raw:`${w}勝${d}平${l}負`},{label:'實力評估',value:Math.max(20,100-i*3),raw:`排名#${i+1}`}] };
        });
        setTeams(wc);
      } else { setTeams(WC_SEEDS); setError('賽事尚未開始，顯示種子隊'); }
    }).catch(()=>{ setTeams(WC_SEEDS); setError('API暫不可用，顯示種子隊'); }).finally(()=>setLoading(false));
  }, [sport]);

  const searchFiltered = teams.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.name.includes(q) || t.enName?.toLowerCase().includes(q);
  });

  const toggleCompare = (t) => {
    if (!compareA||compareA.id===t.id) { setCompareA(compareA?.id===t.id?null:t); return; }
    if (!compareB||compareB.id===t.id) { setCompareB(compareB?.id===t.id?null:t); return; }
    setCompareB(t);
  };

  const getTab = (id) => activeTab[id] || 'stats';
  const setTab = (id, tab) => setActiveTab(p=>({...p,[id]:tab}));

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>隊伍數據分析</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 4px' }}>隊伍能力分析</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>包含球員名單 · 首發/替補 · 明星選手</p>
        </div>

        {/* 控制列 */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white }}>
            {['世界杯','LOL'].map(s=>(
              <button key={s} onClick={()=>{setSport(s);setSearch('');setCompareA(null);setCompareB(null);}}
                style={{ padding:'8px 20px', border:'none', cursor:'pointer', background:sport===s?sc:'transparent', color:sport===s?C.white:C.muted, fontSize:13, fontWeight:700 }}>{s}</button>
            ))}
          </div>
          {/* 搜尋 */}
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={sport==='世界杯'?'搜尋隊伍（中文或英文）...':'搜尋電競隊伍...'}
            style={{ flex:1, minWidth:200, padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, color:C.dark, outline:'none', background:C.white }}/>
          {search && (
            <button onClick={()=>setSearch('')} style={{ padding:'8px 12px', border:`1px solid ${C.border}`, borderRadius:8, background:C.white, cursor:'pointer', color:C.muted, fontSize:12 }}>✕ 清除</button>
          )}
        </div>

        {search && <div style={{ marginBottom:12, fontSize:12, color:C.muted }}>找到 {searchFiltered.length} 個結果</div>}
        {error && <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:7, padding:'10px 14px', fontSize:12, color:'#92400E', marginBottom:14 }}>⚠️ {error}</div>}

        {/* 比較 */}
        {compareA&&compareB&&(
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 20px', marginBottom:16 }}>
            <div style={{ textAlign:'center', fontWeight:700, color:C.dark, marginBottom:10 }}>
              {compareA.flag} {compareA.name} ({compareA.enName}) <span style={{ color:C.muted }}>vs</span> {compareB.flag} {compareB.name} ({compareB.enName})
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:16, alignItems:'center' }}>
              <div style={{ textAlign:'center' }}><div style={{ fontWeight:800, marginBottom:8 }}>{compareA.flag} {compareA.name}</div><RadarChart stats={compareA.stats} color={sc} size={70}/></div>
              <div style={{ fontSize:18, fontWeight:800, color:C.muted }}>VS</div>
              <div style={{ textAlign:'center' }}><div style={{ fontWeight:800, marginBottom:8 }}>{compareB.flag} {compareB.name}</div><RadarChart stats={compareB.stats} color='#DC2626' size={70}/></div>
            </div>
            <div style={{ textAlign:'center', marginTop:10 }}><button onClick={()=>{setCompareA(null);setCompareB(null);}} style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, padding:'6px 14px', borderRadius:5, cursor:'pointer', fontSize:12 }}>清除比較</button></div>
          </div>
        )}
        {compareA&&!compareB&&(
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:7, padding:'10px 14px', marginBottom:14, fontSize:12, color:C.navy }}>
            ✓ 已選 {compareA.flag} {compareA.name}，再點一支隊伍比較
          </div>
        )}

        {loading&&<div style={{ textAlign:'center', padding:40, color:C.muted }}>載入中...</div>}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {searchFiltered.map(team=>{
            const isExpanded = expanded===team.id;
            const tab = getTab(team.id);
            const squad = WC_SQUADS[team.enName];
            const lolRoster = LOL_ROSTERS[team.name];
            const hasRoster = !!squad || !!lolRoster;
            return (
              <div key={team.id} style={{ background:C.white, border:`1.5px solid ${compareA?.id===team.id||compareB?.id===team.id?sc:C.border}`, borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'14px 16px 0' }}>
                  {/* 排名＋名稱 */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ background:sc, color:C.white, borderRadius:7, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900 }}>#{team.rank}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:800, color:C.dark }}>{team.flag} {team.name}</div>
                      <div style={{ fontSize:10, color:C.muted }}>{team.enName!==team.name?team.enName:''} · {team.league||sport}</div>
                    </div>
                    <button onClick={()=>toggleCompare(team)} style={{ fontSize:10, fontWeight:700, padding:'3px 8px', border:`1px solid ${compareA?.id===team.id||compareB?.id===team.id?sc:C.border}`, borderRadius:5, cursor:'pointer', background:compareA?.id===team.id||compareB?.id===team.id?sc:'transparent', color:compareA?.id===team.id||compareB?.id===team.id?C.white:C.muted }}>
                      {compareA?.id===team.id||compareB?.id===team.id?'✓比較':'＋比較'}
                    </button>
                  </div>

                  {/* Tabs */}
                  <div style={{ display:'flex', borderBottom:`1px solid ${C.borderLight}`, marginBottom:8 }}>
                    {[['stats','統計'],['roster','球員名單'],['info','簡介']].filter(([t])=>t!=='roster'||hasRoster).map(([t,l])=>(
                      <button key={t} onClick={()=>setTab(team.id,t)} style={{ padding:'5px 10px', border:'none', cursor:'pointer', background:'transparent', color:tab===t?sc:C.muted, fontSize:11, fontWeight:700, borderBottom:tab===t?`2px solid ${sc}`:'2px solid transparent' }}>{l}</button>
                    ))}
                  </div>

                  {/* 統計Tab */}
                  {tab==='stats'&&(
                    <>
                      <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}><RadarChart stats={team.stats} color={sc} size={72}/></div>
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

                  {/* 球員名單Tab */}
                  {tab==='roster'&&(
                    squad ? <PlayerRoster squad={squad} color={sc}/> :
                    lolRoster ? <LOLRoster roster={lolRoster} color={sc}/> :
                    <div style={{ fontSize:12, color:C.muted, padding:12, textAlign:'center' }}>無球員資料</div>
                  )}

                  {/* 簡介Tab */}
                  {tab==='info'&&(
                    <div style={{ fontSize:12, color:C.muted, lineHeight:1.7, padding:'4px 0 10px' }}>{team.info||'暫無資料'}</div>
                  )}
                </div>
                <div style={{ height:8 }}/>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
