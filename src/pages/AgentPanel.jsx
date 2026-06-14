import { useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { C } from '../constants/colors';
import { AGENT_DATA } from '../constants/mockData';

export default function AgentPanel() {
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const refLink = `https://signaledge.com/invite/${AGENT_DATA.refCode}`;

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "20px 14px" : "36px 28px" }}>
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: C.dark, margin: "0 0 4px" }}>代理後台</h2>
          <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>代理碼：{AGENT_DATA.refCode}</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "下線總人數", val: AGENT_DATA.downline, unit: "人" },
            { label: "活躍下線", val: AGENT_DATA.activeDownline, unit: "人", color: C.win },
            { label: "本月佣金", val: `$${AGENT_DATA.monthCommission.toLocaleString()}`, color: C.amber },
            { label: "累計佣金", val: `$${AGENT_DATA.totalCommission.toLocaleString()}` },
          ].map(s => (
            <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 9, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color || C.dark, fontFamily: "ui-monospace, monospace", letterSpacing: -0.5 }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Referral Link */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 9, padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>我的推廣連結</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, background: C.panelAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", fontSize: 13, fontFamily: "ui-monospace, monospace", color: C.navy, minWidth: 200 }}>{refLink}</div>
            <button onClick={() => { navigator.clipboard?.writeText(refLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ background: copied ? C.win : C.navy, color: C.white, border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "background 0.2s", whiteSpace: "nowrap" }}>
              {copied ? "已複製 ✓" : "複製連結"}
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
            直屬下線 VIP 訂閱：佣金 40% · 二級下線 VIP 訂閱：佣金 20%
          </div>
        </div>

        {/* Commission Table */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.borderLight}` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>佣金明細</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 500 }}>
              <thead>
                <tr style={{ background: C.panelAlt }}>
                  {["日期","用戶","類型","層級","佣金"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AGENT_DATA.commissions.map((c, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.borderLight}` }}>
                    <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{c.date}</td>
                    <td style={{ padding: "12px 16px", color: C.dark, fontWeight: 500 }}>{c.user}</td>
                    <td style={{ padding: "12px 16px", color: C.muted }}>{c.type}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 3, background: c.level === "直屬" ? "#EFF6FF" : "#F0FDF4", color: c.level === "直屬" ? C.navy : C.win, fontWeight: 600 }}>{c.level}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: C.win, fontFamily: "ui-monospace, monospace" }}>+${c.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
