import { useEffect, useMemo, useState } from 'react';
import APISettings from './APISettings';
import PromptSettings from './PromptSettings';
import BacktestPanel from './BacktestPanel';
import { getUsers, updateUser, getAnalyses, saveSettings, getSettings, getApiUsage } from '../../services/firestore';
import { OWNER_EMAIL } from '../../config/owner';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626',panelAlt:'#F6F7FA'};
const ROLES=['free','vip','agent','admin','super_admin'];
const RC={free:C.muted,vip:C.amber,agent:'#7C3AED',admin:C.win,super_admin:C.loss};
const TABS=[['overview','總覽'],['signals','信號管理'],['settle','結算'],['users','用戶'],['pricing','定價'],['invite','邀請獎勵'],['ads','廣告'],['content','內容'],['settings','系統'],['usage','API 用量'],['backtest','回測'],['api','API 設定'],['prompt','Prompt']];
const isOwnerUser = (u) => String(u?.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase() || u?.isOwner === true;
const editableRolesFor = (u) => isOwnerUser(u) ? ['super_admin'] : ROLES.filter(r => r !== 'super_admin');

const Field = ({label, children}) => <label style={{display:'block'}}><div style={{fontSize:11,color:C.muted,fontWeight:800,marginBottom:5}}>{label}</div>{children}</label>;
const input = {width:'100%',boxSizing:'border-box',padding:'9px 10px',border:`1px solid ${C.border}`,borderRadius:8,fontSize:13};
const Card = ({children, style={}}) => <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:18,...style}}>{children}</div>;

const DEFAULT_AD = { id:'home_top', enabled:false, placement:'home_top', type:'banner', title:'', description:'', sponsorName:'', imageUrl:'', linkUrl:'', priority:10 };

