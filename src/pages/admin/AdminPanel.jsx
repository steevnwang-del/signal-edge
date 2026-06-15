import { useState, useEffect } from 'react';
import APISettings from './APISettings';
import PromptSettings from './PromptSettings';
import BacktestPanel from './BacktestPanel';
import { getUsers, updateUser, getAnalyses } from '../../services/firestore';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626',panelAlt:'#F6F7FA'};
const ROLES=['free','vip','agent','admin','super_admin'];
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
    if(!editing)return;setSU(true);
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
                            {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                          </select>
                        ):(
                          <span style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:4,background:(RC[u.role]||C.muted)+'20',color:RC[u.role]||C.muted}}>{u.role||'free'}</span>
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
                          <button onClick={()=>setEditing({...u})} style={{padding:'5px 10px',border:`1px solid ${C.navy}`,borderRadius:5,cursor:'pointer',background:'transparent',color:C.navy,fontSize:11,fontWeight:700}}>編輯</button>
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
        {['signals','settle','agents','content','ads','settings'].includes(tab)&&(
          <div style={{background:C.white,borderRadius:10,padding:'32px',textAlign:'center',border:`1px solid ${C.border}`,color:C.muted}}>
            <div style={{fontSize:32,marginBottom:12}}>🔧</div>
            <div style={{fontSize:14,fontWeight:700,color:C.dark,marginBottom:8}}>{TABS.find(t=>t[0]===tab)?.[1]}</div>
            <div style={{fontSize:12}}>串接 Firestore 後完整啟用</div>
          </div>
        )}
      </div>
    </div>
  );
}
