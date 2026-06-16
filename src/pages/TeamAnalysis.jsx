import { useState, useEffect } from 'react';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',bg:'#ECEEF2',amber:'#D97706',win:'#059669'};
const Spin=()=><div style={{width:32,height:32,border:`3px solid ${C.border}`,borderTopColor:C.navy,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'32px auto'}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

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
].map(([group,name,abbr,flag],idx)=>({
  id:`wc2026-${abbr}`, name, en:name, abbr, flag, group, area:name, sport:'世界杯 2026', color:'#1B5E20',
  note:'2026 世界盃靜態參賽隊資料。若官方 API 開放完整名單後可替換為即時資料。',
  players:[
    {n:'完整 2026 名單待官方 API 開放',pos:'INFO',no:0,star:false},
    {n:'此頁先提供隊伍/分組分析入口',pos:'DATA',no:0,star:false},
  ],
}));

const LOL_TEAMS = [
  ['T1','T1','LCK 🇰🇷','#C89B3C','Faker'],['Gen.G','Gen.G','LCK 🇰🇷','#1A1A2E','Chovy'],['Hanwha Life Esports','HLE','LCK 🇰🇷','#F37321','Peanut'],['Dplus KIA','DK','LCK 🇰🇷','#00A3E0','ShowMaker'],['KT Rolster','KT','LCK 🇰🇷','#E60000','Bdd'],
  ['Bilibili Gaming','BLG','LPL 🇨🇳','#00A1D6','Elk'],['Top Esports','TES','LPL 🇨🇳','#E4002B','JackeyLove'],['JD Gaming','JDG','LPL 🇨🇳','#FF6B00','Ruler'],['Weibo Gaming','WBG','LPL 🇨🇳','#E61E1E','Xiaohu'],['LNG Esports','LNG','LPL 🇨🇳','#0F3460','Scout'],
  ['G2 Esports','G2','LEC 🇪🇺','#FF6B35','Caps'],['Fnatic','FNC','LEC 🇪🇺','#FF5900','Humanoid'],['Karmine Corp','KC','LEC 🇪🇺','#0068FF','Caliste'],['Team Liquid','TL','LCS 🇺🇸','#1E4D8F','APA'],['Cloud9','C9','LCS 🇺🇸','#88CFE0','Blaber'],['FlyQuest','FLY','LCS 🇺🇸','#00C389','Inspired'],
  ['PSG Talon','PSG','PCS 🇹🇼/🇭🇰','#D71920','Maple'],['GAM Esports','GAM','VCS 🇻🇳','#E4002B','Levi'],['LOUD','LLL','CBLOL 🇧🇷','#00FF85','Robo'],['FURIA','FUR','CBLOL 🇧🇷','#111827','Tutsz'],
].map(([name,abbr,region,color,star],idx)=>({
  id:`lol-${abbr}`, name, en:name, abbr, region, color, sport:'LOL 電競', star,
  players:[{n:star,pos:'核心',no:0,star:true},{n:'完整隊伍名單依賽季更新',pos:'INFO',no:0,star:false}],
}));

const safeJson = async (r) => {
  const text = await r.text();
  try { return JSON.parse(text); } catch { throw new Error(text.slice(0,120) || `HTTP ${r.status}`); }
};

const fetchNBA=async()=>{
  // balldontlie v1 需要 key；這裡直接用 ESPN unofficial，避免空 Authorization 造成 401 中斷。
  const r=await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams');
  if(!r.ok) throw new Error(`ESPN NBA HTTP ${r.status}`);
  const d=await safeJson(r);
  const rows=d.sports?.[0]?.leagues?.[0]?.teams || [];
  return rows.map(x=>{
    const t=x.team || x;
    const color=t.color ? `#${String(t.color).replace('#','')}` : C.navy;
    return {
      id:`nba-${t.id}`, espnId:t.id, name:t.displayName || t.name, en:t.displayName || t.name,
      abbr:t.abbreviation, color, logo:t.logos?.[0]?.href, conf:t.groups?.name || t.groups?.abbreviation || '',
      sport:'NBA', flag:'', players:[],
    };
  }).filter(t=>t.name);
};

