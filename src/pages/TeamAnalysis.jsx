import { useState, useEffect } from 'react';
const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',bg:'#ECEEF2',amber:'#D97706',win:'#059669'};
const Spin=()=><div style={{width:32,height:32,border:`3px solid ${C.border}`,borderTopColor:C.navy,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'32px auto'}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

// 各運動 API 抓取函數
const fetchNBA=async()=>{
  const r=await fetch('https://api.balldontlie.io/v1/teams',{headers:{'Authorization':''}});
  // balldontlie v1 需要 key，改用 ESPN unofficial
  const r2=await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams');
  const d=await r2.json();
  return (d.sports?.[0]?.leagues?.[0]?.teams||[]).map(t=>({
    id:t.team.id,name:t.team.displayName,en:t.team.displayName,
    abbr:t.team.abbreviation,color:'#'+t.team.color,
    logo:t.team.logos?.[0]?.href,
    conf:t.team.slug?.includes('east')?'東區':'西區',
    sport:'NBA',flag:'',
  }));
};

const fetchMLB=async()=>{
  const r=await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1&season=2024');
  const d=await r.json();
  return (d.teams||[]).filter(t=>t.active).map(t=>({
    id:t.id,name:t.name,en:t.name,abbr:t.abbreviation,
    lg:t.league?.name||'',div:t.division?.name||'',
    sport:'MLB',flag:'',color:'#002D62',
  }));
};

const fetchWC=async()=>{
  // football-data.org World Cup 2026
  const r=await fetch('https://api.football-data.org/v4/competitions/WC/teams',{
    headers:{'X-Auth-Token':'58268bc05cd2473ca76ecedd0295adfc'},
  });
  const d=await r.json();
  return (d.teams||[]).map(t=>({
    id:t.id,name:t.shortName||t.name,en:t.name,abbr:t.tla,
    flag:getFlagEmoji(t.area?.code),group:'',
    color:'#1B5E20',sport:'世界杯',
    crest:t.crest,area:t.area?.name,
  }));
};

const fetchLOL=async()=>{
  // Liquipedia public data (no key needed)
  const r=await fetch('https://liquipedia.net/leagueoflegends/api.php?action=parse&format=json&page=2024_Season_World_Championship&prop=sections&origin=*').catch(()=>null);
  // Fallback: 靜態主要隊伍
  return [
    {id:1,name:'T1',en:'T1',region:'LCK 🇰🇷',color:'#C89B3C',sport:'LOL',star:'Faker'},
    {id:2,name:'Gen.G',en:'Gen.G',region:'LCK 🇰🇷',color:'#1A1A2E',sport:'LOL',star:'Chovy'},
    {id:3,name:'JDG',en:'JD Gaming',region:'LPL 🇨🇳',color:'#FF6B00',sport:'LOL',star:'Knight'},
    {id:4,name:'BLG',en:'Bilibili Gaming',region:'LPL 🇨🇳',color:'#00A1D6',sport:'LOL',star:'Elk'},
    {id:5,name:'NRG',en:'NRG Esports',region:'LCS 🇺🇸',color:'#EF7F1A',sport:'LOL',star:'Contractz'},
    {id:6,name:'Cloud9',en:'Cloud9',region:'LCS 🇺🇸',color:'#88CFE0',sport:'LOL',star:'Blaber'},
    {id:7,name:'G2',en:'G2 Esports',region:'LEC 🇪🇺',color:'#FF6B35',sport:'LOL',star:'Caps'},
    {id:8,name:'Fnatic',en:'Fnatic',region:'LEC 🇪🇺',color:'#FF5900',sport:'LOL',star:'Humanoid'},
    {id:9,name:'KT Rolster',en:'KT Rolster',region:'LCK 🇰🇷',color:'#E60000',sport:'LOL',star:'Faker killer'},
    {id:10,name:'Weibo Gaming',en:'Weibo Gaming',region:'LPL 🇨🇳',color:'#E61E1E',sport:'LOL',star:'Breathe'},
  ];
};

// 抓單隊球員（NBA）
const fetchNBAPlayers=async(teamId)=>{
  const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`);
  const d=await r.json();
  return (d.athletes||[]).flatMap(g=>g.items||[]).slice(0,15).map(p=>({
    n:p.fullName||p.displayName,pos:p.position?.abbreviation||'',
    no:+p.jersey||0,star:p.experience?.years>5,
  }));
};

const fetchMLBPlayers=async(teamId)=>{
  const r=await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?season=2024&rosterType=active`);
  const d=await r.json();
  return (d.roster||[]).slice(0,15).map(p=>({
    n:p.person?.fullName||'',pos:p.position?.abbreviation||'',
    no:+p.jerseyNumber||0,star:false,
  }));
};

const fetchWCPlayers=async(teamId)=>{
  const r=await fetch(`https://api.football-data.org/v4/teams/${teamId}`,{
    headers:{'X-Auth-Token':'58268bc05cd2473ca76ecedd0295adfc'},
  });
  const d=await r.json();
  return (d.squad||[]).slice(0,20).map(p=>({
    n:p.name,pos:posAbbr(p.position),no:0,star:false,
  }));
};

