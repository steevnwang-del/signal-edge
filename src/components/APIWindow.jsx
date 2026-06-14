import { C } from '../constants/colors';
export const APIWindow = ({ index, title, children, locked }) => (
  <div style={{ border: `1.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden", background: C.white }}>
    <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.panelAlt }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.navy, letterSpacing: 0.5 }}>{title}</span>
      <span style={{ fontSize: 10, color: C.mutedLight, border: `1px solid ${C.border}`, padding: "2px 8px", borderRadius: 3 }}>API 窗口 {index}</span>
    </div>
    <div style={{ padding: 16 }}>
      {locked ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>🔒</div>
          <div style={{ color: C.muted, fontSize: 13 }}>VIP 用戶專屬</div>
        </div>
      ) : children}
    </div>
  </div>
);