const fetchMLB=async()=>{
  const season = new Date().getFullYear();
  const r=await fetch(`https://statsapi.mlb.com/api/v1/teams?sportId=1&season=${season}`);
  if(!r.ok) throw new Error(`MLB Stats HTTP ${r.status}`);
  const d=await safeJson(r);
  return (d.teams||[]).filter(t=>t.active).map(t=>({
    id:`mlb-${t.id}`, mlbId:t.id, name:t.name, en:t.name, abbr:t.abbreviation,
    lg:t.league?.name||'', div:t.division?.name||'', sport:'MLB', flag:'', color:'#002D62', players:[],
  }));
};

const fetchWC=async()=>WC2026_TEAMS;
const fetchLOL=async()=>LOL_TEAMS;

const fetchNBAPlayers=async(team)=>{
  const teamId = team.espnId || String(team.id).replace('nba-','');
  const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`);
  if(!r.ok) throw new Error(`ESPN roster HTTP ${r.status}`);
  const d=await safeJson(r);
  return (d.athletes||[]).flatMap(g=>g.items||[]).slice(0,15).map(p=>({
    n:p.fullName||p.displayName||'', pos:p.position?.abbreviation||'', no:+p.jersey||0, star:(p.experience?.years||0)>5,
  })).filter(p=>p.n);
};

const fetchMLBPlayers=async(team)=>{
  const teamId = team.mlbId || String(team.id).replace('mlb-','');
  const season = new Date().getFullYear();
  const r=await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?season=${season}&rosterType=active`);
  if(!r.ok) throw new Error(`MLB roster HTTP ${r.status}`);
  const d=await safeJson(r);
  return (d.roster||[]).slice(0,15).map(p=>({
    n:p.person?.fullName||'', pos:p.position?.abbreviation||'', no:+p.jerseyNumber||0, star:false,
  })).filter(p=>p.n);
};

const fetchStaticPlayers=async(team)=>team.players || [];

