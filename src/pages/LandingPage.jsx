// ── LandingPage.jsx ────────────────────────────────────────────────────────────
// 訪客首頁：平台介紹、勝率統計、信號預覽、CTA
// 數據來源：mockData.js → 串接 Firebase 後改成 services/signals.js

import { useIsMobile } from '../hooks/useIsMobile';
import { StatusBadge } from '../components/StatusBadge';
import { SportBadge } from '../components/SportBadge';
import { EVNumber } from '../components/EVNumber';
import { StrengthDots } from '../components/StrengthDots';
import { SIGNALS, PLATFORM_STATS } from '../constants/mockData';
import { C } from '../constants/colors';

export default function LandingPage({ setPage, setRole }) {
  const isMobile = useIsMobile();
  // 組件內容從 sports-platform-mvp.jsx 的 LandingPage 移植
  // 為保持此檔案可讀，主要邏輯已拆出
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Hero Section */}
      <div style={{ background: C.navy, color: C.white, padding: isMobile ? "40px 16px 36px" : "64px 28px 56px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.amber, marginBottom: 16, textTransform: "uppercase" }}>
            台灣首個專業運動分析平台
          </div>
          <h1 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 900, lineHeight: 1.1, margin: "0 0 16px", letterSpacing: -1.5, color: C.white }}>
            用數據看穿<br /><span style={{ color: C.amber }}>市場定價錯誤</span>
          </h1>
          <p style={{ fontSize: isMobile ? 14 : 16, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: "0 0 28px", maxWidth: 440 }}>
            整合 Polymarket 預測市場、多平台賠率比對、AI即時新聞分析，自動篩選正期望值信號。
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => { setRole("free"); setPage("dashboard"); }} style={{ background: C.amber, color: "#111", border: "none", padding: isMobile ? "12px 22px" : "13px 28px", borderRadius: 7, cursor: "pointer", fontSize: isMobile ? 13 : 14, fontWeight: 800 }}>免費開始使用</button>
            <button style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.3)", color: C.white, padding: isMobile ? "12px 22px" : "13px 28px", borderRadius: 7, cursor: "pointer", fontSize: isMobile ? 13 : 14, fontWeight: 600 }}>查看歷史勝率</button>
          </div>
        </div>
      </div>
      {/* Platform Stats + Signal Preview — 完整版請參考 sports-platform-mvp.jsx */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "36px 16px" : "56px 28px", textAlign: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5,1fr)", gap: 14, marginBottom: 48 }}>
          {[
            { label: "累計信號", val: PLATFORM_STATS.totalSignals, unit: "個" },
            { label: "整體勝率", val: `${PLATFORM_STATS.winRate}`, unit: "%", color: C.win },
            { label: "穩健勝率", val: `${PLATFORM_STATS.stableWinRate}`, unit: "%" },
            { label: "黑馬勝率", val: `${PLATFORM_STATS.darkHorseWinRate}`, unit: "%" },
            { label: "平均EV", val: `+${PLATFORM_STATS.avgEV}`, unit: "%", color: C.win },
          ].map(s => (
            <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 14px" }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color || C.dark, fontFamily: "ui-monospace, monospace" }}>{s.val}<span style={{ fontSize: 13 }}>{s.unit}</span></div>
            </div>
          ))}
        </div>
        <button onClick={() => { setRole("free"); setPage("dashboard"); }} style={{ background: C.navy, color: C.white, border: "none", padding: isMobile ? "13px 32px" : "15px 40px", borderRadius: 8, cursor: "pointer", fontSize: isMobile ? 14 : 16, fontWeight: 800 }}>
          立即免費加入
        </button>
      </div>
    </div>
  );
}
