import { useMemo, useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { C } from '../constants/colors';

const mask = (s='') => s ? `${s.slice(0, 4)}****${s.slice(-3)}` : 'SE****001';

export default function AgentPanel({ user, siteSettings }) {
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const rules = siteSettings?.inviteRewards || { inviterUnlocks: 2, inviteeUnlocks: 1, rewardDays: 1, allGamesThreshold: 3, passThreshold: 10 };
  const code = useMemo(() => {
    const seed = user?.uid || user?.email || 'guest';
    let n = 0; for (const ch of seed) n = (n * 31 + ch.charCodeAt(0)) % 999999;
    return `SE-${String(n).padStart(6, '0')}`;
  }, [user]);
  const refLink = `${window.location.origin}/invite/${code}`;
  const stats = { invited: 0, activeRewards: 0, todayUnlocks: rules.inviterUnlocks || 2, passProgress: 0 };

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1020, margin: '0 auto', padding: isMobile ? '20px 14px' : '36px 28px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, color: C.amber, fontWeight: 900, letterSpacing: 1.2, marginBottom: 6 }}>邀請獎勵</div>
          <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 950, color: C.dark, margin: '0 0 6px' }}>邀請好友，一起解鎖今日進階分析</h2>
          <p style={{ color: C.muted, margin: 0, fontSize: 13, lineHeight: 1.7 }}>前期不做現金分潤。成功邀請新會員後，雙方獲得可用於今日賽事的分析解鎖額度。</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: '成功邀請', val: stats.invited, unit: '人' },
            { label: '今日可解鎖', val: stats.todayUnlocks, unit: '場', color: C.win },
            { label: '可用獎勵', val: stats.activeRewards, unit: '張', color: C.amber },
            { label: '邀請碼', val: mask(code), unit: '' },
          ].map(s => (
            <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: s.label === '邀請碼' ? 20 : 28, fontWeight: 950, color: s.color || C.dark, fontFamily: 'ui-monospace, monospace', letterSpacing: -0.5 }}>{s.val}<span style={{fontSize:12,marginLeft:4,color:C.muted}}>{s.unit}</span></div>
            </div>
          ))}
        </div>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 850, color: C.dark, marginBottom: 12 }}>我的邀請連結</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: C.panelAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: '11px 14px', fontSize: 13, fontFamily: 'ui-monospace, monospace', color: C.navy, minWidth: 220 }}>{refLink}</div>
            <button onClick={() => { navigator.clipboard?.writeText(refLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ background: copied ? C.win : C.navy, color: C.white, border: 'none', padding: '11px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 850, whiteSpace: 'nowrap' }}>
              {copied ? '已複製 ✓' : '複製連結'}
            </button>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
            成功邀請 1 位新會員：你解鎖今日 {rules.inviterUnlocks || 2} 場進階分析；好友解鎖今日 {rules.inviteeUnlocks || 1} 場。獎勵有效 {rules.rewardDays || 1} 天。
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#FFF7E6', border: '1px solid #F5D38A', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 950, color: C.dark, marginBottom: 10 }}>獎勵規則</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: C.muted, fontSize: 13, lineHeight: 1.9 }}>
              <li>邀請 {rules.allGamesThreshold || 3} 人：解鎖今日全部進階分析。</li>
              <li>邀請 {rules.passThreshold || 10} 人：解鎖世界盃短期通行權，實際規則以後台活動設定為準。</li>
              <li>同一裝置或異常註冊可能進入人工審核。</li>
            </ul>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 950, color: C.dark, marginBottom: 10 }}>獎勵紀錄</div>
            <div style={{ background: C.panelAlt, border: `1px dashed ${C.border}`, borderRadius: 10, padding: 18, textAlign: 'center', color: C.muted, fontSize: 13 }}>
              邀請紀錄啟用後會顯示在這裡。你可以先分享邀請連結，後台會逐步接上 Firestore 紀錄。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