const SPORTS=['世界杯 2026','NBA','MLB','LOL 電競'];
const FETCH_MAP={'世界杯 2026':fetchWC,'NBA':fetchNBA,'MLB':fetchMLB,'LOL 電競':fetchLOL};
const PLAYER_MAP={'世界杯 2026':fetchStaticPlayers,'NBA':fetchNBAPlayers,'MLB':fetchMLBPlayers,'LOL 電競':fetchStaticPlayers};

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

  const loadTeams=async()=>{
    setLoading(true);setError('');setTeams([]);setOpen(null);
    try{
      const fn=FETCH_MAP[sport];
      const data=fn ? await fn() : [];
      setTeams(data||[]);
      if(!data?.length) setError(`${sport} 目前沒有可顯示的隊伍資料`);
    }catch(e){
      setError('載入失敗：'+e.message+'\n已避免整頁崩潰，請稍後重試或檢查 API 來源。');
    }finally{
      setLoading(false);
    }
  };

  const loadPlayers=async(team)=>{
    const key=team.id;
    if(players[key])return;
    setLoadingP(key);
    try{
      const fn=PLAYER_MAP[sport];
      const ps=fn ? await fn(team) : [];
      setPlayers(p=>({...p,[key]:ps||[]}));
    }catch(e){
      setPlayers(p=>({...p,[key]:[{n:'名單暫時無法載入',pos:'ERR',no:0,star:false},{n:e.message,pos:'API',no:0,star:false}]}));
    }finally{
      setLoadingP(null);
    }
  };

  const handleOpen=async(team)=>{
    const key=team.id;
    const isO=open===key;
    setOpen(isO?null:key);
    if(!isO)await loadPlayers(team);
  };

  const q=search.trim().toLowerCase();
  const filtered=teams.filter(t=>!q||t.name?.toLowerCase().includes(q)||t.en?.toLowerCase().includes(q)||t.abbr?.toLowerCase().includes(q)||t.group?.toLowerCase().includes(q));

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'28px 20px'}}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:C.amber,letterSpacing:1.5,marginBottom:6,textTransform:'uppercase'}}>即時數據</div>
          <h2 style={{fontSize:26,fontWeight:900,color:C.dark,margin:'0 0 4px'}}>隊伍分析</h2>
          <p style={{color:C.muted,fontSize:13,margin:0}}>世界杯使用靜態 2026 分組資料 · NBA/MLB 從公開 API 載入 · LOL 使用主要隊伍資料</p>
        </div>

        <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
          <div style={{overflowX:'auto',flex:1}}>
            <div style={{display:'flex',gap:4,width:'max-content'}}>
              {SPORTS.map(s=>(
                <button key={s} onClick={()=>setSport(s)} style={{padding:'8px 14px',border:`1px solid ${sport===s?C.navy:C.border}`,borderRadius:7,cursor:'pointer',background:sport===s?C.navy:'transparent',color:sport===s?C.white:C.muted,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <input placeholder="搜尋隊伍 / 縮寫 / 組別..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:'8px 12px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:13,outline:'none',minWidth:170}}/>
            <button onClick={loadTeams} disabled={loading} style={{padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:7,cursor:'pointer',background:loading?C.muted:C.white,color:C.muted,fontSize:12}}>🔄</button>
          </div>
        </div>

        {loading&&<Spin/>}
        {error&&(
          <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'14px 16px',color:'#DC2626',fontSize:13,marginBottom:16,whiteSpace:'pre-line'}}>⚠️ {error}</div>
        )}
        {!loading&&<div style={{fontSize:12,color:C.muted,marginBottom:12}}>共 {filtered.length} 支隊伍</div>}

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
          {filtered.map(t=>{
            const isO=open===t.id;
            const ps=players[t.id];
            const col=t.color||C.navy;
            return(
              <div key={t.id} style={{background:C.white,border:`1.5px solid ${isO?col:C.border}`,borderRadius:10,overflow:'hidden'}}>
                <div onClick={()=>handleOpen(t)} style={{padding:'14px 16px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#F6F7FA'} onMouseLeave={e=>e.currentTarget.style.background=C.white}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',gap:6,marginBottom:5,alignItems:'center',flexWrap:'wrap'}}>
                      {t.flag&&<span style={{fontSize:16}}>{t.flag}</span>}
                      {t.crest&&<img src={t.crest} alt="" style={{width:20,height:20,objectFit:'contain'}}/>}
                      {t.logo&&<img src={t.logo} alt="" style={{width:24,height:24,objectFit:'contain'}}/>}
                      {(t.conf||t.lg||t.region||t.area)&&<span style={{fontSize:10,fontWeight:700,color:col,background:col+'18',padding:'2px 6px',borderRadius:3}}>{t.conf||t.lg||t.region||t.area}</span>}
                      {(t.div||t.group)&&<span style={{fontSize:10,color:C.muted}}>{t.group?`${t.group}組`:t.div}</span>}
                    </div>
                    <div style={{fontSize:15,fontWeight:800,color:C.dark,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</div>
                    {t.abbr&&<div style={{fontSize:11,color:C.muted}}>{t.abbr}{t.star?` · ⭐ ${t.star}`:''}</div>}
                  </div>
                  <span style={{fontSize:18,color:col,transform:isO?'rotate(180deg)':'none',transition:'0.2s'}}>⌄</span>
                </div>
                {isO&&(
                  <div style={{borderTop:`1px solid ${C.border}`,padding:'12px 16px',background:'#FAFBFC'}}>
                    {t.note&&<div style={{fontSize:11,color:C.muted,lineHeight:1.5,marginBottom:10}}>ℹ️ {t.note}</div>}
                    <div style={{fontSize:11,fontWeight:800,color:C.navy,marginBottom:8}}>隊伍名單 / 核心資訊</div>
                    {loadingP===t.id&&<div style={{fontSize:12,color:C.muted}}>載入名單中...</div>}
                    {ps&&ps.length>0&&ps.map((p,i)=>(
                      <div key={`${p.n}-${i}`} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:i<ps.length-1?'1px solid #EEF0F4':'none'}}>
                        <span style={{width:28,fontSize:11,color:C.muted,fontFamily:'ui-monospace,monospace'}}>{p.no||'—'}</span>
                        <span style={{flex:1,fontSize:13,color:C.dark,fontWeight:p.star?800:500}}>{p.n}</span>
                        <span style={{fontSize:10,color:C.muted,background:'#EEF0F4',padding:'2px 6px',borderRadius:4}}>{p.pos||'—'}</span>
                      </div>
                    ))}
                    {ps&&ps.length===0&&<div style={{fontSize:12,color:C.muted}}>暫無名單資料</div>}
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
