import { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SportBadge } from '../../components/SportBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { StrengthDots } from '../../components/StrengthDots';
import { MOCK_USERS } from '../../constants/mockData';
import { C } from '../../constants/colors';
import APISettings from './APISettings';
import PromptSettings from './PromptSettings';

const inputStyle = { background:'#F6F7FA', border:'1px solid #D4D8DF', borderRadius:6, padding:'8px 12px', fontSize:13, color:'#111827', outline:'none', width:'100%', boxSizing:'border-box' };
const Label = ({ children }) => <div style={{ fontSize:11, color:'#6B7280', fontWeight:700, letterSpacing:0.5, marginBottom:6, textTransform:'uppercase' }}>{children}</div>;
const Toggle = ({ val, onChange, label }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #E9EBF0' }}>
    <span style={{ fontSize:13, color:'#111827' }}>{label}</span>
    <div onClick={()=>onChange(!val)} style={{ width:40, height:22, borderRadius:11, cursor:'pointer', background:val?'#0F3460':'#D4D8DF', position:'relative', transition:'background 0.2s' }}>
      <div style={{ position:'absolute', top:3, left:val?21:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }}/>
    </div>
  </div>
);

const TABS = [
  ['overview','總覽'],['preview','👁 預覽模式'],['signals','信號管理'],
  ['settle','快速結算'],['users','用戶資料'],['agents','代理管理'],
  ['content','內容設定'],['ads','廣告管理'],['system','系統設定'],
  ['api','API 設定'],['prompt','Prompt 設定'],
];

