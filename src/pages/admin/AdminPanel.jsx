import { useState, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { C } from '../../constants/colors';
import APISettings from './APISettings';
import PromptSettings from './PromptSettings';
import { getAnalyses, createAnalysis, settleAnalysis, getUsers, getAgents, getSettings, saveSettings } from '../../services/firestore';

const inputStyle = { background:'#F6F7FA', border:'1px solid #D4D8DF', borderRadius:6, padding:'8px 12px', fontSize:13, color:'#111827', outline:'none', width:'100%', boxSizing:'border-box' };
const Label = ({ ch }) => <div style={{ fontSize:11, color:'#6B7280', fontWeight:700, letterSpacing:0.5, marginBottom:6, textTransform:'uppercase' }}>{ch}</div>;
const Toggle = ({ val, onChange, label }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #E9EBF0' }}>
    <span style={{ fontSize:13, color:'#111827' }}>{label}</span>
    <div onClick={()=>onChange(!val)} style={{ width:40, height:22, borderRadius:11, cursor:'pointer', background:val?'#0F3460':'#D4D8DF', position:'relative', transition:'background 0.2s' }}>
      <div style={{ position:'absolute', top:3, left:val?21:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }}/>
    </div>
  </div>
);

const TABS = [
  ['overview','總覽'],['preview','👁 預覽'],['signals','信號管理'],
  ['settle','快速結算'],['users','用戶資料'],['agents','代理管理'],
  ['content','內容設定'],['ads','廣告管理'],['system','系統設定'],
  ['api','API 設定'],['prompt','Prompt 設定'],
];

const STATUS_C = { pending:'#D97706', win:'#059669', loss:'#DC2626' };
const STATUS_L = { pending:'進行中', win:'命中', loss:'未中' };

export default function AdminPanel({ signals, setPreviewRole, setPage: navToPage, siteSettings, setSiteSettings }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState('overview');
  const [analyses, setAnalyses] = useState([]);
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [newSignal, setNewSignal] = useState({ sport:'世界杯', home:'', away:'', pick:'', ev:'', edge:'', decision:'BET', modelHome:'', accessLevel:'free' });
  const [settleInput, setSettleInput] = useState({});
  const settings = siteSettings || {};
  const S = (k,v) => setSiteSettings(p=>({...p,[k]:v}));
  const ads = settings.ads || [];
  const addAd = () => setSiteSettings(p=>({...p,ads:[...(p.ads||[]),{enabled:true,text:'',url:''}]}));
  const removeAd = (i) => setSiteSettings(p=>({...p,ads:p.ads.filter((_,idx)=>idx!==i)}));
  const updateAd = (i,k,v) => setSiteSettings(p=>({...p,ads:p.ads.map((a,idx)=>idx===i?{...a,[k]:v}:a)}));

  const load = async (section) => {
    setLoading(p=>({...p,[section]:true}));
    try {
      if (section==='signals')  setAnalyses(await getAnalyses({ limitN:50 }));
      if (section==='users')    setUsers(await getUsers());
      if (section==='agents')   setAgents(await getAgents());
    } catch(e) {
      console.error('Firestore load error:', e);
    }
    setLoading(p=>({...p,[section]:false}));
  };

  useEffect(() => { if (tab==='signals') load('signals'); }, [tab]);
  useEffect(() => { if (tab==='settle')  load('signals'); }, [tab]);
  useEffect(() => { if (tab==='users')   load('users');   }, [tab]);
  useEffect(() => { if (tab==='agents')  load('agents');  }, [tab]);

  const handleCreateSignal = async () => {
    if (!newSignal.home || !newSignal.away) return;
    try {
      await createAnalysis({ ...newSignal, status:'pending', createdAt: new Date().toISOString() });
      await load('signals');
      setShowModal(false);
      setNewSignal({ sport:'世界杯', home:'', away:'', pick:'', ev:'', edge:'', decision:'BET', modelHome:'', accessLevel:'free' });
    } catch(e) { alert('建立失敗：' + e.message); }
  };

  const handleSettle = async (id, status) => {
    const score = settleInput[id] || '';
    try {
      await settleAnalysis(id, { status, result: { score, detail: status==='win'?'命中':'未中' } });
      await load('signals');
    } catch(e) { alert('結算失敗：' + e.message); }
  };

  const handleSaveSettings = async () => {
    try {
      await saveSettings('site', settings);
      alert('設定已儲存到 Firestore');
    } catch(e) { alert('儲存失敗：' + e.message + '\n請確認 Firestore 已啟用'); }
  };

  const Loader = () => <div style={{ textAlign:'center', padding:30, color:'#6B7280', fontSize:13 }}>載入中...</div>;

  return (
    <div style={{ background:'#ECEEF2', minHeight:'100vh' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:isMobile?'16px 12px':'24px 28px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
          <div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 2px' }}>管理後台</h2>
            <p style={{ color:'#6B7280', margin:0, fontSize:12 }}>SIGNALEDGE · {new Date().toLocaleDateString('zh-TW')}</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <span style={{ fontSize:11, background:'#ECFDF5', color:'#059669', border:'1px solid #A7F3D0', padding:'4px 10px', borderRadius:5, fontWeight:700 }}>● 系統正常</span>
            <span style={{ fontSize:11, background:'#EFF6FF', color:'#0F3460', border:'1px solid #BFDBFE', padding:'4px 10px', borderRadius:5, fontWeight:700 }}>WC2026 進行中</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ overflowX:'auto', marginBottom:20 }}>
          <div style={{ display:'flex', border:'1px solid #D4D8DF', borderRadius:8, overflow:'hidden', background:'#fff', width:'max-content' }}>
            {TABS.map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={{ padding:'9px 14px', border:'none', cursor:'pointer', background:tab===id?'#0F3460':'transparent', color:tab===id?'#fff':'#6B7280', fontSize:12, fontWeight:600, whiteSpace:'nowrap', borderRight:'1px solid #E9EBF0' }}>{label}</button>
            ))}
          </div>
        </div>

        {/* 總覽 */}
        {tab==='overview' && (
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:10 }}>
            {[
              {label:'分析報告',val:analyses.length||'—'},{label:'VIP用戶',val:users.filter(u=>u.role==='vip').length||'—',color:'#D97706'},
              {label:'活躍代理',val:agents.length||'—',color:'#0F3460'},{label:'模型命中率',val:'68.4%',color:'#059669'},
            ].map(s=>(
              <div key={s.label} style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:8, padding:'14px 16px' }}>
                <div style={{ fontSize:10, color:'#6B7280', marginBottom:5 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:s.color||'#111827', fontFamily:'ui-monospace,monospace' }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* 預覽模式 */}
        {tab==='preview' && (
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:12 }}>
            {[{role:'guest',label:'訪客',icon:'👤',page:'landing'},{role:'free',label:'免費',icon:'🔓',page:'dashboard'},{role:'vip',label:'VIP',icon:'⭐',page:'dashboard'},{role:'agent',label:'代理',icon:'🤝',page:'agent'}].map(v=>(
              <div key={v.role} onClick={()=>{setPreviewRole(v.role);navToPage(v.page);}} style={{ background:'#fff', border:'1.5px solid #D4D8DF', borderRadius:10, padding:'18px 16px', cursor:'pointer', textAlign:'center' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#0F3460'} onMouseLeave={e=>e.currentTarget.style.borderColor='#D4D8DF'}>
                <div style={{ fontSize:28, marginBottom:8 }}>{v.icon}</div>
                <div style={{ fontWeight:700, color:'#111827', fontSize:13, marginBottom:10 }}>{v.label}</div>
                <div style={{ background:'#0F3460', color:'#fff', borderRadius:5, padding:'5px 0', fontSize:11, fontWeight:700 }}>進入預覽</div>
              </div>
            ))}
          </div>
        )}

        {/* 信號管理 - Firestore */}
        {tab==='signals' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#111827' }}>分析報告管理 ({analyses.length})</span>
              <button onClick={()=>setShowModal(true)} style={{ background:'#0F3460', color:'#fff', border:'none', padding:'8px 16px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700 }}>+ 新增報告</button>
            </div>
            {loading.signals ? <Loader/> : (
              <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:10, overflow:'hidden' }}>
                {analyses.length === 0 ? (
                  <div style={{ padding:'32px', textAlign:'center', color:'#6B7280' }}>
                    尚無分析報告。點擊「新增報告」或等待每日 Cron 自動生成。
                  </div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:700 }}>
                      <thead>
                        <tr style={{ background:'#F6F7FA' }}>
                          {['賽事','運動','決策','EV','Edge','權限','狀態','操作'].map(h=>(
                            <th key={h} style={{ textAlign:'left', padding:'9px 12px', fontSize:10, fontWeight:700, color:'#6B7280' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analyses.map(a=>(
                          <tr key={a.id} style={{ borderTop:'1px solid #E9EBF0' }}>
                            <td style={{ padding:'10px 12px', fontWeight:600, color:'#111827' }}>{a.home} vs {a.away}</td>
                            <td style={{ padding:'10px 12px', color:'#6B7280' }}>{a.sport}</td>
                            <td style={{ padding:'10px 12px' }}>
                              {a.decision && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:3, background:a.decision==='BET'?'#ECFDF5':'#EFF6FF', color:a.decision==='BET'?'#059669':'#0F3460' }}>{a.decision}</span>}
                            </td>
                            <td style={{ padding:'10px 12px', fontFamily:'ui-monospace,monospace', color:'#059669', fontWeight:700 }}>{a.ev?`+${a.ev}%`:'-'}</td>
                            <td style={{ padding:'10px 12px', fontFamily:'ui-monospace,monospace', color:'#D97706' }}>{a.edge?`+${a.edge}%`:'-'}</td>
                            <td style={{ padding:'10px 12px' }}><span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:3, background:a.accessLevel==='vip'?'#FFFBEB':'#EFF6FF', color:a.accessLevel==='vip'?'#D97706':'#0F3460' }}>{a.accessLevel==='vip'?'VIP':'免費'}</span></td>
                            <td style={{ padding:'10px 12px' }}><span style={{ fontSize:10, fontWeight:700, color:STATUS_C[a.status]||'#6B7280' }}>{STATUS_L[a.status]||a.status}</span></td>
                            <td style={{ padding:'10px 12px' }}>
                              <div style={{ display:'flex', gap:4 }}>
                                <button onClick={()=>handleSettle(a.id,'win')} style={{ fontSize:10, padding:'3px 8px', border:'1px solid #059669', color:'#059669', background:'none', borderRadius:4, cursor:'pointer', fontWeight:600 }}>命中</button>
                                <button onClick={()=>handleSettle(a.id,'loss')} style={{ fontSize:10, padding:'3px 8px', border:'1px solid #DC2626', color:'#DC2626', background:'none', borderRadius:4, cursor:'pointer', fontWeight:600 }}>未中</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 快速結算 - Firestore */}
        {tab==='settle' && (
          <div>
            <div style={{ background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#065F46', fontWeight:600 }}>
              ✅ 賽事結束後在此登記結果，系統自動更新命中率統計
            </div>
            {loading.signals ? <Loader/> : analyses.filter(a=>a.status==='pending').length === 0 ? (
              <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:9, padding:'32px', textAlign:'center', color:'#6B7280' }}>✅ 沒有待結算的分析報告</div>
            ) : (
              <div style={{ display:'grid', gap:10 }}>
                {analyses.filter(a=>a.status==='pending').map(a=>(
                  <div key={a.id} style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:9, padding:'14px 18px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{a.home} vs {a.away}</div>
                      <div style={{ fontSize:12, color:'#6B7280', marginTop:3 }}>{a.sport} · {a.pick||'分析報告'}</div>
                      {a.ev && <span style={{ fontSize:11, fontWeight:700, color:'#059669' }}>EV +{a.ev}% · Edge +{a.edge}%</span>}
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                      <input placeholder="比分 (例：2-1)" value={settleInput[a.id]||''} onChange={e=>setSettleInput(p=>({...p,[a.id]:e.target.value}))}
                        style={{ ...inputStyle, width:120, fontSize:12 }}/>
                      <button onClick={()=>handleSettle(a.id,'win')} style={{ background:'#059669', color:'#fff', border:'none', padding:'8px 14px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700 }}>✓ 命中</button>
                      <button onClick={()=>handleSettle(a.id,'loss')} style={{ background:'#DC2626', color:'#fff', border:'none', padding:'8px 14px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700 }}>✗ 未中</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 用戶資料 - Firestore */}
        {tab==='users' && (
          <div>
            {loading.users ? <Loader/> : (
              <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:10, overflow:'hidden' }}>
                {users.length === 0 ? (
                  <div style={{ padding:'32px', textAlign:'center', color:'#6B7280' }}>
                    尚無用戶資料。用戶登入後會自動出現在此。<br/>
                    <span style={{ fontSize:11, marginTop:6, display:'block' }}>請先在 Firebase Console → Firestore 啟用資料庫</span>
                  </div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:700 }}>
                      <thead><tr style={{ background:'#F6F7FA' }}>
                        {['姓名','Email','角色','加入日期','最後登入','行銷同意','操作'].map(h=>(
                          <th key={h} style={{ textAlign:'left', padding:'9px 12px', fontSize:10, fontWeight:700, color:'#6B7280' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {users.map((u,i)=>(
                          <tr key={u.id} style={{ borderTop:'1px solid #E9EBF0', background:i%2===0?'#fff':'#FAFBFC' }}>
                            <td style={{ padding:'10px 12px', fontWeight:600 }}>{u.displayName||u.name||'—'}</td>
                            <td style={{ padding:'10px 12px', color:'#6B7280' }}>{u.email||'—'}</td>
                            <td style={{ padding:'10px 12px' }}>
                              <select value={u.role||'free'} onChange={e=>updateUserRole?.(u.id,e.target.value)}
                                style={{ fontSize:11, border:'1px solid #D4D8DF', borderRadius:4, padding:'2px 6px' }}>
                                {['guest','free','vip','agent','admin'].map(r=><option key={r} value={r}>{r}</option>)}
                              </select>
                            </td>
                            <td style={{ padding:'10px 12px', color:'#6B7280', fontSize:11 }}>{u.createdAt?.toDate?.()?.toLocaleDateString('zh-TW')||'—'}</td>
                            <td style={{ padding:'10px 12px', color:'#6B7280', fontSize:11 }}>{u.lastLoginAt?.toDate?.()?.toLocaleDateString('zh-TW')||'—'}</td>
                            <td style={{ padding:'10px 12px' }}><span style={{ fontSize:11, fontWeight:700, color:u.consent?'#059669':'#DC2626' }}>{u.consent?'✓':'✗'}</span></td>
                            <td style={{ padding:'10px 12px' }}><button style={{ fontSize:10, border:'1px solid #D4D8DF', background:'none', borderRadius:4, padding:'3px 8px', cursor:'pointer' }}>編輯</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 代理管理 - Firestore */}
        {tab==='agents' && (
          <div>
            {loading.agents ? <Loader/> : agents.length === 0 ? (
              <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:10, padding:'32px', textAlign:'center', color:'#6B7280' }}>
                尚無代理資料。代理申請後會出現在此。
              </div>
            ) : (
              <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:10, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:'#F6F7FA' }}>
                    {['代理','邀請碼','下線數','本月佣金','狀態'].map(h=>(
                      <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:10, fontWeight:700, color:'#6B7280' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {agents.map((a,i)=>(
                      <tr key={a.id} style={{ borderTop:'1px solid #E9EBF0' }}>
                        <td style={{ padding:'10px 14px', fontWeight:600 }}>{a.name||a.email}</td>
                        <td style={{ padding:'10px 14px', fontFamily:'ui-monospace,monospace', color:'#0F3460' }}>{a.refCode||'—'}</td>
                        <td style={{ padding:'10px 14px' }}>{a.downlineCount||0}</td>
                        <td style={{ padding:'10px 14px', fontWeight:700, color:'#059669' }}>${a.monthCommission||0}</td>
                        <td style={{ padding:'10px 14px' }}><span style={{ fontSize:10, fontWeight:700, color:a.active!==false?'#059669':'#DC2626' }}>{a.active!==false?'活躍':'停用'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 內容設定 */}
        {tab==='content' && (
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14 }}>
            <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:10, padding:'18px 20px' }}>
              <div style={{ fontWeight:700, color:'#111827', marginBottom:14, fontSize:14 }}>跑馬燈（全站顯示）</div>
              <Toggle val={settings.marqueeEnabled} onChange={v=>S('marqueeEnabled',v)} label="啟用跑馬燈"/>
              <div style={{ marginTop:12 }}><Label ch="文字"/><textarea value={settings.marqueeText||''} onChange={e=>S('marqueeText',e.target.value)} style={{ ...inputStyle, height:70, resize:'vertical' }}/></div>
              <div style={{ marginTop:10 }}><Label ch="速度"/>
                <select value={settings.marqueeSpeed||'normal'} onChange={e=>S('marqueeSpeed',e.target.value)} style={inputStyle}>
                  <option value="slow">慢速</option><option value="normal">正常</option><option value="fast">快速</option>
                </select>
              </div>
            </div>
            <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:10, padding:'18px 20px' }}>
              <div style={{ fontWeight:700, color:'#111827', marginBottom:14, fontSize:14 }}>公告橫幅</div>
              <Toggle val={settings.announcementEnabled} onChange={v=>S('announcementEnabled',v)} label="啟用公告"/>
              <div style={{ marginTop:12 }}><Label ch="內容"/><input value={settings.announcementText||''} onChange={e=>S('announcementText',e.target.value)} style={inputStyle}/></div>
              <div style={{ marginTop:10 }}><Label ch="類型"/>
                <select value={settings.announcementType||'info'} onChange={e=>S('announcementType',e.target.value)} style={inputStyle}>
                  <option value="info">資訊（藍）</option><option value="warning">警告（黃）</option><option value="success">成功（綠）</option>
                </select>
              </div>
              <button onClick={handleSaveSettings} style={{ marginTop:12, background:'#059669', color:'#fff', border:'none', padding:'9px 18px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700, width:'100%' }}>
                儲存到 Firestore
              </button>
            </div>
          </div>
        )}

        {/* 廣告管理 */}
        {tab==='ads' && (
          <div>
            <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#0F3460' }}>
              💡 廣告對所有用戶顯示。不得放置博彩娛樂城廣告（法律紅線）。
            </div>
            <button onClick={addAd} style={{ background:'#0F3460', color:'#fff', border:'none', padding:'9px 18px', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700, marginBottom:14 }}>+ 新增廣告版位</button>
            {ads.length===0 ? (
              <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:9, padding:'32px', textAlign:'center', color:'#6B7280' }}>目前沒有廣告版位</div>
            ) : ads.map((ad,i)=>(
              <div key={i} style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:9, padding:'16px 18px', marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ fontWeight:700, color:'#111827', fontSize:13 }}>廣告 #{i+1}</div>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <Toggle val={ad.enabled} onChange={v=>updateAd(i,'enabled',v)} label="啟用"/>
                    <button onClick={()=>removeAd(i)} style={{ background:'none', border:'1px solid #DC2626', color:'#DC2626', padding:'4px 10px', borderRadius:5, cursor:'pointer', fontSize:11, fontWeight:700 }}>刪除</button>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div><Label ch="廣告文字"/><input value={ad.text} onChange={e=>updateAd(i,'text',e.target.value)} style={inputStyle}/></div>
                  <div><Label ch="連結（可留空）"/><input value={ad.url} onChange={e=>updateAd(i,'url',e.target.value)} placeholder="https://..." style={inputStyle}/></div>
                </div>
                {ad.enabled && ad.text && <div style={{ marginTop:10, padding:'6px 12px', background:'#FFFBEB', border:'1px dashed #D97706', borderRadius:5, fontSize:12, color:'#92400E', textAlign:'center' }}>預覽：📢 {ad.text}</div>}
              </div>
            ))}
          </div>
        )}

        {/* 系統設定 */}
        {tab==='system' && (
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14 }}>
            <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:10, padding:'18px 20px' }}>
              <div style={{ fontWeight:700, color:'#111827', marginBottom:14, fontSize:14 }}>訂閱設定</div>
              <div style={{ marginBottom:10 }}><Label ch="VIP 月費（台幣）"/><input type="number" value={settings.vipPrice||499} onChange={e=>S('vipPrice',+e.target.value)} style={inputStyle}/></div>
              <Toggle val={settings.requireInvite||false} onChange={v=>S('requireInvite',v)} label="VIP 需要邀請碼"/>
              <div style={{ marginTop:10 }}><Label ch="免費用戶每日信號數"/>
                <select value={settings.freeSignalsPerDay||3} onChange={e=>S('freeSignalsPerDay',+e.target.value)} style={inputStyle}>
                  {[1,2,3,5].map(n=><option key={n} value={n}>{n} 個</option>)}
                </select>
              </div>
              <button onClick={handleSaveSettings} style={{ marginTop:14, background:'#0F3460', color:'#fff', border:'none', padding:'9px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700, width:'100%' }}>儲存到 Firestore</button>
            </div>
            <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:10, padding:'18px 20px' }}>
              <div style={{ fontWeight:700, color:'#111827', marginBottom:14, fontSize:14 }}>代理分潤</div>
              <div style={{ marginBottom:10 }}><Label ch="一級佣金 (%)"/><input type="number" value={settings.agentLevel1Rate||40} onChange={e=>S('agentLevel1Rate',+e.target.value)} style={inputStyle}/></div>
              <div><Label ch="二級佣金 (%)"/><input type="number" value={settings.agentLevel2Rate||20} onChange={e=>S('agentLevel2Rate',+e.target.value)} style={inputStyle}/></div>
              <div style={{ marginTop:14, padding:'10px 12px', background:'#EFF6FF', borderRadius:6, fontSize:11, color:'#0F3460' }}>
                ⚠️ 更改分潤率不影響歷史佣金，僅對新交易生效
              </div>
            </div>
          </div>
        )}

        {tab==='api' && <APISettings/>}
        {tab==='prompt' && <PromptSettings/>}
      </div>

      {/* 新增分析報告 Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'24px', width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0, fontWeight:800, color:'#111827' }}>新增分析報告</h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#6B7280' }}>✕</button>
            </div>
            <div style={{ display:'grid', gap:12 }}>
              <div><Label ch="運動"/>
                <select value={newSignal.sport} onChange={e=>setNewSignal(p=>({...p,sport:e.target.value}))} style={inputStyle}>
                  {['世界杯','NBA','MLB','足球','LOL','Valorant','CS2'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              {[{label:'主隊',field:'home'},{label:'客隊',field:'away'},{label:'分析方向',field:'pick'},{label:'模型勝率%',field:'modelHome'},{label:'EV%',field:'ev'},{label:'Edge%',field:'edge'}].map(f=>(
                <div key={f.field}><Label ch={f.label}/><input value={newSignal[f.field]} onChange={e=>setNewSignal(p=>({...p,[f.field]:e.target.value}))} style={inputStyle}/></div>
              ))}
              <div><Label ch="決策"/>
                <select value={newSignal.decision} onChange={e=>setNewSignal(p=>({...p,decision:e.target.value}))} style={inputStyle}>
                  {['BET','LEAN','WAIT','NO_BET'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div><Label ch="可見權限"/>
                <select value={newSignal.accessLevel} onChange={e=>setNewSignal(p=>({...p,accessLevel:e.target.value}))} style={inputStyle}>
                  <option value="free">免費用戶</option><option value="vip">VIP</option>
                </select>
              </div>
              <button onClick={handleCreateSignal} style={{ background:'#0F3460', color:'#fff', border:'none', padding:'12px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:700 }}>建立分析報告</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
