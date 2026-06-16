import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',borderLight:'#E9EBF0',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626',panelAlt:'#F6F7FA'};

// 成功彈窗
function InviteSuccessModal({ data, onClose }) {
  if (!data) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.white,borderRadius:16,padding:'36px 28px',maxWidth:380,width:'100%',textAlign:'center',position:'relative'}}>
        <div style={{fontSize:52,marginBottom:12}}>🎉</div>
        <div style={{fontSize:22,fontWeight:950,color:C.dark,marginBottom:8}}>邀請成功！</div>
        <div style={{fontSize:14,color:C.muted,marginBottom:20,lineHeight:1.7}}>
          你成功邀請了一位新會員加入 SignalEdge！
        </div>
        <div style={{background:'#ECFDF5',border:'1px solid #6EE7B7',borderRadius:12,padding:'16px 20px',marginBottom:20}}>
          <div style={{fontSize:12,color:'#065F46',fontWeight:700,marginBottom:6}}>🎁 獲得獎勵</div>
          <div style={{fontSize:28,fontWeight:950,color:C.win}}>{data.inviterUnlocks} 場</div>
          <div style={{fontSize:13,color:'#065F46'}}>今日進階分析解鎖額度</div>
        </div>
        <div style={{fontSize:12,color:C.muted,marginBottom:20}}>好友同時獲得 {data.inviteeUnlocks} 場解鎖額度</div>
        <button onClick={onClose} style={{background:C.navy,color:C.white,border:'none',padding:'12px 32px',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:700,width:'100%'}}>
          太棒了，繼續
        </button>
      </div>
    </div>
  );
}

