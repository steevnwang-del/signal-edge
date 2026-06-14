import { C } from '../constants/colors';
export default function SettlementToast({ signal }) {
  if (!signal) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, background: signal.status === "win" ? "#065F46" : "#7F1D1D", color: "#fff", borderRadius: 10, padding: "14px 20px", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 12, maxWidth: 320 }}>
      <span style={{ fontSize: 24 }}>{signal.status === "win" ? "✅" : "❌"}</span>
      <div>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{signal.status === "win" ? "🎯 信號命中！自動結算" : "信號未中，自動結算"}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{signal.home} vs {signal.away} — {signal.result?.score}</div>
      </div>
    </div>
  );
};