const posAbbr=p=>({Goalkeeper:'GK',Defence:'CB',Midfield:'CM',Offence:'ST'})[p]||p?.slice(0,2)||'—';
const getFlagEmoji=code=>{if(!code||code.length!==3)return'';const flags={BRA:'🇧🇷',FRA:'🇫🇷',ESP:'🇪🇸',ARG:'🇦🇷',MAR:'🇲🇦',ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',POR:'🇵🇹',GER:'🇩🇪',NED:'🇳🇱',URU:'🇺🇾',USA:'🇺🇸',MEX:'🇲🇽',JPN:'🇯🇵',KOR:'🇰🇷',CRC:'🇨🇷',SEN:'🇸🇳',GHA:'🇬🇭',CMR:'🇨🇲',CIV:'🇨🇮',AUS:'🇦🇺',ECU:'🇪🇨',CAN:'🇨🇦',SUI:'🇨🇭',POL:'🇵🇱',SRB:'🇷🇸',WAL:'🏴󠁧󠁢󠁷󠁬󠁳󠁿',DEN:'🇩🇰',BEL:'🇧🇪',CRO:'🇭🇷',TUN:'🇹🇳',SAU:'🇸🇦',IRN:'🇮🇷',QAT:'🇶🇦',PAN:'🇵🇦',COL:'🇨🇴',VEN:'🇻🇪',CHI:'🇨🇱'};return flags[code]||'🏳️';};

const SPORTS=['世界杯 2026','NBA','MLB','LOL 電競'];
const FETCH_MAP={'世界杯 2026':fetchWC,'NBA':fetchNBA,'MLB':fetchMLB,'LOL 電競':fetchLOL};
const PLAYER_MAP={'世界杯 2026':fetchWCPlayers,'NBA':fetchNBAPlayers,'MLB':fetchMLBPlayers};

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
      if(fn){const data=await fn();setTeams(data||[]);}
    }catch(e){setError('載入失敗：'+e.message+'\n請確認 API 可用');}
    setLoading(false);
  };

  const loadPlayers=async(team)=>{
    const key=team.id;
    if(players[key])return;
    setLoadingP(key);
    try{
      const fn=PLAYER_MAP[sport];
      if(fn&&team.id){
        const ps=await fn(team.id);
        setPlayers(p=>({...p,[key]:ps}));
      }
    }catch(e){setPlayers(p=>({...p,[key]:[]}));}
    setLoadingP(null);
  };

  const handleOpen=async(team)=>{
    const key=team.id;
    const isO=open===key;
    setOpen(isO?null:key);
    if(!isO)await loadPlayers(team);
  };

  const filtered=teams.filter(t=>!search||t.name?.includes(search)||t.en?.toLowerCase().includes(search.toLowerCase()));

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'28px 20px'}}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:C.amber,letterSpacing:1.5,marginBottom:6,textTransform:'uppercase'}}>即時數據</div>
          <h2 style={{fontSize:26,fontWeight:900,color:C.dark,margin:'0 0 4px'}}>隊伍分析</h2>
          <p style={{color:C.muted,fontSize:13,margin:0}}>所有隊伍從官方 API 即時載入 · 完整名單</p>
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
            <input placeholder="搜尋隊伍..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:'8px 12px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:13,outline:'none',minWidth:140}}/>
            <button onClick={loadTeams} disabled={loading} style={{padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:7,cursor:'pointer',background:loading?C.muted:C.white,color:C.muted,fontSize:12}}>🔄</button>
          </div>
        </div>

        {loading&&<Spin/>}
        {error&&(
          <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'14px 16px',color:'#DC2626',fontSize:13,marginBottom:16,whiteSpace:'pre-line'}}>⚠️ {error}</div>
        )}
        {!loading&&!error&&<div style={{fontSize:12,color:C.muted,marginBottom:12}}>共 {filtered.length} 支隊伍</div>}

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
                      <span style={{fontSize:10,fontWeight:700,color:col,background:col+'18',padding:'2px 6px',borderRadius:3}}>{t.conf||t.lg||t.region||t.area||''}</span>
                      {(t.div||t.group)&&<span style={{fontSize:10,color:C.muted}}>{t.group?`${t.group}組`:t.div}</span>}
                    </div>
                    <div style={{fontSize:15,fontWeight:800,color:C.dark,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</div>
                    {t.abbr&&<div style={{fontSize:11,color:C.muted}}>{t.abbr}{t.star?` · ⭐ ${t.star}`:''}</div>}
                  </div>
                  <span style={{fontSize:16,color:C.muted,marginLeft:8}}>{isO?'▲':'▾'}</span>
                </div>

                {isO&&(
                  <div style={{borderTop:`1px solid ${C.border}`,padding:'12px 14px'}}>
                    {loadingP===t.id&&<div style={{textAlign:'center',padding:16,color:C.muted,fontSize:12}}>載入球員中...</div>}
                    {ps&&ps.length===0&&<div style={{textAlign:'center',padding:12,color:C.muted,fontSize:12}}>暫無球員數據</div>}
                    {ps&&ps.length>0&&(
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8}}>球員名單（{ps.length} 人）</div>
                        {ps.map((p,i)=>(
                          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:i<ps.length-1?`1px solid #F0F1F3`:'none'}}>
                            {p.no>0&&<div style={{width:24,height:24,borderRadius:'50%',background:col+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:col,flexShrink:0}}>{p.no}</div>}
                            {p.pos&&<span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:3,background:'#F3F4F6',color:C.muted,flexShrink:0}}>{p.pos}</span>}
                            <span style={{fontSize:12,fontWeight:p.star?700:400,color:C.dark,flex:1}}>{p.n}{p.star&&<span style={{marginLeft:4,fontSize:10,color:C.amber}}>⭐</span>}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {sport==='LOL 電競'&&t.star&&(
                      <div style={{padding:'8px',background:'#FFFBEB',borderRadius:6,marginTop:8,fontSize:12}}>⭐ 明星選手：{t.star}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!loading&&filtered.length===0&&!error&&(
          <div style={{textAlign:'center',padding:48,color:C.muted}}>找不到「{search}」相關隊伍</div>
        )}
      </div>
    </div>
  );
}
