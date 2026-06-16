import { useState, useEffect } from 'react';
import APISettings from './APISettings';
import PromptSettings from './PromptSettings';
import BacktestPanel from './BacktestPanel';
import { getUsers, updateUser, getAnalyses } from '../../services/firestore';
import { OWNER_EMAIL } from '../../config/owner';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626',panelAlt:'#F6F7FA'};
const ROLES=['free','vip','agent','admin','super_admin'];
const editableRolesFor = (u) => (String(u?.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase()) ? ['super_admin'] : ROLES.filter(r => r !== 'super_admin');
const isOwnerUser = (u) => String(u?.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase() || u?.isOwner === true;
const RC={free:C.muted,vip:C.amber,agent:'#7C3AED',admin:C.win,super_admin:C.loss};
const TABS=[['overview','總覽'],['preview','👁 預覽'],['signals','信號管理'],['settle','快速結算'],['users','用戶資料'],['pricing','💰 定價'],['backtest','📈 回測'],['agents','代理管理'],['content','內容設定'],['ads','廣告管理'],['settings','系統設定'],['api','API 設定'],['prompt','Prompt 設定']];

export default function AdminPanel({signals,setPreviewRole,setPage,siteSettings,setSiteSettings}){
  const [tab,setTab]=useState('overview');
  const [users,setUsers]=useState([]);
  const [loadingU,setLU]=useState(false);
  const [editing,setEditing]=useState(null);
  const [savingU,setSU]=useState(false);
  const [stats,setStats]=useState({users:0,vip:0,analyses:0,hitRate:0});
  const [plans,setPlans]=useState(siteSettings?.plans||{
    monthly:{name:'月費方案',price:299,usd:9,period:'/ 月',desc:'每月自動續費，隨時取消',enabled:true},
    quarterly:{name:'季費方案',price:799,usd:24,period:'/ 季',desc:'較月費省10%，一次付清',enabled:true},
    worldcup:{name:'世界杯全程通',price:399,usd:12,period:'/ 全程',desc:'一次付清，全程VIP分析',enabled:true},
  });
  const [savingP,setSP]=useState(false);

  useEffect(()=>{loadStats();},[]);
  useEffect(()=>{if(tab==='users')loadUsers();},[tab]);

  const loadStats=async()=>{
    try{const[us,an]=await Promise.all([getUsers({limitN:200}),getAnalyses({limitN:200})]);const settled=an.filter(a=>a.result==='win'||a.result==='loss');const wins=settled.filter(a=>a.result==='win').length;setStats({users:us.length,vip:us.filter(u=>u.role==='vip').length,analyses:an.length,hitRate:settled.length?+(wins/settled.length*100).toFixed(1):0});}catch{}
  };

  const loadUsers=async()=>{setLU(true);try{setUsers(await getUsers({limitN:100}));}catch{}setLU(false);};

  const saveUser=async()=>{
    if(!editing)return;
    if(isOwnerUser(editing)){alert('Owner 帳號不可在前端被修改。');return;}
    if(editing.role==='super_admin'){alert('不能從前端建立或修改 super_admin。Owner 已固定為 '+OWNER_EMAIL);return;}
    setSU(true);
    const ok=await updateUser(editing.id,{role:editing.role,note:editing.note||''});
    if(ok){setUsers(p=>p.map(u=>u.id===editing.id?{...u,...editing}:u));setEditing(null);}
    else alert('更新失敗，請確認 Firestore 規則');
    setSU(false);
  };

  const savePlans=async()=>{
    setSP(true);setSiteSettings(p=>({...p,plans}));
    try{const mod=await import('../../services/firestore.js');await mod.saveSettings?.({plans});}catch{}
    setSP(false);alert('✅ 定價已儲存');
  };


  const runCron = async () => {
    try {
      const r = await fetch('/api/cron/generate-analysis', { method:'POST', headers:{'Content-Type':'application/json','x-admin-trigger':'1'} });
      const d = await r.json().catch(()=>({}));
      if (!r.ok || d.success===false) throw new Error(d.error || `HTTP ${r.status}`);
      alert(`✅ 已更新 ${d.generated || 0} 筆分析`);
      loadStats();
    } catch(e) { alert('更新失敗：' + e.message); }
  };

  const saveSite = async (patch) => {
    const next = { ...(siteSettings || {}), ...patch };
    setSiteSettings(next);
    try { const mod = await import('../../services/firestore.js'); await mod.saveSettings?.(patch); } catch {}
  };

  const renderSignals = () => (
    <div style={{display:'grid',gap:14}}>
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:18,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <div><div style={{fontSize:15,fontWeight:900,color:C.dark}}>信號管理</div><div style={{fontSize:12,color:C.muted,marginTop:4}}>管理首頁與賽事分析頁顯示的分析卡。正式資料由 cron / Admin 更新產生。</div></div>
        <button onClick={runCron} style={{background:C.navy,color:C.white,border:'none',borderRadius:8,padding:'10px 16px',cursor:'pointer',fontWeight:800}}>更新今日分析</button>
      </div>
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
        {(signals||[]).slice(0,10).map((x,i)=><div key={x.id||i} style={{padding:'12px 16px',borderBottom:i<Math.min((signals||[]).length,10)-1?`1px solid ${C.border}`:'none',display:'flex',justifyContent:'space-between',gap:10,alignItems:'center'}}><div><div style={{fontSize:13,fontWeight:800,color:C.dark}}>{x.home||x.homeTeam||'主隊'} vs {x.away||x.awayTeam||'客隊'}</div><div style={{fontSize:11,color:C.muted}}>{x.sport||'賽事'} · {x.decision||x.status||'WAIT'} · EV {x.ev ?? '—'}%</div></div><button onClick={()=>setPage('dashboard')} style={{border:`1px solid ${C.border}`,background:C.white,borderRadius:6,padding:'6px 10px',cursor:'pointer',fontSize:11,fontWeight:700,color:C.navy}}>查看</button></div>)}
        {(!signals||signals.length===0)&&<div style={{padding:30,textAlign:'center',color:C.muted,fontSize:13}}>目前沒有前端信號資料，請先執行「更新今日分析」。</div>}
      </div>
    </div>
  );

  const renderSettle = () => (
    <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:18}}>
      <div style={{fontSize:15,fontWeight:900,color:C.dark,marginBottom:6}}>快速結算</div>
      <div style={{fontSize:12,color:C.muted,marginBottom:14}}>賽後可將分析標記為 win / loss，供回測頁統計。正式上線後建議改為後端驗證。</div>
      <div style={{display:'grid',gap:8}}>{(signals||[]).slice(0,8).map((x,i)=><div key={x.id||i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,background:C.panelAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:10}}><div style={{fontSize:13,fontWeight:800,color:C.dark}}>{x.home||'主隊'} vs {x.away||'客隊'}</div><div style={{display:'flex',gap:6}}><button onClick={async()=>{try{const mod=await import('../../services/firestore.js');x.id?await mod.updateAnalysis?.(x.id,{result:'win'}):null;alert('已標記 win');loadStats();}catch(e){alert(e.message)}}} style={{background:C.win,color:C.white,border:'none',borderRadius:6,padding:'6px 10px',cursor:'pointer',fontSize:11,fontWeight:800}}>WIN</button><button onClick={async()=>{try{const mod=await import('../../services/firestore.js');x.id?await mod.updateAnalysis?.(x.id,{result:'loss'}):null;alert('已標記 loss');loadStats();}catch(e){alert(e.message)}}} style={{background:C.loss,color:C.white,border:'none',borderRadius:6,padding:'6px 10px',cursor:'pointer',fontSize:11,fontWeight:800}}>LOSS</button></div></div>)}</div>
    </div>
  );

  const renderAgents = () => (
    <div style={{display:'grid',gap:14}}>
      <div style={{background:'linear-gradient(135deg,#FFF7E6,#FFFFFF)',border:'1px solid #F5D38A',borderRadius:12,padding:20}}>
        <div style={{fontSize:18,fontWeight:950,color:C.dark,marginBottom:6}}>全民代理計畫</div>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.8,maxWidth:760}}>每個註冊會員都可產生推廣連結；主要代理可經營社群、內容頁、活動碼與線下合作。世界盃期間用低門檻報告包吸流量，後續導向 Pro 訂閱與 B2B 看板。</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginTop:14}}>{[{l:'直屬訂閱佣金',v:'40%'},{l:'二級推薦佣金',v:'20%'},{l:'代理申請門檻',v:'免費加入'},{l:'主要代理',v:'人工審核'}].map(x=><div key={x.l} style={{background:C.white,border:'1px solid #F5D38A',borderRadius:10,padding:14,textAlign:'center'}}><div style={{fontSize:24,fontWeight:950,color:C.amber}}>{x.v}</div><div style={{fontSize:11,color:C.muted}}>{x.l}</div></div>)}</div>
        <button onClick={()=>setPage('agent')} style={{marginTop:14,background:C.navy,color:C.white,border:'none',borderRadius:8,padding:'10px 16px',cursor:'pointer',fontWeight:800}}>打開代理前台頁</button>
      </div>
    </div>
  );

  const renderContent = () => (
    <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:18}}>
      <div style={{fontSize:15,fontWeight:900,color:C.dark,marginBottom:14}}>內容設定</div>
      <label style={{display:'block',fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>跑馬燈文字</label>
      <input value={siteSettings?.marqueeText||''} onChange={e=>setSiteSettings(p=>({...p,marqueeText:e.target.value}))} style={{width:'100%',boxSizing:'border-box',padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:8,marginBottom:12}}/>
      <label style={{display:'flex',gap:8,alignItems:'center',fontSize:13,color:C.dark,marginBottom:12}}><input type="checkbox" checked={siteSettings?.marqueeEnabled!==false} onChange={e=>setSiteSettings(p=>({...p,marqueeEnabled:e.target.checked}))}/> 啟用跑馬燈</label>
      <label style={{display:'flex',gap:8,alignItems:'center',fontSize:13,color:C.dark,marginBottom:16}}><input type="checkbox" checked={!!siteSettings?.playerSearchEnabled} onChange={e=>setSiteSettings(p=>({...p,playerSearchEnabled:e.target.checked}))}/> 啟用選手搜尋入口</label>
      <button onClick={()=>saveSite({marqueeText:siteSettings?.marqueeText,marqueeEnabled:siteSettings?.marqueeEnabled,playerSearchEnabled:siteSettings?.playerSearchEnabled})} style={{background:C.navy,color:C.white,border:'none',borderRadius:8,padding:'10px 18px',cursor:'pointer',fontWeight:800}}>儲存內容設定</button>
    </div>
  );

  const renderAds = () => (
    <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:18}}>
      <div style={{fontSize:15,fontWeight:900,color:C.dark,marginBottom:6}}>廣告管理</div><div style={{fontSize:12,color:C.muted,marginBottom:14}}>先保留廣告欄位，正式接入時可放 Google AdSense、品牌贊助或世界盃活動橫幅。</div>
      <textarea value={(siteSettings?.ads||[]).map(a=>a.title||a).join('\n')} onChange={e=>setSiteSettings(p=>({...p,ads:e.target.value.split('\n').filter(Boolean).map(title=>({title,enabled:true}))}))} placeholder={'例如：世界盃專題贊助橫幅\n例如：運動酒吧合作活動'} style={{width:'100%',minHeight:110,boxSizing:'border-box',padding:12,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:12}}/>
      <button onClick={()=>saveSite({ads:siteSettings?.ads||[]})} style={{background:C.navy,color:C.white,border:'none',borderRadius:8,padding:'10px 18px',cursor:'pointer',fontWeight:800}}>儲存廣告設定</button>
    </div>
  );

  const renderSettings = () => (
    <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:18}}>
      <div style={{fontSize:15,fontWeight:900,color:C.dark,marginBottom:10}}>系統設定</div>
      <div style={{display:'grid',gap:10,fontSize:13,color:C.dark}}>
        <div style={{background:C.panelAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:12}}>新聞快取：建議 Vercel Cron 每 4 小時執行 <code>/api/cron/refresh-news</code></div>
        <div style={{background:C.panelAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:12}}>分析更新：建議每日固定執行 <code>/api/cron/generate-analysis</code></div>
        <div style={{background:C.panelAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:12}}>後台 Prompt：cron 產生分析會讀取 Firestore <code>settings/site.promptTemplates</code>；手動卡片分析走固定 DATA_BLOCK。</div>
      </div>
    </div>
  );

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:10}}>
          <div><h2 style={{fontSize:22,fontWeight:900,color:C.dark,margin:0}}>管理後台</h2><div style={{fontSize:12,color:C.muted}}>SIGNALEDGE · {new Date().toLocaleDateString('zh-TW')}</div></div>
          <div style={{display:'flex',gap:8}}><span style={{fontSize:11,fontWeight:700,padding:'5px 12px',borderRadius:20,background:'#ECFDF5',color:C.win,border:'1px solid #A7F3D0'}}>● 系統正常</span><span style={{fontSize:11,fontWeight:700,padding:'5px 12px',borderRadius:20,background:'#FFFBEB',color:C.amber,border:'1px solid #FDE68A'}}>WC2026 進行中</span></div>
        </div>
        <div style={{overflowX:'auto',marginBottom:20}}><div style={{display:'flex',gap:4,border:`1px solid ${C.border}`,borderRadius:8,background:C.white,padding:4,width:'max-content'}}>{TABS.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:'7px 12px',border:'none',cursor:'pointer',borderRadius:5,background:tab===k?C.navy:'transparent',color:tab===k?C.white:C.muted,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>{l}</button>)}</div></div>

        {tab==='overview'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20}}>
              {[{l:'總用戶',v:stats.users,c:C.navy},{l:'VIP用戶',v:stats.vip,c:C.amber},{l:'分析總數',v:stats.analyses,c:C.win},{l:'BET命中率',v:stats.hitRate+'%',c:stats.hitRate>55?C.win:C.muted}].map(s=>(
                <div key={s.l} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px',textAlign:'center'}}><div style={{fontSize:28,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:12,color:C.muted,marginTop:4}}>{s.l}</div></div>
              ))}
            </div>
            <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:8,padding:'12px 16px',fontSize:12,color:'#1E40AF'}}>📋 快速指引：<strong>API設定</strong> → 測試連線 → <strong>信號管理</strong> → 生成分析 → <strong>📈 回測</strong> → 標記結果 → 查看命中率</div>
          </div>
        )}

        {tab==='preview'&&(
          <div style={{background:C.white,borderRadius:10,padding:'20px',border:`1px solid ${C.border}`}}>
            <div style={{fontSize:14,fontWeight:700,color:C.dark,marginBottom:16}}>模擬不同用戶視角</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
              {[['guest','訪客','#6B7280'],['free','免費用戶','#6B7280'],['vip','VIP用戶','#D97706'],['agent','代理','#7C3AED'],['admin','管理員','#059669']].map(([r,l,c])=>(
                <button key={r} onClick={()=>{setPreviewRole(r);setPage('dashboard');}} style={{background:c+'12',border:`2px solid ${c}`,borderRadius:8,padding:'16px',cursor:'pointer',textAlign:'center'}}>
                  <div style={{fontSize:16,fontWeight:900,color:c}}>{l}</div><div style={{fontSize:10,color:C.muted,marginTop:4}}>點擊進入預覽</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab==='users'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
              <div style={{fontSize:14,fontWeight:700,color:C.dark}}>用戶列表（{users.length} 人）</div>
              <button onClick={loadUsers} style={{padding:'6px 12px',border:`1px solid ${C.border}`,borderRadius:6,cursor:'pointer',fontSize:11,background:'transparent',color:C.muted}}>🔄 重新整理</button>
            </div>
            {loadingU&&<div style={{textAlign:'center',padding:32,color:C.muted}}>載入中...</div>}
            <div style={{background:C.white,borderRadius:10,border:`1px solid ${C.border}`,overflow:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
                <thead><tr style={{background:C.panelAlt,borderBottom:`1px solid ${C.border}`}}>{['姓名','Email','角色','加入','最後登入','行銷','操作'].map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:C.muted,whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
                <tbody>
                  {users.map((u,i)=>(
                    <tr key={u.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.white:C.panelAlt}}>
                      <td style={{padding:'10px 12px',fontSize:13,fontWeight:700,color:C.dark,whiteSpace:'nowrap'}}>{u.displayName||'—'}</td>
                      <td style={{padding:'10px 12px',fontSize:11,color:C.muted}}>{u.email||'—'}</td>
                      <td style={{padding:'10px 12px'}}>
                        {editing?.id===u.id?(
                          <select value={editing.role} onChange={e=>setEditing({...editing,role:e.target.value})} style={{padding:'4px 8px',border:`1px solid ${C.border}`,borderRadius:5,fontSize:12,cursor:'pointer'}}>
                            {editableRolesFor(u).map(r=><option key={r} value={r}>{r}</option>)}
                          </select>
                        ):(
                          <span style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:4,background:(RC[u.role]||C.muted)+'20',color:RC[u.role]||C.muted}}>{isOwnerUser(u)?'owner / super_admin':(u.role||'free')}</span>
                        )}
                      </td>
                      <td style={{padding:'10px 12px',fontSize:11,color:C.muted,whiteSpace:'nowrap'}}>{u.createdAt?.toDate?.()?.toLocaleDateString('zh-TW')||'—'}</td>
                      <td style={{padding:'10px 12px',fontSize:11,color:C.muted,whiteSpace:'nowrap'}}>{u.lastLoginAt?.toDate?.()?.toLocaleDateString('zh-TW')||'—'}</td>
                      <td style={{padding:'10px 12px',textAlign:'center'}}>{u.consent?'✅':'❌'}</td>
                      <td style={{padding:'10px 12px'}}>
                        {editing?.id===u.id?(
                          <div style={{display:'flex',gap:6}}>
                            <button onClick={saveUser} disabled={savingU} style={{padding:'5px 10px',border:'none',borderRadius:5,cursor:'pointer',background:C.win,color:C.white,fontSize:11,fontWeight:700}}>{savingU?'儲存...':'✅ 存'}</button>
                            <button onClick={()=>setEditing(null)} style={{padding:'5px 8px',border:`1px solid ${C.border}`,borderRadius:5,cursor:'pointer',background:'transparent',color:C.muted,fontSize:11}}>✕</button>
                          </div>
                        ):(
                          <button onClick={()=>isOwnerUser(u)?alert('Owner 帳號不可被修改。'):setEditing({...u})} disabled={isOwnerUser(u)} style={{padding:'5px 10px',border:`1px solid ${isOwnerUser(u)?C.border:C.navy}`,borderRadius:5,cursor:isOwnerUser(u)?'not-allowed':'pointer',background:'transparent',color:isOwnerUser(u)?C.muted:C.navy,fontSize:11,fontWeight:700}}>{isOwnerUser(u)?'已鎖定':'編輯'}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loadingU&&users.length===0&&<div style={{textAlign:'center',padding:32,color:C.muted}}>暫無用戶，登入後才會出現</div>}
            </div>
          </div>
        )}

        {tab==='pricing'&&(
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.dark,marginBottom:16}}>定價方案管理</div>
            <div style={{display:'grid',gap:14,marginBottom:20}}>
              {Object.entries(plans).map(([key,plan])=>(
                <div key={key} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:'18px 20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
                    <div style={{fontSize:14,fontWeight:800,color:C.dark}}>{plan.name} <span style={{fontSize:11,color:C.muted}}>({key})</span></div>
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:C.muted}}>
                      <input type="checkbox" checked={plan.enabled} onChange={e=>setPlans(p=>({...p,[key]:{...plan,enabled:e.target.checked}}))}/> 啟用
                    </label>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
                    {[['name','方案名稱'],['price','台幣價格 NT$'],['usd','美金價格 USD$'],['period','週期說明（如 / 月）'],['desc','方案描述']].map(([k,l])=>(
                      <div key={k}><div style={{fontSize:11,color:C.muted,marginBottom:4,fontWeight:600}}>{l}</div>
                        <input type={k==='price'||k==='usd'?'number':'text'} value={plan[k]} onChange={e=>setPlans(p=>({...p,[key]:{...plan,[k]:k==='price'||k==='usd'?+e.target.value:e.target.value}}))}
                          style={{width:'100%',padding:'8px 10px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,boxSizing:'border-box'}}/></div>
                    ))}
                  </div>
                  <div style={{marginTop:12,padding:'8px 12px',background:C.panelAlt,borderRadius:6,fontSize:12,color:C.muted}}>
                    預覽：<strong>{plan.name}</strong> NT${plan.price} {plan.period} — {plan.desc}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={savePlans} disabled={savingP} style={{background:savingP?C.muted:C.navy,color:C.white,border:'none',padding:'12px 32px',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:700}}>{savingP?'儲存中...':'💾 儲存定價方案'}</button>
            <div style={{marginTop:10,fontSize:11,color:C.muted}}>儲存後立即同步到付款頁面</div>
          </div>
        )}

        {tab==='backtest'&&<BacktestPanel/>}
        {tab==='api'&&<APISettings/>}
        {tab==='prompt'&&<PromptSettings/>}
        {tab==='signals'&&renderSignals()}
        {tab==='settle'&&renderSettle()}
        {tab==='agents'&&renderAgents()}
        {tab==='content'&&renderContent()}
        {tab==='ads'&&renderAds()}
        {tab==='settings'&&renderSettings()}
      </div>
    </div>
  );
}