export default function AgentPanel({ user, siteSettings, setPage }) {
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [invites, setInvites] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successModal, setSuccessModal] = useState(null);

  const rules = siteSettings?.inviteRewards || {
    inviterUnlocks: 2, inviteeUnlocks: 1, rewardDays: 1, allGamesThreshold: 3, passThreshold: 10
  };

  // 產生邀請碼
  const code = (() => {
    const seed = user?.uid || user?.email || 'guest';
    let n = 0; for (const ch of seed) n = (n * 31 + ch.charCodeAt(0)) % 999999;
    return `SE-${String(n).padStart(6, '0')}`;
  })();

  const refLink = `${window.location.origin}/invite/${code}`;

  // 載入資料
  const loadData = useCallback(async () => {
    if (!user?.uid) { setLoading(false); return; }
    setLoading(true);
    try {
      const fs = await import('../services/firestore.js');
      // 確保邀請碼已存入 Firestore
      await fs.ensureInviteCode?.(user.uid);
      // 取得用戶資料（含 bonusUnlocks, inviteCount）
      const u = await fs.getUser?.(user.uid);
      setUserData(u);
      // 取得邀請列表
      const list = await fs.getMyInvites?.(user.uid, { limitN: 50 });
      setInvites(list || []);
    } catch (e) { console.warn('[AgentPanel] load failed:', e.message); }
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => { loadData(); }, [loadData]);

  // 處理邀請碼（從 localStorage 讀取，登入後自動處理）
  useEffect(() => {
    const handlePendingInvite = async () => {
      if (!user?.uid) return;
      try {
        const pendingCode = localStorage.getItem('signalEdgeInviteCode');
        if (!pendingCode || pendingCode === code) return; // 不能邀請自己
        const fs = await import('../services/firestore.js');
        const result = await fs.recordInvite?.({
          inviteCode: pendingCode,
          inviteeUid: user.uid,
          inviteeEmail: user.email,
          rules,
        });
        localStorage.removeItem('signalEdgeInviteCode');
        if (result?.success) {
          setSuccessModal(result);
          await loadData(); // 刷新資料
        }
      } catch (e) { console.warn('[AgentPanel] invite handling failed:', e.message); }
    };
    handlePendingInvite();
  }, [user?.uid]);

  const stats = {
    invited: userData?.inviteCount || invites.length || 0,
    bonusUnlocks: userData?.bonusUnlocks || 0,
    todayUnlocks: rules.inviterUnlocks || 2,
  };

  const maskCode = (s = '') => s ? `${s.slice(0, 3)}****${s.slice(-3)}` : '—';

  const formatTime = (ts) => {
    if (!ts) return '—';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <InviteSuccessModal data={successModal} onClose={() => setSuccessModal(null)} />

      <div style={{ maxWidth: 1020, margin: '0 auto', padding: isMobile ? '20px 14px' : '36px 28px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, color: C.amber, fontWeight: 900, letterSpacing: 1.2, marginBottom: 6 }}>邀請獎勵</div>
          <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 950, color: C.dark, margin: '0 0 6px' }}>邀請好友，一起解鎖今日進階分析</h2>
          <p style={{ color: C.muted, margin: 0, fontSize: 13, lineHeight: 1.7 }}>
            成功邀請新會員後，雙方獲得今日賽事分析解鎖額度。
          </p>
        </div>

        {/* 統計卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: '成功邀請', val: loading ? '…' : stats.invited, unit: '人' },
            { label: '累積獎勵', val: loading ? '…' : stats.bonusUnlocks, unit: '場', color: C.win },
            { label: '每次邀請可得', val: rules.inviterUnlocks || 2, unit: '場', color: C.amber },
            { label: '我的邀請碼', val: maskCode(code), unit: '' },
          ].map(s => (
            <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: s.label === '我的邀請碼' ? 18 : 28, fontWeight: 950, color: s.color || C.dark, fontFamily: 'ui-monospace,monospace' }}>
                {s.val}<span style={{ fontSize: 12, marginLeft: 4, color: C.muted }}>{s.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 邀請連結 */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 850, color: C.dark, marginBottom: 12 }}>我的邀請連結</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: C.panelAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: '11px 14px', fontSize: 13, fontFamily: 'ui-monospace,monospace', color: C.navy, minWidth: 200, wordBreak: 'break-all' }}>
              {refLink}
            </div>
            <button
              onClick={() => { navigator.clipboard?.writeText(refLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ background: copied ? C.win : C.navy, color: C.white, border: 'none', padding: '11px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 850, whiteSpace: 'nowrap' }}>
              {copied ? '已複製 ✓' : '複製連結'}
            </button>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
            成功邀請 1 位新會員：你獲得今日 <b>{rules.inviterUnlocks || 2}</b> 場進階分析解鎖；好友獲得 <b>{rules.inviteeUnlocks || 1}</b> 場。
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          {/* 獎勵規則 */}
          <div style={{ background: '#FFF7E6', border: '1px solid #F5D38A', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 950, color: C.dark, marginBottom: 10 }}>獎勵規則</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: C.muted, fontSize: 13, lineHeight: 2 }}>
              <li>每成功邀請 1 人：獲得今日 <b>{rules.inviterUnlocks || 2}</b> 場解鎖額度</li>
              <li>邀請滿 <b>{rules.allGamesThreshold || 3}</b> 人：解鎖今日全部進階分析</li>
              <li>邀請滿 <b>{rules.passThreshold || 10}</b> 人：世界盃短期通行權</li>
              <li>同一裝置異常註冊可能進入人工審核</li>
            </ul>
          </div>

          {/* 邀請紀錄 */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 950, color: C.dark }}>邀請紀錄</div>
              <button onClick={loadData} style={{ fontSize: 11, padding: '4px 10px', border: `1px solid ${C.border}`, borderRadius: 6, background: 'transparent', cursor: 'pointer', color: C.muted }}>
                🔄 刷新
              </button>
            </div>
            {loading
              ? <div style={{ textAlign: 'center', padding: 20, color: C.muted, fontSize: 13 }}>載入中...</div>
              : invites.length === 0
                ? <div style={{ background: C.panelAlt, borderRadius: 10, padding: 18, textAlign: 'center', color: C.muted, fontSize: 13 }}>
                    尚無邀請紀錄。分享你的邀請連結開始累積！
                  </div>
                : <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {invites.map((inv, i) => (
                      <div key={inv.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < invites.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>{inv.inviteeEmail || '新會員'}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{formatTime(inv.createdAt)}</div>
                        </div>
                        <div style={{ fontSize: 11, color: C.win, fontWeight: 700, background: '#ECFDF5', padding: '3px 8px', borderRadius: 5 }}>
                          +{inv.inviterUnlocks || 2} 場
                        </div>
                      </div>
                    ))}
                  </div>
            }
          </div>
        </div>

        {/* 升級提示 */}
        <div style={{ marginTop: 20, background: C.navy, borderRadius: 12, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.white, marginBottom: 4 }}>想要不限場次的完整 VIP 功能？</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>解鎖 EV 分析、最低賠率、所有賽事完整報告</div>
          </div>
          <button onClick={() => setPage?.('upgrade')} style={{ background: C.amber, color: C.dark, border: 'none', padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap' }}>
            了解 VIP 方案 →
          </button>
        </div>
      </div>
    </div>
  );
}