export default function AdminPanel({signals,setPreviewRole,setPage,siteSettings,setSiteSettings}){
  const [tab,setTab]=useState('overview');
  const [users,setUsers]=useState([]);
  const [editing,setEditing]=useState(null);
  const [stats,setStats]=useState({users:0,vip:0,analyses:0,hitRate:0});
  const [saving,setSaving]=useState(false);
  const [usageDay,setUsageDay]=useState([]);
  const [usageMonth,setUsageMonth]=useState([]);
  const [plans,setPlans]=useState(siteSettings?.plans||{});
  const [ads,setAds]=useState(siteSettings?.ads?.length ? siteSettings.ads : [DEFAULT_AD]);
  const [invite,setInvite]=useState(siteSettings?.inviteRewards||{enabled:true,inviterUnlocks:2,inviteeUnlocks:1,rewardDays:1,allGamesThreshold:3,passThreshold:10});
  const [allInvites,setAllInvites]=useState([]);
  const [invitesLoading,setInvitesLoading]=useState(false);
  const loadAllInvites=async()=>{setInvitesLoading(true);try{const mod=await import('../../services/firestore.js');const list=await mod.getAllInvites?.({limitN:200});setAllInvites(list||[]);}catch(e){console.warn('[Admin] loadAllInvites:',e.message);}setInvitesLoading(false);};
  const [freeLimits,setFreeLimits]=useState(siteSettings?.freeLimits||{guestDailyCards:3,freeDailyCards:5,registeredBonusCards:2});
  const [brand,setBrand]=useState(siteSettings?.brandSettings||{showTaiwanCalculator:true,showInviteCta:true,showEngineeringCopy:false});
  const [analysisSettings,setAnalysisSettings]=useState(siteSettings?.analysisSettings||{enabledSports:['世界杯','MLB','NBA','電競'],minDataCompleteness:0.65,autoGenerateCount:12});
  const [content,setContent]=useState({marqueeText:siteSettings?.marqueeText||'',marqueeEnabled:siteSettings?.marqueeEnabled!==false,playerSearchEnabled:!!siteSettings?.playerSearchEnabled});

  useEffect(()=>{loadStats();},[]);
  useEffect(()=>{if(tab==='users')loadUsers(); if(tab==='usage')loadUsage();},[tab]);
  useEffect(()=>{setPlans(siteSettings?.plans||{});setAds(siteSettings?.ads?.length?siteSettings.ads:[DEFAULT_AD]);},[siteSettings]);

  const loadStats=async()=>{try{const[us,an]=await Promise.all([getUsers({limitN:200}),getAnalyses({limitN:200})]);const settled=an.filter(a=>a.result==='win'||a.result==='loss');const wins=settled.filter(a=>a.result==='win').length;setStats({users:us.length,vip:us.filter(u=>u.role==='vip').length,analyses:an.length,hitRate:settled.length?+(wins/settled.length*100).toFixed(1):0});}catch{}};
  const loadUsers=async()=>setUsers(await getUsers({limitN:150}));
  const loadUsage=async()=>{setUsageDay(await getApiUsage({period:'day',limitN:80}));setUsageMonth(await getApiUsage({period:'month',limitN:80}));};

  const savePatch=async(patch,msg='設定已儲存')=>{setSaving(true);const next={...(siteSettings||{}),...patch};setSiteSettings(next);const ok=await saveSettings(patch);setSaving(false);alert(ok?'✅ '+msg:'⚠️ 前端已更新，但 Firestore 儲存失敗，請檢查 rules');};

  const saveUser=async()=>{if(!editing)return;if(isOwnerUser(editing)){alert('Owner 帳號不可在前端被修改。');return;}if(editing.role==='super_admin'){alert('不能從前端建立 super_admin。');return;}const ok=await updateUser(editing.id,{role:editing.role,note:editing.note||''});if(ok){setUsers(p=>p.map(u=>u.id===editing.id?{...u,...editing}:u));setEditing(null);}else alert('更新失敗，請確認 Firestore 規則');};

  const runCron=async()=>{try{const r=await fetch('/api/cron/generate-analysis',{method:'POST',headers:{'Content-Type':'application/json','x-admin-trigger':'1'}});const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw new Error(d.error||`HTTP ${r.status}`);alert(`✅ 已更新 ${d.generated||0} 筆分析`);loadStats();}catch(e){alert('更新失敗：'+e.message)}};
  const runNews=async()=>{try{const r=await fetch('/api/cron/refresh-news',{method:'POST',headers:{'Content-Type':'application/json','x-admin-trigger':'1'}});const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw new Error(d.error||`HTTP ${r.status}`);alert(`✅ 新聞快取已更新：${d.total||0} 則`);}catch(e){alert('更新新聞失敗：'+e.message)}};

  const usageTotals=useMemo(()=>({day:usageDay.reduce((s,x)=>s+(x.count||0),0),month:usageMonth.reduce((s,x)=>s+(x.count||0),0),errors:usageDay.reduce((s,x)=>s+(x.errorCount||0),0)}),[usageDay,usageMonth]);

  const renderOverview=()=> <div style={{display:'grid',gap:16}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}>{[{l:'總用戶',v:stats.users,c:C.navy},{l:'VIP 用戶',v:stats.vip,c:C.amber},{l:'分析總數',v:stats.analyses,c:C.win},{l:'已結算命中率',v:stats.hitRate+'%',c:stats.hitRate>55?C.win:C.muted}].map(s=><Card key={s.l} style={{textAlign:'center'}}><div style={{fontSize:30,fontWeight:950,color:s.c}}>{s.v}</div><div style={{fontSize:12,color:C.muted}}>{s.l}</div></Card>)}</div>
    <Card><div style={{fontSize:16,fontWeight:950,color:C.dark,marginBottom:8}}>今日營運流程</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>{['更新賽事分析','更新新聞快取','檢查 API 用量','檢查廣告版位','檢查 Prompt 版本'].map((x,i)=><div key={x} style={{background:C.panelAlt,border:`1px solid ${C.border}`,borderRadius:10,padding:12}}><b>{i+1}. {x}</b><div style={{fontSize:12,color:C.muted,marginTop:4}}>每日固定檢查，確保前台只讀快取、不即時消耗外部 API。</div></div>)}</div></Card>
  </div>;

  const renderSignals=()=> <div style={{display:'grid',gap:14}}><Card style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div><div style={{fontSize:16,fontWeight:950,color:C.dark}}>信號管理</div><div style={{fontSize:12,color:C.muted,marginTop:4}}>由後台產生分析後寫入 Firestore，前台用戶只讀取快取資料。</div></div><button onClick={runCron} style={{background:C.navy,color:C.white,border:'none',borderRadius:8,padding:'10px 16px',cursor:'pointer',fontWeight:850}}>更新今日分析</button></Card><Card><div style={{display:'grid',gap:8}}>{(signals||[]).slice(0,10).map((x,i)=><div key={x.id||i} style={{display:'flex',justifyContent:'space-between',gap:10,borderBottom:i<Math.min((signals||[]).length,10)-1?`1px solid ${C.border}`:'none',padding:'10px 0'}}><div><div style={{fontSize:13,fontWeight:850,color:C.dark}}>{x.home||x.homeTeam||'主隊'} vs {x.away||x.awayTeam||'客隊'}</div><div style={{fontSize:11,color:C.muted}}>{x.sport||'賽事'} · {x.decision||x.status||'WAIT'} · EV {x.ev ?? '—'}%</div></div><button onClick={()=>setPage('dashboard')} style={{border:`1px solid ${C.border}`,background:C.white,borderRadius:6,padding:'6px 10px',cursor:'pointer',fontSize:11,fontWeight:700,color:C.navy}}>查看</button></div>)}</div></Card></div>;

  const renderSettle=()=> <Card><div style={{fontSize:16,fontWeight:950,color:C.dark,marginBottom:8}}>自動結算與手動覆核</div><div style={{fontSize:13,color:C.muted,lineHeight:1.8,marginBottom:14}}>自動結算依據：比賽狀態為 final/completed、取得最終比分、對照分析當時的市場與推薦方向判斷 win / loss / push / void。手動結算保留給延賽、腰斬、比分 API 不一致或特殊盤口規則。</div><div style={{display:'grid',gap:8}}>{(signals||[]).slice(0,8).map((x,i)=><div key={x.id||i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,background:C.panelAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:10}}><div style={{fontSize:13,fontWeight:800,color:C.dark}}>{x.home||'主隊'} vs {x.away||'客隊'}</div><div style={{display:'flex',gap:6}}><button onClick={async()=>{const mod=await import('../../services/firestore.js');x.id&&await mod.updateAnalysis?.(x.id,{result:'win'});alert('已標記 win');loadStats();}} style={{background:C.win,color:C.white,border:'none',borderRadius:6,padding:'6px 10px',cursor:'pointer',fontSize:11,fontWeight:800}}>WIN</button><button onClick={async()=>{const mod=await import('../../services/firestore.js');x.id&&await mod.updateAnalysis?.(x.id,{result:'loss'});alert('已標記 loss');loadStats();}} style={{background:C.loss,color:C.white,border:'none',borderRadius:6,padding:'6px 10px',cursor:'pointer',fontSize:11,fontWeight:800}}>LOSS</button></div></div>)}</div></Card>;

  const renderUsers=()=> <div><div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><b>用戶列表（{users.length}）</b><button onClick={loadUsers}>重新整理</button></div><Card style={{overflow:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:620}}><thead><tr>{['姓名','Email','角色','邀請碼','加入','操作'].map(h=><th key={h} style={{textAlign:'left',fontSize:11,color:C.muted,padding:10,borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead><tbody>{users.map(u=><tr key={u.id}><td style={{padding:10,fontWeight:800}}>{u.displayName||'—'}</td><td style={{padding:10,fontSize:12,color:C.muted}}>{u.email}</td><td style={{padding:10}}>{editing?.id===u.id?<select value={editing.role} onChange={e=>setEditing({...editing,role:e.target.value})}>{editableRolesFor(u).map(r=><option key={r}>{r}</option>)}</select>:<span style={{fontSize:11,fontWeight:800,padding:'3px 8px',borderRadius:4,background:(RC[u.role]||C.muted)+'20',color:RC[u.role]||C.muted}}>{isOwnerUser(u)?'owner / super_admin':(u.role||'free')}</span>}</td><td style={{padding:10,fontSize:12,color:C.muted}}>{u.createdAt?.toDate?.()?.toLocaleDateString('zh-TW')||'—'}</td><td style={{padding:10,fontSize:11,fontFamily:'monospace',color:'#7C3AED',fontWeight:700}}>{u.invitedByCode||'—'}</td><td style={{padding:10}}>{editing?.id===u.id?<><button onClick={saveUser}>儲存</button><button onClick={()=>setEditing(null)}>取消</button></>:<button disabled={isOwnerUser(u)} onClick={()=>setEditing({...u})}>{isOwnerUser(u)?'已鎖定':'編輯'}</button>}</td></tr>)}</tbody></table></Card></div>;

  const renderPricing=()=> <Card><div style={{fontSize:16,fontWeight:950,marginBottom:14}}>定價方案</div><div style={{display:'grid',gap:12}}>{Object.entries(plans||{}).map(([key,plan])=><div key={key} style={{border:`1px solid ${C.border}`,borderRadius:10,padding:14}}><div style={{fontWeight:900,marginBottom:10}}>{key}</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>{['name','price','usd','period','desc'].map(k=><Field key={k} label={k}><input value={plan[k]??''} type={k==='price'||k==='usd'?'number':'text'} onChange={e=>setPlans(p=>({...p,[key]:{...plan,[k]:k==='price'||k==='usd'?+e.target.value:e.target.value}}))} style={input}/></Field>)}<label style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}><input type="checkbox" checked={!!plan.enabled} onChange={e=>setPlans(p=>({...p,[key]:{...plan,enabled:e.target.checked}}))}/>啟用</label></div></div>)}</div><button onClick={()=>savePatch({plans},'定價方案已儲存')} style={{marginTop:14,background:C.navy,color:C.white,border:'none',borderRadius:8,padding:'10px 18px',fontWeight:850}}>儲存定價</button></Card>;

  const renderInvite=()=><div style={{display:'grid',gap:16}}>
    <Card>
      <div style={{fontSize:16,fontWeight:950,marginBottom:8}}>邀請獎勵設定</div>
      <p style={{fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:14}}>前台不顯示佣金與分潤；用邀請好友解鎖分析，降低品牌與合規風險。</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
        {[['inviterUnlocks','邀請人解鎖場次'],['inviteeUnlocks','被邀請人解鎖場次'],['rewardDays','獎勵有效天數'],['allGamesThreshold','解鎖今日全場門檻'],['passThreshold','短期通行證門檻']].map(([k,l])=>(
          <Field key={k} label={l}><input type="number" value={invite[k]??0} onChange={e=>setInvite(p=>({...p,[k]:+e.target.value}))} style={input}/></Field>
        ))}
        <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}><input type="checkbox" checked={!!invite.enabled} onChange={e=>setInvite(p=>({...p,enabled:e.target.checked}))}/>啟用邀請獎勵</label>
      </div>
      <button onClick={()=>savePatch({inviteRewards:invite},'邀請獎勵已儲存')} style={{marginTop:14,background:C.navy,color:C.white,border:'none',borderRadius:8,padding:'10px 18px',fontWeight:850}}>儲存邀請設定</button>
    </Card>
    <Card>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontSize:16,fontWeight:950,color:C.dark}}>邀請紀錄（{allInvites.length} 筆）</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>查看誰邀請誰、邀請碼與獎勵明細</div>
        </div>
        <button onClick={loadAllInvites} disabled={invitesLoading} style={{border:`1px solid ${C.border}`,background:C.white,borderRadius:6,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:700,color:C.navy}}>
          {invitesLoading?'載入中...':'🔄 載入邀請紀錄'}
        </button>
      </div>
      {allInvites.length===0
        ?<div style={{textAlign:'center',padding:'24px',background:C.panelAlt,borderRadius:10,color:C.muted,fontSize:13}}>點擊「載入邀請紀錄」查看所有邀請關係</div>
        :<div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
            <thead>
              <tr>{['邀請人 UID','被邀請人 Email','邀請碼','邀請人獲得','時間'].map(h=>(
                <th key={h} style={{textAlign:'left',fontSize:11,color:C.muted,padding:'8px 12px',borderBottom:`1px solid ${C.border}`,fontWeight:700}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {allInvites.map((inv,i)=>(
                <tr key={inv.id||i} style={{background:i%2===0?'transparent':C.panelAlt}}>
                  <td style={{padding:'8px 12px',fontSize:11,fontFamily:'monospace',color:C.navy}}>{inv.inviterUid?.slice(0,14)}…</td>
                  <td style={{padding:'8px 12px',fontSize:12,color:C.dark}}>{inv.inviteeEmail||'—'}</td>
                  <td style={{padding:'8px 12px',fontSize:12,fontFamily:'monospace',color:'#7C3AED',fontWeight:700}}>{inv.inviteCode||'—'}</td>
                  <td style={{padding:'8px 12px',fontSize:13,color:C.win,fontWeight:900}}>+{inv.inviterUnlocks||2} 場</td>
                  <td style={{padding:'8px 12px',fontSize:11,color:C.muted}}>{inv.createdAt?.toDate?.()?.toLocaleString('zh-TW')||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </Card>
  </div>;

  const PLACEMENT_LABELS = {
    home_top: '首頁橫幅（Hero 下方）',
    home_feed: '首頁內容流（台彩試算器旁）',
    dashboard_top: '賽事分析頁頂部',
    news_top: '新聞頁頂部',
    sidebar: '側邊欄',
  };

  const renderAds=()=><div style={{display:'grid',gap:16}}>
    <Card>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div>
          <div style={{fontSize:16,fontWeight:950,color:C.dark}}>廣告版位管理</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>設定後儲存，前台即時生效。圖片建議比例 3:1（橫幅）或 1:1（方形）。</div>
        </div>
        <button onClick={()=>setAds(a=>[...a,{...DEFAULT_AD,id:`ad_${Date.now()}`,placement:'home_feed'}])}
          style={{background:C.navy,color:C.white,border:'none',borderRadius:8,padding:'8px 14px',cursor:'pointer',fontSize:12,fontWeight:700}}>
          ＋ 新增版位
        </button>
      </div>

      {ads.map((ad,i)=>(
        <div key={ad.id||i} style={{border:`2px solid ${ad.enabled?C.win:C.border}`,borderRadius:12,padding:18,marginBottom:12,position:'relative'}}>
          {/* 版位標題列 */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>
                <input type="checkbox" checked={!!ad.enabled}
                  onChange={e=>setAds(list=>list.map((x,idx)=>idx===i?{...x,enabled:e.target.checked}:x))}
                  style={{width:16,height:16}}/>
                <span style={{fontSize:13,fontWeight:700,color:ad.enabled?C.win:C.muted}}>
                  {ad.enabled?'● 已啟用':'○ 已停用'}
                </span>
              </label>
            </div>
            <button onClick={()=>setAds(a=>a.filter((_,idx)=>idx!==i))}
              style={{background:'#FEF2F2',color:C.loss,border:'1px solid #FECACA',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:11,fontWeight:700}}>
              刪除
            </button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            {/* 左欄：基本資訊 */}
            <div style={{display:'grid',gap:10}}>
              <Field label="版位位置">
                <select value={ad.placement||'home_top'}
                  onChange={e=>setAds(list=>list.map((x,idx)=>idx===i?{...x,placement:e.target.value}:x))}
                  style={input}>
                  {Object.entries(PLACEMENT_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="廣告類型">
                <select value={ad.type||'banner'}
                  onChange={e=>setAds(list=>list.map((x,idx)=>idx===i?{...x,type:e.target.value}:x))}
                  style={input}>
                  <option value="banner">橫幅廣告</option>
                  <option value="native">原生廣告</option>
                  <option value="sponsor">贊助內容</option>
                </select>
              </Field>
              <Field label="贊助商名稱">
                <input value={ad.sponsorName||''} placeholder="例：世界杯官方合作夥伴"
                  onChange={e=>setAds(list=>list.map((x,idx)=>idx===i?{...x,sponsorName:e.target.value}:x))}
                  style={input}/>
              </Field>
              <Field label="廣告標題">
                <input value={ad.title||''} placeholder="例：2026 世界杯限定優惠"
                  onChange={e=>setAds(list=>list.map((x,idx)=>idx===i?{...x,title:e.target.value}:x))}
                  style={input}/>
              </Field>
              <Field label="廣告說明文字">
                <input value={ad.description||''} placeholder="例：立即訂閱享早鳥優惠"
                  onChange={e=>setAds(list=>list.map((x,idx)=>idx===i?{...x,description:e.target.value}:x))}
                  style={input}/>
              </Field>
              <Field label="點擊連結 URL">
                <input value={ad.linkUrl||''} placeholder="https://..."
                  onChange={e=>setAds(list=>list.map((x,idx)=>idx===i?{...x,linkUrl:e.target.value}:x))}
                  style={input}/>
              </Field>
            </div>

            {/* 右欄：圖片設定 + 預覽 */}
            <div style={{display:'grid',gap:10}}>
              <Field label="圖片 URL">
                <input value={ad.imageUrl||''} placeholder="https://... （建議 600x200px）"
                  onChange={e=>setAds(list=>list.map((x,idx)=>idx===i?{...x,imageUrl:e.target.value}:x))}
                  style={input}/>
              </Field>
              {/* 圖片預覽 */}
              <div style={{background:C.panelAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:8,minHeight:80,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {ad.imageUrl
                  ? <img src={ad.imageUrl} alt="預覽" style={{maxWidth:'100%',maxHeight:120,objectFit:'contain',borderRadius:6}}
                      onError={e=>{e.target.style.display='none';}}/>
                  : <div style={{fontSize:12,color:C.muted,textAlign:'center'}}>圖片預覽<br/>填入 URL 後顯示</div>
                }
              </div>
              {/* 廣告預覽 */}
              <div style={{background:C.panelAlt,border:`1px dashed ${C.border}`,borderRadius:8,padding:10}}>
                <div style={{fontSize:10,color:C.muted,marginBottom:6,fontWeight:700}}>前台預覽效果</div>
                <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 12px',display:'flex',gap:10,alignItems:'center'}}>
                  {ad.imageUrl&&<div style={{width:60,height:36,background:'#eee',borderRadius:4,backgroundImage:`url(${ad.imageUrl})`,backgroundSize:'cover',flexShrink:0}}/>}
                  <div>
                    <div style={{fontSize:9,color:C.amber,fontWeight:900,letterSpacing:1}}>贊助內容</div>
                    <div style={{fontSize:12,fontWeight:700,color:C.dark}}>{ad.title||ad.sponsorName||'廣告標題'}</div>
                    <div style={{fontSize:10,color:C.muted}}>{ad.description||'廣告說明文字'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{fontSize:11,color:C.muted}}>
            版位 ID：<code>{ad.id||`ad_${i}`}</code> · 位置：{PLACEMENT_LABELS[ad.placement]||ad.placement}
          </div>
        </div>
      ))}

      {ads.length===0&&(
        <div style={{textAlign:'center',padding:28,color:C.muted,fontSize:13}}>
          還沒有廣告版位。點「新增版位」開始設定。
        </div>
      )}

      <button onClick={()=>savePatch({ads},'廣告版位已儲存 ✅')}
        style={{background:C.win,color:C.white,border:'none',borderRadius:8,padding:'11px 24px',fontWeight:900,cursor:'pointer',fontSize:13,marginTop:4}}>
        💾 儲存所有廣告設定
      </button>
    </Card>
  </div>;

  const renderContent=()=> <Card><div style={{fontSize:16,fontWeight:950,marginBottom:12}}>內容設定</div><Field label="跑馬燈文字"><input value={content.marqueeText} onChange={e=>setContent(p=>({...p,marqueeText:e.target.value}))} style={input}/></Field><div style={{display:'flex',gap:18,marginTop:12,flexWrap:'wrap'}}><label><input type="checkbox" checked={content.marqueeEnabled} onChange={e=>setContent(p=>({...p,marqueeEnabled:e.target.checked}))}/> 啟用跑馬燈</label><label><input type="checkbox" checked={content.playerSearchEnabled} onChange={e=>setContent(p=>({...p,playerSearchEnabled:e.target.checked}))}/> 啟用選手搜尋入口</label></div><button onClick={()=>savePatch(content,'內容設定已儲存')} style={{marginTop:14,background:C.navy,color:C.white,border:'none',borderRadius:8,padding:'10px 18px',fontWeight:850}}>儲存內容</button></Card>;

  const renderSettings=()=> <Card><div style={{fontSize:16,fontWeight:950,marginBottom:12}}>系統設定</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>{[['guestDailyCards','訪客每日免費場次'],['freeDailyCards','免費會員每日場次'],['registeredBonusCards','註冊獎勵場次']].map(([k,l])=><Field key={k} label={l}><input type="number" value={freeLimits[k]??0} onChange={e=>setFreeLimits(p=>({...p,[k]:+e.target.value}))} style={input}/></Field>)}<Field label="最低資料完整度"><input type="number" step="0.01" value={analysisSettings.minDataCompleteness} onChange={e=>setAnalysisSettings(p=>({...p,minDataCompleteness:+e.target.value}))} style={input}/></Field><Field label="每次自動產生場次"><input type="number" value={analysisSettings.autoGenerateCount} onChange={e=>setAnalysisSettings(p=>({...p,autoGenerateCount:+e.target.value}))} style={input}/></Field></div><div style={{display:'flex',gap:18,marginTop:14,flexWrap:'wrap'}}><label><input type="checkbox" checked={brand.showTaiwanCalculator} onChange={e=>setBrand(p=>({...p,showTaiwanCalculator:e.target.checked}))}/> 顯示台彩試算器</label><label><input type="checkbox" checked={brand.showInviteCta} onChange={e=>setBrand(p=>({...p,showInviteCta:e.target.checked}))}/> 顯示邀請解鎖 CTA</label><label><input type="checkbox" checked={brand.showEngineeringCopy} onChange={e=>setBrand(p=>({...p,showEngineeringCopy:e.target.checked}))}/> 前台顯示工程說明</label></div><button onClick={()=>savePatch({freeLimits,analysisSettings,brandSettings:brand},'系統設定已儲存')} style={{marginTop:14,background:C.navy,color:C.white,border:'none',borderRadius:8,padding:'10px 18px',fontWeight:850}}>儲存系統設定</button></Card>;

  const renderUsage=()=> <div style={{display:'grid',gap:14}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}><Card><div style={{fontSize:26,fontWeight:950,color:C.navy}}>{usageTotals.day}</div><div style={{fontSize:12,color:C.muted}}>今日 API 呼叫</div></Card><Card><div style={{fontSize:26,fontWeight:950,color:C.amber}}>{usageTotals.month}</div><div style={{fontSize:12,color:C.muted}}>本月 API 呼叫</div></Card><Card><div style={{fontSize:26,fontWeight:950,color:usageTotals.errors?C.loss:C.win}}>{usageTotals.errors}</div><div style={{fontSize:12,color:C.muted}}>今日錯誤</div></Card></div><Card><button onClick={loadUsage} style={{marginBottom:12}}>重新整理用量</button><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['日期','來源','動作','次數','錯誤','最後狀態'].map(h=><th key={h} style={{textAlign:'left',fontSize:11,color:C.muted,padding:8,borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead><tbody>{usageDay.map(x=><tr key={x.id}><td style={{padding:8}}>{x.date}</td><td style={{padding:8}}>{x.source}</td><td style={{padding:8}}>{x.action}</td><td style={{padding:8,fontWeight:900}}>{x.count||0}</td><td style={{padding:8,color:x.errorCount?C.loss:C.muted}}>{x.errorCount||0}</td><td style={{padding:8}}>{x.lastStatus||'—'}</td></tr>)}</tbody></table>{usageDay.length===0&&<div style={{padding:18,textAlign:'center',color:C.muted}}>尚無用量紀錄。部署 FIREBASE_SERVICE_ACCOUNT_JSON 後，/api/gateway 會自動記錄。</div>}</Card></div>;

  return <div style={{background:C.bg,minHeight:'100vh'}}><div style={{maxWidth:1120,margin:'0 auto',padding:'24px 16px'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:10}}><div><h2 style={{fontSize:22,fontWeight:950,color:C.dark,margin:0}}>管理後台</h2><div style={{fontSize:12,color:C.muted}}>SIGNALEDGE · {new Date().toLocaleDateString('zh-TW')}</div></div><div style={{display:'flex',gap:8}}><span style={{fontSize:11,fontWeight:800,padding:'5px 12px',borderRadius:20,background:'#ECFDF5',color:C.win,border:'1px solid #A7F3D0'}}>● 系統正常</span><span style={{fontSize:11,fontWeight:800,padding:'5px 12px',borderRadius:20,background:'#FFFBEB',color:C.amber,border:'1px solid #FDE68A'}}>V6A 營運版</span></div></div><div style={{overflowX:'auto',marginBottom:20}}><div style={{display:'flex',gap:4,border:`1px solid ${C.border}`,borderRadius:8,background:C.white,padding:4,width:'max-content'}}>{TABS.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:'7px 12px',border:'none',cursor:'pointer',borderRadius:5,background:tab===k?C.navy:'transparent',color:tab===k?C.white:C.muted,fontSize:12,fontWeight:800,whiteSpace:'nowrap'}}>{l}</button>)}</div></div>{saving&&<div style={{marginBottom:12,color:C.muted}}>儲存中...</div>}{tab==='overview'&&renderOverview()}{tab==='signals'&&renderSignals()}{tab==='settle'&&renderSettle()}{tab==='users'&&renderUsers()}{tab==='pricing'&&renderPricing()}{tab==='invite'&&renderInvite()}{tab==='ads'&&renderAds()}{tab==='content'&&renderContent()}{tab==='settings'&&renderSettings()}{tab==='usage'&&renderUsage()}{tab==='backtest'&&<BacktestPanel/>}{tab==='api'&&<APISettings/>}{tab==='prompt'&&<PromptSettings/>}</div></div>;
}
