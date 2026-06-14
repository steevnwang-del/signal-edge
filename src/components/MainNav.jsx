import { useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { C } from '../constants/colors';

const ROLE_LABELS = { guest:"訪客", free:"免費", vip:"VIP", agent:"代理", admin:"管理" };

export default function MainNav({ page, role, setPage, setRole }) {
  const isMobile = useIsMobile();
  const [showRoles, setShowRoles] = useState(false);

  const navLinks = role === "admin"
    ? [{ id: "admin", label: "管理後台" }, { id: "dashboard", label: "前台" }]
    : role === "agent"
    ? [{ id: "dashboard", label: "信號" }, { id: "agent", label: "代理" }]
    : [{ id: "dashboard", label: "信號中心" }, { id: "history", label: "勝率" }];

  const switchRole = (r) => {
    setRole(r); setShowRoles(false);
    if (r === "guest") setPage("landing");
    else if (r === "admin") setPage("admin");
    else if (r === "agent") setPage("agent");
    else setPage("dashboard");
  };

  return (
    <>
      <nav style={{ background: C.navy, color: C.white, padding: isMobile ? "0 16px" : "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 32 }}>
          <div onClick={() => setPage("landing")} style={{ cursor: "pointer", flexShrink: 0 }}>
            <span style={{ fontWeight: 900, fontSize: isMobile ? 16 : 18, letterSpacing: -0.5 }}>SIGNAL</span>
            <span style={{ fontWeight: 300, fontSize: isMobile ? 16 : 18, opacity: 0.6 }}>EDGE</span>
          </div>
          {!isMobile && (
            <div style={{ display: "flex", gap: 4 }}>
              {navLinks.map(l => (
                <button key={l.id} onClick={() => setPage(l.id)} style={{ background: page === l.id ? "rgba(255,255,255,0.15)" : "transparent", border: "none", color: page === l.id ? C.white : "rgba(255,255,255,0.55)", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{l.label}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isMobile ? (
            <>
              {navLinks.map(l => (
                <button key={l.id} onClick={() => setPage(l.id)} style={{ background: page === l.id ? "rgba(255,255,255,0.2)" : "transparent", border: "none", color: page === l.id ? C.white : "rgba(255,255,255,0.5)", padding: "5px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{l.label}</button>
              ))}
              <button onClick={() => setShowRoles(v => !v)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: C.white, padding: "5px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>{ROLE_LABELS[role]} ▾</button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>[Demo]</span>
              {Object.keys(ROLE_LABELS).map(r => (
                <button key={r} onClick={() => switchRole(r)} style={{ background: role === r ? "rgba(255,255,255,0.2)" : "transparent", border: `1px solid ${role === r ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"}`, color: role === r ? C.white : "rgba(255,255,255,0.45)", padding: "3px 10px", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{ROLE_LABELS[r]}</button>
              ))}
            </>
          )}
        </div>
      </nav>
      {isMobile && showRoles && (
        <div style={{ position: "fixed", top: 52, right: 0, zIndex: 200, background: C.navy, border: "1px solid rgba(255,255,255,0.15)", borderRadius: "0 0 0 10px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
          {Object.entries(ROLE_LABELS).map(([r, label]) => (
            <button key={r} onClick={() => switchRole(r)} style={{ display: "block", width: "100%", textAlign: "left", background: role === r ? "rgba(255,255,255,0.15)" : "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)", color: role === r ? C.white : "rgba(255,255,255,0.65)", padding: "12px 20px", cursor: "pointer", fontSize: 13, fontWeight: role === r ? 700 : 400 }}>{label} 模式</button>
          ))}
        </div>
      )}
    </>
  );
}
