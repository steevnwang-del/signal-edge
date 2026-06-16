import { useEffect, useMemo, useState } from 'react';
import { gateway } from '../services/apiGateway';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',bg:'#ECEEF2',panel:'#F6F7FA',amber:'#D97706',win:'#059669'};
const WC_TEAMS=[
 ['A','Mexico','MEX','北美主場圈'],['A','South Africa','RSA','非洲代表'],['A','South Korea','KOR','亞洲速度型'],['A','Czechia','CZE','歐洲組織型'],
 ['B','Canada','CAN','地主優勢'],['B','Bosnia and Herzegovina','BIH','歐洲對抗型'],['B','Qatar','QAT','亞洲代表'],['B','Switzerland','SUI','歐洲穩定型'],
 ['C','Brazil','BRA','奪冠熱門'],['C','Morocco','MAR','非洲強隊'],['C','Haiti','HTI','黑馬觀察'],['C','Scotland','SCO','歐洲硬派'],
 ['D','United States','USA','地主主場'],['D','Paraguay','PAR','南美對抗'],['D','Australia','AUS','亞洲/大洋洲力量'],['D','Turkey','TUR','歐亞強度'],
 ['E','Germany','GER','傳統豪門'],['E','Curacao','CUW','新興黑馬'],['E','Ivory Coast','CIV','非洲天賦'],['E','Ecuador','ECU','南美節奏'],
 ['F','Netherlands','NED','歐洲強隊'],['F','Japan','JPN','亞洲技術流'],['F','Sweden','SWE','北歐穩定'],['F','Tunisia','TUN','非洲紀律'],
 ['G','Belgium','BEL','歐洲強隊'],['G','Egypt','EGY','非洲核心'],['G','Iran','IRI','亞洲硬度'],['G','New Zealand','NZL','大洋洲代表'],
 ['H','Spain','ESP','奪冠熱門'],['H','Cape Verde','CPV','黑馬觀察'],['H','Saudi Arabia','KSA','亞洲代表'],['H','Uruguay','URU','南美強隊'],
 ['I','France','FRA','奪冠熱門'],['I','Senegal','SEN','非洲強隊'],['I','Iraq','IRQ','亞洲代表'],['I','Norway','NOR','歐洲新勢力'],
 ['J','Argentina','ARG','衛冕級熱門'],['J','Algeria','DZA','非洲強隊'],['J','Austria','AUT','歐洲組織'],['J','Jordan','JOR','亞洲黑馬'],
 ['K','Portugal','POR','歐洲豪門'],['K','DR Congo','COD','非洲力量'],['K','Uzbekistan','UZB','亞洲新勢力'],['K','Colombia','COL','南美強隊'],
 ['L','England','ENG','奪冠熱門'],['L','Croatia','CRO','大賽經驗'],['L','Ghana','GHA','非洲速度'],['L','Panama','PAN','中北美代表'],
].map(([group,name,abbr,note],i)=>({id:`wc-${abbr}`,tab:'worldcup',group,name,abbr,note,area:'世界盃 2026',status:'參賽隊伍',core:[{n:`${group} 組`,pos:'GROUP'},{n:note,pos:'PROFILE'},{n:'正式球員名單公布後更新',pos:'ROSTER'}]}));
const MSI_TEAMS=[
 ['LCK 🇰🇷','Gen.G Esports','GEN','Chovy'],['LCK 🇰🇷','T1','T1','Faker'],['LPL 🇨🇳','Bilibili Gaming','BLG','Elk'],['LPL 🇨🇳',"Anyone's Legend",'AL','核心陣容待確認'],['LEC 🇪🇺','G2 Esports','G2','Caps'],['LEC 🇪🇺','Movistar KOI','MKOI','核心陣容待確認'],['LCP 🇹🇼','CTBC Flying Oyster','CFO','台港澳代表'],['LCP/VCS 🇻🇳','GAM Esports','GAM','Levi'],['LCS 🇺🇸','FlyQuest','FLY','Inspired'],['LCS 🇺🇸','LYON','LYON','核心陣容待確認'],['CBLOL 🇧🇷','FURIA','FUR','Tutsz'],
].map(([region,name,abbr,star])=>({id:`msi-${abbr}`,tab:'msi',region,name,abbr,star,area:'MSI 2026',status:'重點參賽隊',core:[{n:star,pos:'核心'},{n:'BO5 / 國際賽版本適性',pos:'FOCUS'},{n:'依官方最新名單更新',pos:'ROSTER'}]}));
const LOL_TEAMS=[
 ['LCK','Gen.G','GEN'],['LCK','T1','T1'],['LCK','Hanwha Life Esports','HLE'],['LCK','Dplus KIA','DK'],['LCK','kt Rolster','KT'],['LCK','DRX','DRX'],['LCK','Nongshim RedForce','NS'],['LCK','FearX','FOX'],
 ['LPL','Bilibili Gaming','BLG'],['LPL','Top Esports','TES'],['LPL','JD Gaming','JDG'],['LPL','Weibo Gaming','WBG'],['LPL','Anyone\'s Legend','AL'],['LPL','Invictus Gaming','IG'],['LPL','LNG Esports','LNG'],['LPL','EDward Gaming','EDG'],
 ['LEC','G2 Esports','G2'],['LEC','Fnatic','FNC'],['LEC','Karmine Corp','KC'],['LEC','Movistar KOI','MKOI'],['LEC','Team Heretics','TH'],['LEC','Team BDS','BDS'],
 ['LCS','FlyQuest','FLY'],['LCS','Cloud9','C9'],['LCS','Team Liquid','TL'],['LCS','100 Thieves','100T'],['LCS','Shopify Rebellion','SR'],
 ['LCP','CTBC Flying Oyster','CFO'],['LCP','PSG Talon','PSG'],['LCP','Talon','TLN'],['LCP','Vikings Esports','VKE'],['VCS','GAM Esports','GAM'],['CBLOL','FURIA','FUR'],['CBLOL','paiN Gaming','PNG']
].map(([region,name,abbr])=>({id:`lol-${region}-${abbr}`,tab:'lol',region,name,abbr,area:'LOL 主要賽區',status:'賽區隊伍',core:[{n:region,pos:'REGION'},{n:'近期戰績與版本適性待接資料',pos:'PROFILE'}]}));
const normalizeTeam=(t,tab)=>({id:t.id||t.abbr||t.name,tab,name:t.name||t.displayName||t.shortDisplayName||'Team',abbr:t.abbr||t.shortDisplayName||t.name,region:t.region||t.conf||t.division||'',area:t.area||t.league||'',status:t.status||'隊伍',core:t.core||[]});
const normalizeRoster=(players=[])=>players.map((p,i)=>({n:p.n||p.name||p.fullName||p.displayName||`Player ${i+1}`,pos:p.pos||p.position||p.defaultPosition||'',no:p.no||p.jersey||p.number||''})).filter(p=>p.n);