export default function AdminPanel({ signals, setPreviewRole, setPage: navToPage, siteSettings, setSiteSettings }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [newSignal, setNewSignal] = useState({ sport:'世界杯', home:'', away:'', pick:'', odds:'', mode:'stable', strength:3, accessLevel:'free' });

  // 從 App.jsx 傳入的全站設定
  const settings = siteSettings || {};
  const S = (k, v) => setSiteSettings(p => ({ ...p, [k]: v }));

  // 廣告管理
  const ads = settings.ads || [];
  const addAd = () => setSiteSettings(p => ({ ...p, ads: [...(p.ads||[]), { enabled:true, text:'', url:'' }] }));
  const removeAd = (i) => setSiteSettings(p => ({ ...p, ads: p.ads.filter((_,idx)=>idx!==i) }));
  const updateAd = (i, k, v) => setSiteSettings(p => ({ ...p, ads: p.ads.map((a,idx)=>idx===i?{...a,[k]:v}:a) }));

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

        {/* Tab Nav */}
        <div style={{ overflowX:'auto', marginBottom:20 }}>
          <div style={{ display:'flex', border:'1px solid #D4D8DF', borderRadius:8, overflow:'hidden', background:'#fff', width:'max-content' }}>
            {TABS.map(([id,label]) => (
              <button key={id} onClick={()=>setTab(id)} style={{ padding:'9px 14px', border:'none', cursor:'pointer', background:tab===id?'#0F3460':'transparent', color:tab===id?'#fff':'#6B7280', fontSize:12, fontWeight:600, whiteSpace:'nowrap', borderRight:'1px solid #E9EBF0' }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Overview */}
        {tab==='overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(6,1fr)', gap:10, marginBottom:20 }}>
              {[
                {label:'總用戶',val:'1,284'},{label:'VIP用戶',val:'312',color:'#D97706'},
                {label:'活躍代理',val:'47',color:'#0F3460'},{label:'今日信號',val:signals?.length||0},
                {label:'整體勝率',val:'68.4%',color:'#059669'},{label:'已同意行銷',val:`${MOCK_USERS.filter(u=>u.consent).length}/${MOCK_USERS.length}`,color:'#0F3460'},
              ].map(s=>(
                <div key={s.label} style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:8, padding:'12px 14px' }}>
                  <div style={{ fontSize:10, color:'#6B7280', letterSpacing:0.5, marginBottom:5 }}>{s.label}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:s.color||'#111827', fontFamily:'ui-monospace,monospace' }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {tab==='preview' && (
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:12 }}>
            {[
              {role:'guest',label:'訪客視角',icon:'👤',page:'landing'},
              {role:'free',label:'免費用戶',icon:'🔓',page:'dashboard'},
              {role:'vip',label:'VIP用戶',icon:'⭐',page:'dashboard'},
              {role:'agent',label:'代理視角',icon:'🤝',page:'agent'},
            ].map(v=>(
              <div key={v.role} onClick={()=>{setPreviewRole(v.role);navToPage(v.page);}}
                style={{ background:'#fff', border:'1.5px solid #D4D8DF', borderRadius:10, padding:'18px 16px', cursor:'pointer', textAlign:'center' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#0F3460';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#D4D8DF';}}>
                <div style={{ fontSize:28, marginBottom:8 }}>{v.icon}</div>
                <div style={{ fontWeight:700, color:'#111827', fontSize:13, marginBottom:10 }}>{v.label}</div>
                <div style={{ background:'#0F3460', color:'#fff', borderRadius:5, padding:'5px 0', fontSize:11, fontWeight:700 }}>進入預覽</div>
              </div>
            ))}
          </div>
        )}

        {/* Content Settings */}
        {tab==='content' && (
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14 }}>
            <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:10, padding:'18px 20px' }}>
              <div style={{ fontWeight:700, color:'#111827', marginBottom:14, fontSize:14 }}>跑馬燈設定（全站顯示）</div>
              <Toggle val={settings.marqueeEnabled} onChange={v=>S('marqueeEnabled',v)} label="啟用跑馬燈"/>
              <div style={{ marginTop:12 }}><Label>跑馬燈文字</Label><textarea value={settings.marqueeText||''} onChange={e=>S('marqueeText',e.target.value)} style={{ ...inputStyle, height:80, resize:'vertical' }}/></div>
              <div style={{ marginTop:10 }}><Label>滾動速度</Label>
                <select value={settings.marqueeSpeed||'normal'} onChange={e=>S('marqueeSpeed',e.target.value)} style={inputStyle}>
                  <option value="slow">慢速</option><option value="normal">正常</option><option value="fast">快速</option>
                </select>
              </div>
              <div style={{ marginTop:8, fontSize:11, color:'#6B7280', background:'#EFF6FF', borderRadius:5, padding:'6px 10px' }}>ⓘ 跑馬燈對所有用戶顯示（訪客/免費/VIP/代理）</div>
            </div>
            <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:10, padding:'18px 20px' }}>
              <div style={{ fontWeight:700, color:'#111827', marginBottom:14, fontSize:14 }}>公告橫幅（全站顯示）</div>
              <Toggle val={settings.announcementEnabled} onChange={v=>S('announcementEnabled',v)} label="啟用公告橫幅"/>
              <div style={{ marginTop:12 }}><Label>公告內容</Label><input value={settings.announcementText||''} onChange={e=>S('announcementText',e.target.value)} style={inputStyle}/></div>
              <div style={{ marginTop:10 }}><Label>類型</Label>
                <select value={settings.announcementType||'info'} onChange={e=>S('announcementType',e.target.value)} style={inputStyle}>
                  <option value="info">資訊（藍色）</option><option value="warning">警告（黃色）</option><option value="success">成功（綠色）</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Ads Management - unlimited */}
        {tab==='ads' && (
          <div>
            <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#0F3460' }}>
              💡 廣告橫幅對所有用戶顯示。僅接受合法廣告，不接受任何博彩娛樂城廣告（法律紅線）。
            </div>
            <button onClick={addAd} style={{ background:'#0F3460', color:'#fff', border:'none', padding:'9px 18px', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700, marginBottom:14 }}>
              + 新增廣告版位
            </button>
            {ads.length === 0 && (
              <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:9, padding:'32px', textAlign:'center', color:'#6B7280' }}>
                目前沒有廣告版位，點上方按鈕新增
              </div>
            )}
            {ads.map((ad, i) => (
              <div key={i} style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:9, padding:'16px 18px', marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div style={{ fontWeight:700, color:'#111827', fontSize:13 }}>廣告版位 #{i+1}</div>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <Toggle val={ad.enabled} onChange={v=>updateAd(i,'enabled',v)} label="啟用"/>
                    <button onClick={()=>removeAd(i)} style={{ background:'transparent', border:'1px solid #DC2626', color:'#DC2626', padding:'4px 10px', borderRadius:5, cursor:'pointer', fontSize:11, fontWeight:700 }}>刪除</button>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div><Label>廣告文字</Label><input value={ad.text} onChange={e=>updateAd(i,'text',e.target.value)} placeholder="例：XX數據分析工具 — 免費使用" style={inputStyle}/></div>
                  <div><Label>點擊連結（可留空）</Label><input value={ad.url} onChange={e=>updateAd(i,'url',e.target.value)} placeholder="https://..." style={inputStyle}/></div>
                </div>
                {ad.enabled && ad.text && (
                  <div style={{ marginTop:10, padding:'8px 14px', background:'#FFFBEB', border:'1px dashed #D97706', borderRadius:5, fontSize:12, color:'#92400E', textAlign:'center' }}>
                    預覽：📢 {ad.text}{ad.url&&' — 了解更多 →'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab==='users' && (
          <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:10, overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:900 }}>
                <thead>
                  <tr style={{ background:'#F6F7FA' }}>
                    {['姓名','Email','電話','LINE ID','角色','加入日期','偏好','行銷同意','來源'].map(h=>(
                      <th key={h} style={{ textAlign:'left', padding:'9px 12px', fontSize:10, fontWeight:700, color:'#6B7280', letterSpacing:0.5, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_USERS.map((u,i)=>(
                    <tr key={u.id} style={{ borderTop:'1px solid #E9EBF0', background:i%2===0?'#fff':'#FAFBFC' }}>
                      <td style={{ padding:'10px 12px', fontWeight:600, color:'#111827' }}>{u.name}</td>
                      <td style={{ padding:'10px 12px', color:'#6B7280' }}>{u.email}</td>
                      <td style={{ padding:'10px 12px', color:'#111827', fontFamily:'ui-monospace,monospace', fontSize:11 }}>{u.phone}</td>
                      <td style={{ padding:'10px 12px', color:'#0F3460', fontFamily:'ui-monospace,monospace', fontSize:11 }}>{u.line}</td>
                      <td style={{ padding:'10px 12px' }}><span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:3, background:u.role==='vip'?'#FFFBEB':u.role==='agent'?'#EFF6FF':'#F6F7FA', color:u.role==='vip'?'#D97706':u.role==='agent'?'#0F3460':'#6B7280' }}>{u.role.toUpperCase()}</span></td>
                      <td style={{ padding:'10px 12px', color:'#6B7280', fontSize:11 }}>{u.joined}</td>
                      <td style={{ padding:'10px 12px', color:'#111827' }}>{u.sport}</td>
                      <td style={{ padding:'10px 12px' }}><span style={{ fontSize:11, fontWeight:700, color:u.consent?'#059669':'#DC2626' }}>{u.consent?'✓ 已同意':'✗ 未同意'}</span></td>
                      <td style={{ padding:'10px 12px', color:'#6B7280', fontSize:11 }}>{u.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* API Settings - 新版（引入獨立元件） */}
        {tab==='api' && <APISettings/>}

        {/* Prompt Settings - 新版（引入獨立元件） */}
        {tab==='prompt' && <PromptSettings/>}

        {/* 其他 tabs */}
        {['signals','settle','agents','system'].includes(tab) && (
          <div style={{ background:'#fff', border:'1px solid #D4D8DF', borderRadius:10, padding:'24px', textAlign:'center', color:'#6B7280' }}>
            {tab==='signals' && '信號管理 — 串接 Firestore 後完整啟用'}
            {tab==='settle' && '快速結算 — 串接 Firestore 後完整啟用'}
            {tab==='agents' && '代理管理 — 串接 Firestore 後完整啟用'}
            {tab==='system' && '系統設定 — 串接 Firestore 後完整啟用'}
          </div>
        )}
      </div>

      {/* Add Signal Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'24px', width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0, fontWeight:800, color:'#111827' }}>新增分析報告</h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#6B7280' }}>✕</button>
            </div>
            <div style={{ display:'grid', gap:12 }}>
              {[{label:'主隊',field:'home'},{label:'客隊',field:'away'},{label:'模型預測方向',field:'pick'},{label:'參考賠率',field:'odds'}].map(f=>(
                <div key={f.field}><Label>{f.label}</Label><input value={newSignal[f.field]} onChange={e=>setNewSignal(p=>({...p,[f.field]:e.target.value}))} style={inputStyle}/></div>
              ))}
              <button onClick={()=>setShowModal(false)} style={{ background:'#0F3460', color:'#fff', border:'none', padding:'12px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:700, marginTop:4 }}>建立</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
