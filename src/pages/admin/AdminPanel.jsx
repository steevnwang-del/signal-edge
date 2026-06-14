import { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SportBadge } from '../../components/SportBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { StrengthDots } from '../../components/StrengthDots';
import { MOCK_USERS } from '../../constants/mockData';
import { C } from '../../constants/colors';

const inputStyle = {
  background: '#F6F7FA', border: '1px solid #D4D8DF',
  borderRadius: 6, padding: '8px 12px', fontSize: 13,
  color: '#111827', outline: 'none', width: '100%', boxSizing: 'border-box',
};

const Label = ({ children }) => (
  <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' }}>{children}</div>
);

const Toggle = ({ val, onChange, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E9EBF0' }}>
    <span style={{ fontSize: 13, color: '#111827' }}>{label}</span>
    <div onClick={() => onChange(!val)} style={{ width: 40, height: 22, borderRadius: 11, cursor: 'pointer', background: val ? C.navy : C.border, position: 'relative', transition: 'background 0.2s' }}>
      <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: C.white, transition: 'left 0.2s' }} />
    </div>
  </div>
);

const TABS = [
  ['overview','總覽'], ['preview','👁 預覽模式'], ['signals','信號管理'],
  ['settle','快速結算'], ['users','用戶資料'], ['agents','代理管理'],
  ['content','內容設定'], ['ads','廣告管理'], ['system','系統設定'], ['api','API 設定'],
];