export default function TeamAnalysis(){
  const [tab,setTab]=useState('worldcup');
  const [teams,setTeams]=useState([]);
  const [query,setQuery]=useState('');
  const [open,setOpen]=useState(null);
  const [rosters,setRosters]=useState({});
  const [loading,setLoading]=useState(false);

  useEffect(()=>{load(tab);setOpen(null);},[tab]);
  const load=async(t)=>{setLoading(true);try{if(t==='worldcup')setTeams(WC_TEAMS);else if(t==='msi')setTeams(MSI_TEAMS);else if(t==='lol')setTeams(LOL_TEAMS);else if(t==='nba'){const r=await gateway('nba','getTeams',{});setTeams((r.teams||[]).map(x=>normalizeTeam(x,'nba')));}else if(t==='mlb'){const r=await gateway('mlb','getTeams',{});setTeams((r.teams||[]).map(x=>normalizeTeam(x,'mlb')));}}catch(e){console.warn('[TeamAnalysis]',e.message);setTeams(t==='nba'||t==='mlb'?[]:t==='msi'?MSI_TEAMS:t==='lol'?LOL_TEAMS:WC_TEAMS);}setLoading(false);};
  const toggle=async(team)=>{const id=team.id;if(open===id){setOpen(null);return;}setOpen(id);if(rosters[id])return;if(['nba','mlb'].includes(tab)){setRosters(p=>({...p,[id]:{loading:true,items:[]}}));try{const r=await gateway(tab,'getTeamRoster',{teamId:id,abbr:team.abbr});setRosters(p=>({...p,[id]:{loading:false,items:normalizeRoster(r.players||r.roster||[])}}));}catch(e){setRosters(p=>({...p,[id]:{loading:false,items:[]}}));}}else{setRosters(p=>({...p,[id]:{loading:false,items:team.core||[]}}));}};
  const filtered=useMemo(()=>teams.filter(t=>[t.name,t.abbr,t.region,t.group,t.area].join(' ').toLowerCase().includes(query.toLowerCase())),[teams,query]);
  const tabs=[['worldcup','世界盃 2026'],['msi','MSI 2026'],['lol','LOL 主要賽區'],['nba','NBA'],['mlb','MLB']];
  return <div style={{background:C.bg,minHeight:'100vh'}}><div style={{maxWidth:1120,margin:'0 auto',padding:'28px 20px'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'end',flexWrap:'wrap',marginBottom:18}}><div><h2 style={{fontSize:28,fontWeight:950,color:C.dark,margin:'0 0 6px'}}>隊伍分析</h2><p style={{fontSize:13,color:C.muted,margin:0}}>世界盃分組、MSI 重點隊伍、LOL 主要賽區，以及 NBA / MLB 球隊名單。</p></div><div style={{display:'flex',gap:8}}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜尋隊伍 / 縮寫 / 分組..." style={{padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:8,minWidth:240}}/><button onClick={()=>load(tab)} style={{border:`1px solid ${C.border}`,background:C.white,borderRadius:8,padding:'0 12px',cursor:'pointer'}}>↻</button></div></div>
    <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:14}}>{tabs.map(([id,l])=><button key={id} onClick={()=>setTab(id)} style={{padding:'9px 15px',border:`1px solid ${C.border}`,borderRadius:8,background:tab===id?C.navy:C.white,color:tab===id?C.white:C.muted,cursor:'pointer',fontWeight:850,whiteSpace:'nowrap'}}>{l}</button>)}</div>
    <div style={{fontSize:12,color:C.muted,marginBottom:14}}>共 {filtered.length} 支隊伍{loading?' · 載入中':''}</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12,alignItems:'start'}}>{filtered.map(t=>{const is=open===t.id;const r=rosters[t.id];return <div key={t.id} style={{background:C.white,border:`1px solid ${is?C.navy:C.border}`,borderRadius:12,overflow:'hidden',boxShadow:is?'0 6px 20px rgba(15,52,96,.10)':'none'}}><button onClick={()=>toggle(t)} style={{width:'100%',border:'none',background:'transparent',padding:16,cursor:'pointer',textAlign:'left',display:'flex',justifyContent:'space-between',gap:10}}><div style={{minWidth:0}}><div style={{display:'flex',gap:6,alignItems:'center',marginBottom:7,flexWrap:'wrap'}}>{(t.group||t.region)&&<span style={{fontSize:10,fontWeight:900,color:C.navy,background:'#EAF2FF',padding:'3px 7px',borderRadius:5}}>{t.group?`${t.group} 組`:t.region}</span>}<span style={{fontSize:10,color:C.muted}}>{t.area||t.status}</span></div><div style={{fontSize:17,fontWeight:950,color:C.dark,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.name}</div><div style={{fontSize:12,color:C.muted,marginTop:3}}>{t.abbr}{t.star?` · ⭐ ${t.star}`:''}</div></div><span style={{fontSize:18,color:C.navy,transform:is?'rotate(180deg)':'none'}}>⌄</span></button>{is&&<div style={{borderTop:`1px solid ${C.border}`,padding:'12px 16px',background:'#FAFBFC'}}><div style={{fontSize:12,fontWeight:900,color:C.dark,marginBottom:10}}>核心資訊</div>{r?.loading&&<div style={{fontSize:12,color:C.muted}}>載入名單...</div>}{!r?.loading&&((r?.items||[]).length? (r.items||[]).slice(0,28).map((p,i)=><div key={`${p.n}-${i}`} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:i<(r.items.length-1)?'1px solid #EEF0F4':'none'}}><span style={{width:30,fontSize:11,color:C.muted,fontFamily:'ui-monospace,monospace'}}>{p.no||'—'}</span><span style={{flex:1,fontSize:13,color:C.dark,fontWeight:700}}>{p.n}</span><span style={{fontSize:10,color:C.muted,background:'#EEF0F4',padding:'2px 6px',borderRadius:4}}>{p.pos||'INFO'}</span></div>) : <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>暫無完整名單。此隊伍已建立追蹤入口，正式名單或後端資料開放後會自動補齊。</div>)}</div>}</div>;})}</div>
  </div></div>;
}
