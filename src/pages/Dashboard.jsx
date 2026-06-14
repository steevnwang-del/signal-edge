import { useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { SportBadge } from '../components/SportBadge';
import { StatusBadge } from '../components/StatusBadge';
import { EVNumber } from '../components/EVNumber';
import { StrengthDots } from '../components/StrengthDots';
import { Countdown } from '../components/Countdown';
import { C } from '../constants/colors';

export default function Dashboard({ role, setPage, setSelectedSignal, signals }) {
  const isMobile = useIsMobile();
  const [sport, setSport] = useState("全部");
  const [mode, setMode] = useState("all");

  const filtered = signals.filter(s =>
    (sport === "全部" || s.sport === sport) &&
    (mode === "all" || s.mode === mode)
  );

  const canSeeVIP = role === "vip" || role === "agent" || role === "admin";
  const wcCount = signals.filter(s => s.isWC && s.status === "pending").length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px 14px" : "28px 28px" }}>

        {/* World Cup Banner */}
        <div style={{ background: "linear-gradient(135deg, #0a3d1f 0%, #145a32 50%, #0a3d1f 100%)", borderRadius: 10, padding: isMobile ? "16px" : "18px 24px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, border: "1px solid #1a7a3a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: isMobile ? 28 : 36 }}>🏆</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#4ade80", marginBottom: 3 }}>2026 FIFA WORLD CUP · 進行中</div>
              <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: "#ffffff", letterSpacing: -0.3 }}>世界杯賽事分析 — 美加墨 2026</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>48國參賽 · 6月11日 – 7月19日</div>
            </div>
          </div>
          <div style={{ textAlign: isMobile ? "left" : "right" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>今日世界杯信號</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80", fontFamily: "ui-monospace, monospace" }}>{wcCount}<span style={{ fontSize: 13, fontWeight: 600 }}> 個待結算</span></div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: isMobile ? "14px 16px" : "18px 24px", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5,auto)", gap: isMobile ? "12px 20px" : "0 40px", marginBottom: 16 }}>
          {[
            { label: "本月信號", val: "31", unit: "個" },
            { label: "本月勝率", val: "71.0", unit: "%", color: C.win },
            { label: "整體勝率", val: "68.4", unit: "%" },
            { label: "穩健/黑馬", val: "72/58", unit: "%" },
            { label: "平均EV", val: "+7.8", unit: "%", color: C.win },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, letterSpacing: -0.5, color: s.color || C.dark, fontFamily: "ui-monospace, monospace" }}>{s.val}<span style={{ fontSize: 12, fontWeight: 600 }}>{s.unit}</span></div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 7, overflow: "hidden", background: C.white }}>
            {["全部","世界杯","NBA","MLB"].map(s => (
              <button key={s} onClick={() => setSport(s)} style={{ padding: isMobile ? "6px 12px" : "7px 16px", border: "none", cursor: "pointer", background: sport === s ? C.navy : "transparent", color: sport === s ? C.white : C.muted, fontSize: isMobile ? 12 : 13, fontWeight: 600 }}>{s}</button>
            ))}
          </div>
          <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 7, overflow: "hidden", background: C.white }}>
            {[["all","全部"],["stable","穩健"],["darkHorse","黑馬"]].map(([val,label]) => (
              <button key={val} onClick={() => setMode(val)} style={{ padding: isMobile ? "6px 12px" : "7px 16px", border: "none", cursor: "pointer", background: mode === val ? (val === "darkHorse" ? C.amber : C.navy) : "transparent", color: mode === val ? C.white : C.muted, fontSize: isMobile ? 12 : 13, fontWeight: 600 }}>{label}</button>
            ))}
          </div>
          {role === "free" && !isMobile && (
            <button style={{ marginLeft: "auto", background: C.navy, color: C.white, border: "none", padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>升級 VIP →</button>
          )}
        </div>

        {/* Signal cards */}
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map(sig => {
            const isLocked = sig.accessLevel === "vip" && !canSeeVIP;
            return (
              <div key={sig.id}
                onClick={() => { if (!isLocked) { setSelectedSignal(sig); setPage("signal-detail"); }}}
                style={{ background: C.white, border: `1px solid ${C.border}`, borderLeft: `4px solid ${sig.mode === "darkHorse" ? C.amber : C.navy}`, borderRadius: "0 9px 9px 0", padding: isMobile ? "14px 14px" : "18px 22px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 10 : 20, cursor: isLocked ? "default" : "pointer", position: "relative", opacity: sig.status === "loss" ? 0.75 : 1 }}
                onMouseEnter={e => { if (!isLocked && !isMobile) e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,52,96,0.08)"; }}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              >
                {isLocked && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(236,238,242,0.9)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0 9px 9px 0", zIndex: 1 }}>
                    <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: C.navy }}>🔒 VIP 專屬 — 升級後解鎖</span>
                  </div>
                )}
                <div style={{ flex: 1, width: "100%" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                    <SportBadge sport={sig.sport} />
                    {sig.isWC && <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", background: "#dcfce7", border: "1px solid #86efac", padding: "1px 7px", borderRadius: 3 }}>🏆 世界杯</span>}
                    {sig.mode === "darkHorse" && <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, border: `1px solid ${C.amber}44`, padding: "1px 6px", borderRadius: 3, background: C.amberBg }}>黑馬</span>}
                    <span style={{ fontSize: 11, color: C.mutedLight }}>{sig.time}</span>
                    {sig.status === "pending" && sig.matchTimestamp && Date.now() < sig.matchTimestamp && (
                      <span style={{ fontSize: 10, color: C.muted }}>倒數 <Countdown matchTimestamp={sig.matchTimestamp} /></span>
                    )}
                    {sig.status === "pending" && sig.matchTimestamp && Date.now() >= sig.matchTimestamp && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, background: C.amberBg, padding: "1px 6px", borderRadius: 3 }}>⏱ 自動結算中</span>
                    )}
                    <StatusBadge status={sig.status} />
                  </div>
                  <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: C.dark, marginBottom: isMobile ? 4 : 6 }}>
                    {sig.flag?.home && <span style={{ marginRight: 4 }}>{sig.flag.home}</span>}
                    {sig.home} <span style={{ color: C.mutedLight, fontWeight: 400, fontSize: 13 }}>vs</span>{" "}
                    {sig.flag?.away && <span style={{ marginRight: 4 }}>{sig.flag.away}</span>}
                    {sig.away}
                  </div>
                  {sig.status !== "pending" && sig.result && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: sig.status === "win" ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${sig.status === "win" ? "#A7F3D0" : "#FECACA"}`, borderRadius: 5, padding: "3px 10px", marginTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: sig.status === "win" ? C.win : C.loss }}>{sig.result.score}</span>
                      <span style={{ fontSize: 11, color: sig.status === "win" ? C.win : C.loss }}>{sig.result.detail}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: isMobile ? 20 : 24, alignItems: "center", flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.mutedLight, marginBottom: 3 }}>推薦</div>
                    <div style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700, color: C.dark }}>{sig.pick}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>@{sig.odds}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.mutedLight, marginBottom: 3 }}>期望值</div>
                    <EVNumber ev={sig.ev} size={isMobile ? 18 : 22} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.mutedLight, marginBottom: 5 }}>強度</div>
                    <StrengthDots n={sig.strength} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {role === "free" && (
          <div style={{ marginTop: 14, padding: "12px 16px", background: C.amberBg, border: `1px solid ${C.amber}44`, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#92400E" }}>免費用戶今日 3/3 信號已解鎖</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.amber, cursor: "pointer" }}>邀請好友解鎖更多 →</span>
          </div>
        )}
      </div>
    </div>
  );
}