export default function AdminPanel({ signals, setPreviewRole, setPage: navToPage }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [newSignal, setNewSignal] = useState({ sport: '世界杯', home: '', away: '', pick: '', odds: '', mode: 'stable', strength: 3, accessLevel: 'free' });
  const [settings, setSettings] = useState({
    platformName: 'SIGNALEDGE', platformSubtitle: '台灣首個專業運動分析平台',
    marqueeEnabled: true, marqueeText: '🏆 2026世界杯分析進行中｜今日已發出3個信號｜本月勝率 71%｜使用邀請碼 VIP2026 立即升級', marqueeSpeed: 'normal',
    announcementEnabled: true, announcementText: '世界杯特別活動：6月份新加入用戶首月VIP免費！', announcementType: 'info',
    adBanner1Enabled: false, adBanner1Text: '廣告橫幅 1', adBanner1Url: '',
    adBanner2Enabled: false, adBanner2Text: '廣告橫幅 2', adBanner2Url: '',
    vipPrice: 499, agentLevel1Rate: 40, agentLevel2Rate: 20, freeSignalsPerDay: 3, requireInviteForVIP: false,
    consentText: '我同意平台收集我的使用資料，用於個人化服務及合作夥伴行銷推廣。',
  });
  const S = (k, v) => setSettings(p => ({ ...p, [k]: v }));

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {/* Marquee */}
      {settings.marqueeEnabled && (
        <div style={{ background: C.navy, color: C.white, padding: '6px 0', overflow: 'hidden', fontSize: 12 }}>
          <div style={{ whiteSpace: 'nowrap', display: 'inline-block', animation: `marquee ${settings.marqueeSpeed === 'fast' ? 15 : settings.marqueeSpeed === 'slow' ? 40 : 25}s linear infinite` }}>
            &nbsp;&nbsp;&nbsp;{settings.marqueeText}&nbsp;&nbsp;&nbsp;{settings.marqueeText}&nbsp;&nbsp;&nbsp;
            <style>{`@keyframes marquee { from { transform: translateX(100vw); } to { transform: translateX(-100%); } }`}</style>
          </div>
        </div>
      )}
      {settings.announcementEnabled && (
        <div style={{ background: settings.announcementType === 'warning' ? '#FFFBEB' : settings.announcementType === 'success' ? '#ECFDF5' : '#EFF6FF', borderBottom: `1px solid ${settings.announcementType === 'warning' ? '#FDE68A' : settings.announcementType === 'success' ? '#A7F3D0' : '#BFDBFE'}`, padding: '8px 28px', fontSize: 13, color: settings.announcementType === 'warning' ? '#92400E' : settings.announcementType === 'success' ? '#065F46' : C.navy, fontWeight: 600, textAlign: 'center' }}>
          📢 {settings.announcementText}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px' : '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.dark, margin: '0 0 2px' }}>管理後台</h2>
            <p style={{ color: C.muted, margin: 0, fontSize: 12 }}>{settings.platformName} · {new Date().toLocaleDateString('zh-TW')}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 11, background: '#ECFDF5', color: C.win, border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: 5, fontWeight: 700 }}>● 系統正常</span>
            <span style={{ fontSize: 11, background: '#EFF6FF', color: C.navy, border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: 5, fontWeight: 700 }}>WC2026 進行中</span>
          </div>
        </div>

        {/* Tab Nav */}
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.white, width: 'max-content' }}>
            {TABS.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ padding: '9px 14px', border: 'none', cursor: 'pointer', background: tab === id ? C.navy : 'transparent', color: tab === id ? C.white : C.muted, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', borderRight: `1px solid ${C.borderLight}` }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(6,1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { label: '總用戶', val: '1,284' }, { label: 'VIP用戶', val: '312', color: C.amber },
                { label: '活躍代理', val: '47', color: C.navy }, { label: '今日信號', val: signals.length.toString() },
                { label: '整體勝率', val: '68.4%', color: C.win }, { label: '已同意行銷', val: `${MOCK_USERS.filter(u=>u.consent).length}/${MOCK_USERS.length}`, color: C.navy },
              ].map(s => (
                <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: C.muted, letterSpacing: 0.5, marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color || C.dark, fontFamily: 'ui-monospace, monospace' }}>{s.val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontWeight: 700, color: C.dark, marginBottom: 12, fontSize: 13 }}>待處理事項</div>
                {[
                  { label: '待結算信號', val: signals.filter(s=>s.status==='pending').length, color: C.amber },
                  { label: '待審代理申請', val: 3, color: C.navy },
                  { label: '待處理提領', val: 7, color: C.loss },
                ].map(i => (
                  <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.borderLight}` }}>
                    <span style={{ fontSize: 13, color: C.muted }}>{i.label}</span>
                    <span style={{ fontWeight: 800, color: i.color, fontFamily: 'ui-monospace, monospace' }}>{i.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontWeight: 700, color: C.dark, marginBottom: 12, fontSize: 13 }}>本月收入</div>
                {[
                  { label: 'VIP訂閱收入', val: '$155,688', color: C.win },
                  { label: '代理佣金支出', val: '-$48,420', color: C.loss },
                  { label: '淨收入', val: '$107,268', color: C.navy },
                  { label: '廣告收入', val: '$12,000', color: C.amber },
                ].map(i => (
                  <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.borderLight}` }}>
                    <span style={{ fontSize: 13, color: C.muted }}>{i.label}</span>
                    <span style={{ fontWeight: 800, color: i.color, fontFamily: 'ui-monospace, monospace' }}>{i.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preview Mode */}
        {tab === 'preview' && (
          <div>
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400E', fontWeight: 600 }}>
              👁 預覽模式：點擊按鈕以任何身份瀏覽平台，完整看到用戶視角
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12 }}>
              {[
                { role: 'guest', label: '訪客視角', desc: '未登入用戶看到的內容', icon: '👤', page: 'landing' },
                { role: 'free', label: '免費用戶', desc: '每日3個信號，基本分析', icon: '🔓', page: 'dashboard' },
                { role: 'vip', label: 'VIP用戶', desc: '所有信號，AI深度分析', icon: '⭐', page: 'dashboard' },
                { role: 'agent', label: '代理視角', desc: '代理後台，下線管理', icon: '🤝', page: 'agent' },
              ].map(v => (
                <div key={v.role} onClick={() => { setPreviewRole(v.role); navToPage(v.page); }}
                  style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '18px 16px', cursor: 'pointer', textAlign: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,52,96,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{v.icon}</div>
                  <div style={{ fontWeight: 700, color: C.dark, fontSize: 13, marginBottom: 4 }}>{v.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>{v.desc}</div>
                  <div style={{ background: C.navy, color: C.white, borderRadius: 5, padding: '5px 0', fontSize: 11, fontWeight: 700 }}>進入預覽</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signal Management */}
        {tab === 'signals' && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: C.dark }}>信號列表</span>
              <button onClick={() => setShowModal(true)} style={{ background: C.navy, color: C.white, border: 'none', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>+ 新增信號</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 700 }}>
                <thead>
                  <tr style={{ background: C.panelAlt }}>
                    {['賽事','運動','模式','推薦','EV','強度','權限','狀態','操作'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '9px 12px', fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {signals.map(sig => (
                    <tr key={sig.id} style={{ borderTop: `1px solid ${C.borderLight}` }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: C.dark, fontSize: 12 }}>{sig.flag?.home}{sig.home} vs {sig.flag?.away}{sig.away}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{sig.time}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}><SportBadge sport={sig.sport} /></td>
                      <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 11, color: sig.mode === 'darkHorse' ? C.amber : C.navy, fontWeight: 600 }}>{sig.mode === 'darkHorse' ? '黑馬' : '穩健'}</span></td>
                      <td style={{ padding: '10px 12px', color: C.dark, fontSize: 12 }}>{sig.pick}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: C.win }}>+{sig.ev}%</td>
                      <td style={{ padding: '10px 12px' }}><StrengthDots n={sig.strength} /></td>
                      <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: sig.accessLevel === 'vip' ? '#FFFBEB' : '#EFF6FF', color: sig.accessLevel === 'vip' ? C.amber : C.navy, fontWeight: 600 }}>{sig.accessLevel === 'vip' ? 'VIP' : '免費'}</span></td>
                      <td style={{ padding: '10px 12px' }}><StatusBadge status={sig.status} /></td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button style={{ fontSize: 10, padding: '3px 8px', border: `1px solid ${C.win}`, color: C.win, background: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>勝</button>
                          <button style={{ fontSize: 10, padding: '3px 8px', border: `1px solid ${C.loss}`, color: C.loss, background: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>負</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Settle */}
        {tab === 'settle' && (
          <div>
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#065F46', fontWeight: 600 }}>
              🏆 世界杯進行中 — 比賽結束後在此登記結果，系統自動更新
            </div>
            {signals.filter(s => s.status === 'pending').length === 0 ? (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 9, padding: '32px', textAlign: 'center', color: C.muted }}>✅ 所有信號已自動結算完畢</div>
            ) : signals.filter(s => s.status === 'pending').map(sig => (
              <div key={sig.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 9, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 7, marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <SportBadge sport={sig.sport} />
                    {sig.isWC && <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: 3 }}>🏆 世界杯</span>}
                    <span style={{ fontSize: 11, color: C.muted }}>{sig.time}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{sig.flag?.home}{sig.home} vs {sig.flag?.away}{sig.away}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>推薦：{sig.pick} @ {sig.odds}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input placeholder="比分 (如 2-1)" style={{ ...inputStyle, width: 110, fontSize: 12 }} />
                  <button style={{ background: C.win, color: C.white, border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✓ 信號勝</button>
                  <button style={{ background: C.loss, color: C.white, border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✗ 信號負</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Data */}
        {tab === 'users' && (
          <div>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '12px 16px', marginBottom: 14, fontSize: 12, color: C.navy }}>
              📋 以下用戶已在註冊時同意《用戶資料使用條款》。標記「已同意行銷」的用戶資料可用於合作推廣。
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <input placeholder="搜尋姓名、Email、LINE ID..." style={{ ...inputStyle, width: 260, flex: 'none' }} />
              <button style={{ background: C.win, color: C.white, border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>↓ 匯出 CSV</button>
            </div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: C.panelAlt }}>
                      {['ID','姓名','Email','電話','LINE ID','角色','加入日期','最後活躍','偏好','行銷同意','來源'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '9px 12px', fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_USERS.map((u, i) => (
                      <tr key={u.id} style={{ borderTop: `1px solid ${C.borderLight}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                        <td style={{ padding: '10px 12px', color: C.muted, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{u.id}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: C.dark }}>{u.name}</td>
                        <td style={{ padding: '10px 12px', color: C.muted }}>{u.email}</td>
                        <td style={{ padding: '10px 12px', color: C.dark, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{u.phone}</td>
                        <td style={{ padding: '10px 12px', color: C.navy, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{u.line}</td>
                        <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: u.role === 'vip' ? '#FFFBEB' : u.role === 'agent' ? '#EFF6FF' : C.panelAlt, color: u.role === 'vip' ? C.amber : u.role === 'agent' ? C.navy : C.muted }}>{u.role.toUpperCase()}</span></td>
                        <td style={{ padding: '10px 12px', color: C.muted, whiteSpace: 'nowrap', fontSize: 11 }}>{u.joined}</td>
                        <td style={{ padding: '10px 12px', color: u.lastActive === '今日' ? C.win : C.muted, whiteSpace: 'nowrap', fontWeight: u.lastActive === '今日' ? 700 : 400 }}>{u.lastActive}</td>
                        <td style={{ padding: '10px 12px', color: C.dark }}>{u.sport}</td>
                        <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 11, fontWeight: 700, color: u.consent ? C.win : C.loss }}>{u.consent ? '✓ 已同意' : '✗ 未同意'}</span></td>
                        <td style={{ padding: '10px 12px', color: C.muted, fontSize: 11 }}>{u.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '10px 16px', background: C.panelAlt, borderTop: `1px solid ${C.borderLight}`, fontSize: 11, color: C.muted }}>
                共 1,284 筆用戶資料 · 已同意行銷：892 人（69.5%）
              </div>
            </div>
          </div>
        )}

        {/* Content Settings */}
        {tab === 'content' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontWeight: 700, color: C.dark, marginBottom: 14, fontSize: 14 }}>跑馬燈設定</div>
              <Toggle val={settings.marqueeEnabled} onChange={v => S('marqueeEnabled', v)} label="啟用跑馬燈" />
              <div style={{ marginTop: 12 }}><Label>跑馬燈文字</Label><textarea value={settings.marqueeText} onChange={e => S('marqueeText', e.target.value)} style={{ ...inputStyle, height: 80, resize: 'vertical' }} /></div>
              <div style={{ marginTop: 10 }}><Label>滾動速度</Label>
                <select value={settings.marqueeSpeed} onChange={e => S('marqueeSpeed', e.target.value)} style={inputStyle}>
                  <option value="slow">慢速</option><option value="normal">正常</option><option value="fast">快速</option>
                </select>
              </div>
            </div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontWeight: 700, color: C.dark, marginBottom: 14, fontSize: 14 }}>公告橫幅</div>
              <Toggle val={settings.announcementEnabled} onChange={v => S('announcementEnabled', v)} label="啟用公告橫幅" />
              <div style={{ marginTop: 12 }}><Label>公告內容</Label><input value={settings.announcementText} onChange={e => S('announcementText', e.target.value)} style={inputStyle} /></div>
              <div style={{ marginTop: 10 }}><Label>公告類型</Label>
                <select value={settings.announcementType} onChange={e => S('announcementType', e.target.value)} style={inputStyle}>
                  <option value="info">資訊（藍色）</option><option value="warning">警告（黃色）</option><option value="success">成功（綠色）</option>
                </select>
              </div>
            </div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontWeight: 700, color: C.dark, marginBottom: 14, fontSize: 14 }}>平台名稱</div>
              <div style={{ marginBottom: 10 }}><Label>名稱</Label><input value={settings.platformName} onChange={e => S('platformName', e.target.value)} style={inputStyle} /></div>
              <Label>副標題</Label><input value={settings.platformSubtitle} onChange={e => S('platformSubtitle', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontWeight: 700, color: C.dark, marginBottom: 14, fontSize: 14 }}>用戶同意書文字</div>
              <Label>註冊時顯示（影響可用資料數量）</Label>
              <textarea value={settings.consentText} onChange={e => S('consentText', e.target.value)} style={{ ...inputStyle, height: 100, resize: 'vertical' }} />
              <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>ⓘ 勾選同意的用戶可用於合作行銷。建議文字清楚說明用途以提高同意率。</div>
            </div>
          </div>
        )}

        {/* Ads */}
        {tab === 'ads' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: C.navy }}>
              💡 廣告版位說明：向廣告主收費提供版位，而非出售用戶資料。合法且更高價值的變現方式。
            </div>
            {[1,2].map(n => (
              <div key={n} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
                <div style={{ fontWeight: 700, color: C.dark, marginBottom: 14, fontSize: 14 }}>廣告版位 {n}</div>
                <Toggle val={settings[`adBanner${n}Enabled`]} onChange={v => S(`adBanner${n}Enabled`, v)} label={`啟用廣告橫幅 ${n}`} />
                <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                  <div><Label>廣告文字</Label><input value={settings[`adBanner${n}Text`]} onChange={e => S(`adBanner${n}Text`, e.target.value)} style={inputStyle} placeholder="例：XX分析工具 — 專業賠率追蹤" /></div>
                  <div><Label>點擊連結</Label><input value={settings[`adBanner${n}Url`]} onChange={e => S(`adBanner${n}Url`, e.target.value)} style={inputStyle} placeholder="https://..." /></div>
                  {settings[`adBanner${n}Enabled`] && (
                    <div style={{ padding: '12px 16px', background: C.amberBg, border: `1px dashed ${C.amber}`, borderRadius: 6, fontSize: 12, color: C.amber, fontWeight: 600, textAlign: 'center' }}>
                      📢 {settings[`adBanner${n}Text`]} — 預覽效果
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* System */}
        {tab === 'system' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontWeight: 700, color: C.dark, marginBottom: 14, fontSize: 14 }}>訂閱設定</div>
              <div style={{ marginBottom: 10 }}><Label>VIP 月費（台幣）</Label><input type="number" value={settings.vipPrice} onChange={e => S('vipPrice', +e.target.value)} style={inputStyle} /></div>
              <Toggle val={settings.requireInviteForVIP} onChange={v => S('requireInviteForVIP', v)} label="VIP 需要邀請碼" />
              <div style={{ marginTop: 10 }}><Label>免費用戶每日信號數</Label>
                <select value={settings.freeSignalsPerDay} onChange={e => S('freeSignalsPerDay', +e.target.value)} style={inputStyle}>
                  {[1,2,3,5].map(n => <option key={n} value={n}>{n} 個</option>)}
                </select>
              </div>
            </div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontWeight: 700, color: C.dark, marginBottom: 14, fontSize: 14 }}>代理分潤設定</div>
              <div style={{ marginBottom: 10 }}><Label>一級代理佣金 (%)</Label><input type="number" value={settings.agentLevel1Rate} onChange={e => S('agentLevel1Rate', +e.target.value)} style={inputStyle} /></div>
              <div><Label>二級代理佣金 (%)</Label><input type="number" value={settings.agentLevel2Rate} onChange={e => S('agentLevel2Rate', +e.target.value)} style={inputStyle} /></div>
            </div>
          </div>
        )}

        {tab === 'agents' && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '24px', textAlign: 'center', color: C.muted }}>
            代理管理模組 · 串接 Firebase Firestore 後完整啟用
          </div>
        )}

        {/* API Settings */}
        {tab === 'api' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { name: 'The Odds API', key: '①', desc: '多平台即時賠率', url: 'the-odds-api.com', needKey: true },
              { name: 'AI 分析引擎', key: '②', desc: '新聞分析、傷病掃描', url: '自研系統（內部）', needKey: true },
              { name: 'Polymarket API', key: '③', desc: '預測市場數據', url: 'polymarket.com', needKey: false },
              { name: 'MLB Stats API', key: '④', desc: '棒球官方數據', url: 'statsapi.mlb.com', needKey: false },
              { name: 'LINE Login API', key: '⑤', desc: 'LINE 登入整合', url: 'developers.line.biz', needKey: true },
            ].map(api => (
              <div key={api.name} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 9, padding: '14px 18px', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 18 }}>
                <div style={{ width: 34, height: 34, background: C.navy, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{api.key}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: C.dark, marginBottom: 2, fontSize: 13 }}>{api.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{api.desc} · <span style={{ color: C.navy }}>{api.url}</span></div>
                </div>
                <div style={{ width: isMobile ? '100%' : 'auto' }}>
                  <div style={{ fontSize: 11, color: api.needKey ? C.loss : C.win, fontWeight: 600, marginBottom: api.needKey ? 6 : 0 }}>{api.needKey ? '● 未設定' : '● 免費，無需Key'}</div>
                  {api.needKey && <input placeholder="貼上 API Key..." style={{ ...inputStyle, width: isMobile ? '100%' : 200, fontSize: 12 }} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Signal Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: '24px', width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontWeight: 800, color: C.dark }}>新增信號</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.muted }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { label: '主隊', field: 'home', placeholder: '例：巴西 🇧🇷' },
                { label: '客隊', field: 'away', placeholder: '例：摩洛哥 🇲🇦' },
                { label: '推薦方向', field: 'pick', placeholder: '例：巴西勝或平' },
                { label: '賠率', field: 'odds', placeholder: '例：1.62' },
              ].map(f => (
                <div key={f.field}><Label>{f.label}</Label><input value={newSignal[f.field]} onChange={e => setNewSignal(p => ({...p, [f.field]: e.target.value}))} placeholder={f.placeholder} style={inputStyle} /></div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><Label>運動</Label><select value={newSignal.sport} onChange={e => setNewSignal(p => ({...p, sport: e.target.value}))} style={inputStyle}>{['世界杯','NBA','MLB','足球'].map(s => <option key={s}>{s}</option>)}</select></div>
                <div><Label>模式</Label><select value={newSignal.mode} onChange={e => setNewSignal(p => ({...p, mode: e.target.value}))} style={inputStyle}><option value="stable">穩健</option><option value="darkHorse">黑馬</option></select></div>
                <div><Label>強度</Label><select value={newSignal.strength} onChange={e => setNewSignal(p => ({...p, strength: +e.target.value}))} style={inputStyle}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} 星</option>)}</select></div>
                <div><Label>權限</Label><select value={newSignal.accessLevel} onChange={e => setNewSignal(p => ({...p, accessLevel: e.target.value}))} style={inputStyle}><option value="free">免費</option><option value="vip">VIP</option></select></div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: C.navy, color: C.white, border: 'none', padding: '12px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, marginTop: 4 }}>建立信號</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
