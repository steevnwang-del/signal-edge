import { useState, useEffect } from 'react';
import { gateway } from '../services/apiGateway';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',bg:'#ECEEF2',amber:'#D97706',win:'#059669'};
const Spin=()=> <div style={{width:32,height:32,border:`3px solid ${C.border}`,borderTopColor:C.navy,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'32px auto'}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

const WC2026_TEAMS = [
  ['A','Mexico','MEX','🇲🇽'],['A','South Africa','RSA','🇿🇦'],['A','South Korea','KOR','🇰🇷'],['A','Czechia','CZE','🇨🇿'],
  ['B','Canada','CAN','🇨🇦'],['B','Bosnia and Herzegovina','BIH','🇧🇦'],['B','Qatar','QAT','🇶🇦'],['B','Switzerland','SUI','🇨🇭'],
  ['C','Brazil','BRA','🇧🇷'],['C','Morocco','MAR','🇲🇦'],['C','Haiti','HTI','🇭🇹'],['C','Scotland','SCO','🏴'],
  ['D','United States','USA','🇺🇸'],['D','Paraguay','PAR','🇵🇾'],['D','Australia','AUS','🇦🇺'],['D','Turkey','TUR','🇹🇷'],
  ['E','Germany','GER','🇩🇪'],['E','Curacao','CUW','🇨🇼'],['E','Ivory Coast','CIV','🇨🇮'],['E','Ecuador','ECU','🇪🇨'],
  ['F','Netherlands','NED','🇳🇱'],['F','Japan','JPN','🇯🇵'],['F','Sweden','SWE','🇸🇪'],['F','Tunisia','TUN','🇹🇳'],
  ['G','Belgium','BEL','🇧🇪'],['G','Egypt','EGY','🇪🇬'],['G','Iran','IRI','🇮🇷'],['G','New Zealand','NZL','🇳🇿'],
  ['H','Spain','ESP','🇪🇸'],['H','Cape Verde','CPV','🇨🇻'],['H','Saudi Arabia','KSA','🇸🇦'],['H','Uruguay','URU','🇺🇾'],
  ['I','France','FRA','🇫🇷'],['I','Senegal','SEN','🇸🇳'],['I','Iraq','IRQ','🇮🇶'],['I','Norway','NOR','🇳🇴'],
  ['J','Argentina','ARG','🇦🇷'],['J','Algeria','DZA','🇩🇿'],['J','Austria','AUT','🇦🇹'],['J','Jordan','JOR','🇯🇴'],
  ['K','Portugal','POR','🇵🇹'],['K','DR Congo','COD','🇨🇩'],['K','Uzbekistan','UZB','🇺🇿'],['K','Colombia','COL','🇨🇴'],
  ['L','England','ENG','🏴'],['L','Croatia','CRO','🇭🇷'],['L','Ghana','GHA','🇬🇭'],['L','Panama','PAN','🇵🇦'],
].map(([group,name,abbr,flag])=>({
  id:`wc2026-${abbr}`, name, en:name, abbr, flag, group, area:name, sport:'世界杯 2026', color:'#1B5E20',
  note:'2026 世界盃靜態參賽隊/分組資料；官方 API 完整名單開放後可替換為即時球員名單。',
  players:[{n:'完整 2026 參賽名單待官方 API 開放',pos:'INFO',no:0,star:false},{n:'此頁先提供隊伍/分組/搜尋入口',pos:'DATA',no:0,star:false}],
}));

const MSI_2026_TEAMS = [
  ['Gen.G Esports','GEN','LCK 🇰🇷','#111827','Chovy','MSI 2026'],['T1','T1','LCK 🇰🇷','#C89B3C','Faker','MSI 2026'],
  ['Bilibili Gaming','BLG','LPL 🇨🇳','#00A1D6','Elk','MSI 2026'],['Anyone\'s Legend','AL','LPL 🇨🇳','#0F3460','核心陣容待確認','MSI 2026'],
  ['G2 Esports','G2','LEC 🇪🇺','#FF6B35','Caps','MSI 2026'],['Movistar KOI','MKOI','LEC 🇪🇺','#5B21B6','核心陣容待確認','MSI 2026'],
  ['CTBC Flying Oyster','CFO','LCP 🇹🇼','#0EA5E9','核心陣容待確認','MSI 2026'],['GAM Esports','GAM','LCP/VCS 🇻🇳','#E4002B','Levi','MSI 2026'],
  ['FlyQuest','FLY','LCS 🇺🇸','#00C389','Inspired','MSI 2026'],['LYON','LYON','LCS 🇺🇸','#F59E0B','核心陣容待確認','MSI 2026'],
  ['FURIA','FUR','CBLOL 🇧🇷','#111827','Tutsz','MSI 2026'],
];

const LOL_EXTRA_TEAMS = [
  ['Hanwha Life Esports','HLE','LCK 🇰🇷','#F37321','Peanut','LCK'],['Dplus KIA','DK','LCK 🇰🇷','#00A3E0','ShowMaker','LCK'],['KT Rolster','KT','LCK 🇰🇷','#E60000','Bdd','LCK'],['Nongshim RedForce','NS','LCK 🇰🇷','#DC2626','核心陣容待確認','LCK'],
  ['Top Esports','TES','LPL 🇨🇳','#E4002B','JackeyLove','LPL'],['JD Gaming','JDG','LPL 🇨🇳','#FF6B00','Ruler','LPL'],['Weibo Gaming','WBG','LPL 🇨🇳','#E61E1E','Xiaohu','LPL'],['LNG Esports','LNG','LPL 🇨🇳','#0F3460','Scout','LPL'],['Invictus Gaming','IG','LPL 🇨🇳','#111827','核心陣容待確認','LPL'],
  ['Fnatic','FNC','LEC 🇪🇺','#FF5900','Humanoid','LEC'],['Karmine Corp','KC','LEC 🇪🇺','#0068FF','Caliste','LEC'],['Team Vitality','VIT','LEC 🇪🇺','#FACC15','核心陣容待確認','LEC'],['Team Heretics','TH','LEC 🇪🇺','#111827','核心陣容待確認','LEC'],
  ['Team Liquid','TL','LCS 🇺🇸','#1E4D8F','APA','LCS'],['Cloud9','C9','LCS 🇺🇸','#88CFE0','Blaber','LCS'],['100 Thieves','100T','LCS 🇺🇸','#DC2626','核心陣容待確認','LCS'],['Shopify Rebellion','SR','LCS 🇺🇸','#84CC16','核心陣容待確認','LCS'],
  ['PSG Talon','PSG','PCS 🇹🇼/🇭🇰','#D71920','Maple','LCP'],['Secret Whales','TSW','LCP/VCS 🇻🇳','#2563EB','核心陣容待確認','LCP'],['Deep Cross Gaming','DCG','LCP 🇹🇼','#7C3AED','核心陣容待確認','LCP'],['Vikings Esports','VKE','VCS 🇻🇳','#EF4444','核心陣容待確認','LCP'],
  ['LOUD','LLL','CBLOL 🇧🇷','#00FF85','Robo','CBLOL'],['paiN Gaming','PNG','CBLOL 🇧🇷','#111827','核心陣容待確認','CBLOL'],['RED Canids','RED','CBLOL 🇧🇷','#DC2626','核心陣容待確認','CBLOL'],
];

const toLolTeam = ([name,abbr,region,color,star,tournament], idx) => ({
  id:`lol-${abbr}-${idx}`, name, en:name, abbr, region, color, sport:tournament==='MSI 2026'?'MSI 2026':'LOL 電競', star,
  note: tournament==='MSI 2026' ? 'MSI 2026 重點參賽/觀察隊伍。賽前版本、藍紅方與 BO5 適性會影響評估。' : '主要賽區觀察隊伍，後續可串 Liquipedia / Riot / PandaScore 更新。',
  players:[{n:star,pos:'核心',no:0,star:true},{n:'完整五人名單依官方賽前公告更新',pos:'ROSTER',no:0,star:false},{n:tournament||region,pos:'TAG',no:0,star:false}],
});
const LOL_TEAMS = [...MSI_2026_TEAMS, ...LOL_EXTRA_TEAMS].map(toLolTeam);

const fetchNBA=async()=>{
  const result=await gateway('nba','getTeams',{});
  return result.teams||[];
};
const fetchMLB=async()=>{
  const result=await gateway('mlb','getTeams',{season:new Date().getFullYear()});
  return result.teams||[];
};
const fetchWC=async()=>WC2026_TEAMS;
const fetchMSI=async()=>LOL_TEAMS.filter(t=>t.sport==='MSI 2026');
const fetchLOL=async()=>LOL_TEAMS;
const fetchNBAPlayers=async(team)=>{
  const teamId=team.espnId||String(team.id).replace('nba-','');
  const result=await gateway('nba','getTeamRoster',{teamId});
  return result.players||[];
};
const fetchMLBPlayers=async(team)=>{
  const teamId=team.mlbId||String(team.id).replace('mlb-','');
  const result=await gateway('mlb','getTeamRoster',{teamId,season:new Date().getFullYear()});
  return result.players||[];
};
const fetchStaticPlayers=async(team)=>team.players||[];

const SPORTS=['世界杯 2026','MSI 2026','LOL 電競','NBA','MLB'];
const FETCH_MAP={'世界杯 2026':fetchWC,'MSI 2026':fetchMSI,'LOL 電競':fetchLOL,'NBA':fetchNBA,'MLB':fetchMLB};
const PLAYER_MAP={'世界杯 2026':fetchStaticPlayers,'MSI 2026':fetchStaticPlayers,'LOL 電競':fetchStaticPlayers,'NBA':fetchNBAPlayers,'MLB':fetchMLBPlayers};

export default function TeamAnalysis(){
  const [sport,setSport]=useState('世界杯 2026');
  const [search,setSearch]=useState('');
  const [teams,setTeams]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [open,setOpen]=useState(null);
  const [players,setPlayers]=useState({});
  const [loadingP,setLoadingP]=useState(null);
  useEffect(()=>{loadTeams();},[sport]);
  const loadTeams=async()=>{setLoading(true);setError('');setTeams([]);setOpen(null);try{const fn=FETCH_MAP[sport];const data=fn?await fn():[];setTeams(data||[]);if(!data?.length)setError(`${sport} 目前沒有可顯示的隊伍資料`);}catch(e){setError('載入失敗：'+e.message+'\n已避免整頁崩潰，請稍後重試或檢查 API 來源。');}finally{setLoading(false);}};
  const loadPlayers=async(team)=>{const key=team.id;if(players[key])return;setLoadingP(key);try{const fn=PLAYER_MAP[sport];const ps=fn?await fn(team):[];setPlayers(p=>({...p,[key]:ps||[]}));}catch(e){setPlayers(p=>({...p,[key]:[{n:'名單暫時無法載入',pos:'ERR',no:0,star:false},{n:e.message,pos:'API',no:0,star:false}]}));}finally{setLoadingP(null);}};
  const handleOpen=async(team)=>{const key=team.id;const isO=open===key;setOpen(isO?null:key);if(!isO)await loadPlayers(team);};
  const q=search.trim().toLowerCase();
  const filtered=teams.filter(t=>!q||t.name?.toLowerCase().includes(q)||t.en?.toLowerCase().includes(q)||t.abbr?.toLowerCase().includes(q)||t.group?.toLowerCase().includes(q)||t.region?.toLowerCase().includes(q));

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}><div style={{maxWidth:1100,margin:'0 auto',padding:'28px 20px'}}>
      <div style={{marginBottom:20}}><div style={{fontSize:11,fontWeight:700,color:C.amber,letterSpacing:1.5,marginBottom:6,textTransform:'uppercase'}}>即時數據</div><h2 style={{fontSize:26,fontWeight:900,color:C.dark,margin:'0 0 4px'}}>隊伍分析</h2><p style={{color:C.muted,fontSize:13,margin:0}}>世界杯 48 隊 · MSI 2026 重點隊伍 · NBA/MLB 由後端 Gateway 代理，避免 CORS · LOL 主要賽區資料</p></div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}><div style={{overflowX:'auto',flex:1}}><div style={{display:'flex',gap:4,width:'max-content'}}>{SPORTS.map(s=><button key={s} onClick={()=>setSport(s)} style={{padding:'8px 14px',border:`1px solid ${sport===s?C.navy:C.border}`,borderRadius:7,cursor:'pointer',background:sport===s?C.navy:'transparent',color:sport===s?C.white:C.muted,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>{s}</button>)}</div></div><div style={{display:'flex',gap:8}}><input placeholder="搜尋隊伍 / 縮寫 / 組別..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:'8px 12px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:13,outline:'none',minWidth:170}}/><button onClick={loadTeams} disabled={loading} style={{padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:7,cursor:'pointer',background:loading?C.muted:C.white,color:C.muted,fontSize:12}}>🔄</button></div></div>
      {loading&&<Spin/>}{error&&<div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'14px 16px',color:'#DC2626',fontSize:13,marginBottom:16,whiteSpace:'pre-line'}}>⚠️ {error}</div>}{!loading&&<div style={{fontSize:12,color:C.muted,marginBottom:12}}>共 {filtered.length} 支隊伍</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>{filtered.map(t=>{const isO=open===t.id,ps=players[t.id],col=t.color||C.navy;return <div key={t.id} style={{background:C.white,border:`1.5px solid ${isO?col:C.border}`,borderRadius:10,overflow:'hidden'}}><div onClick={()=>handleOpen(t)} style={{padding:'14px 16px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}} onMouseEnter={e=>e.currentTarget.style.background='#F6F7FA'} onMouseLeave={e=>e.currentTarget.style.background=C.white}><div style={{flex:1,minWidth:0}}><div style={{display:'flex',gap:6,marginBottom:5,alignItems:'center',flexWrap:'wrap'}}>{t.flag&&<span style={{fontSize:16}}>{t.flag}</span>}{t.crest&&<img src={t.crest} alt="" style={{width:20,height:20,objectFit:'contain'}}/>}{t.logo&&<img src={t.logo} alt="" style={{width:24,height:24,objectFit:'contain'}}/>}{(t.conf||t.lg||t.region||t.area)&&<span style={{fontSize:10,fontWeight:700,color:col,background:col+'18',padding:'2px 6px',borderRadius:3}}>{t.conf||t.lg||t.region||t.area}</span>}{(t.div||t.group)&&<span style={{fontSize:10,color:C.muted}}>{t.group?`${t.group}組`:t.div}</span>}</div><div style={{fontSize:15,fontWeight:800,color:C.dark,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</div>{t.abbr&&<div style={{fontSize:11,color:C.muted}}>{t.abbr}{t.star?` · ⭐ ${t.star}`:''}</div>}</div><span style={{fontSize:18,color:col,transform:isO?'rotate(180deg)':'none',transition:'0.2s'}}>⌄</span></div>{isO&&<div style={{borderTop:`1px solid ${C.border}`,padding:'12px 16px',background:'#FAFBFC'}}>{t.note&&<div style={{fontSize:11,color:C.muted,lineHeight:1.5,marginBottom:10}}>ℹ️ {t.note}</div>}<div style={{fontSize:11,fontWeight:800,color:C.navy,marginBottom:8}}>隊伍名單 / 核心資訊</div>{loadingP===t.id&&<div style={{fontSize:12,color:C.muted}}>載入名單中...</div>}{ps&&ps.length>0&&ps.map((p,i)=><div key={`${p.n}-${i}`} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:i<ps.length-1?'1px solid #EEF0F4':'none'}}><span style={{width:28,fontSize:11,color:C.muted,fontFamily:'ui-monospace,monospace'}}>{p.no||'—'}</span><span style={{flex:1,fontSize:13,color:C.dark,fontWeight:p.star?800:500}}>{p.n}</span><span style={{fontSize:10,color:C.muted,background:'#EEF0F4',padding:'2px 6px',borderRadius:4}}>{p.pos||'—'}</span></div>)}{ps&&ps.length===0&&<div style={{fontSize:12,color:C.muted}}>暫無名單資料</div>}</div>}</div>;})}</div>
    </div></div>
  );
}
