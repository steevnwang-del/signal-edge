import { useIsMobile } from '../hooks/useIsMobile';
import { APIWindow } from '../components/APIWindow';
import { SportBadge } from '../components/SportBadge';
import { StatusBadge } from '../components/StatusBadge';
import { EVNumber } from '../components/EVNumber';
import { StrengthDots } from '../components/StrengthDots';
import { DATA_SOURCES } from '../constants/mockData';
import { C } from '../constants/colors';

export default function SignalDetail({ signal, role, setPage }) {
  const isMobile = useIsMobile();
  if (!signal) return (
    <div style={{ padding: 60, textAlign: "center", color: C.muted }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <div>信號不存在，請返回列表</div>
      <button onClick={() => setPage("dashboard")} style={{ marginTop: 16, background: C.navy, color: C.white, border: "none", padding: "8px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>返回</button>
    </div>
  );
  const canSeeVIP = role === "vip" || role === "agent" || role === "admin";

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "16px 14px" : "28px 28px" }}>
        <button onClick={() => setPage("dashboard")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>← 返回</button>

        {/* Match Header */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderLeft: `5px solid ${signal.mode === "darkHorse" ? C.amber : C.navy}`, borderRadius: "0 10px 10px 0", padding: isMobile ? "16px 16px" : "24px 28px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
            <SportBadge sport={signal.sport} />
            {signal.isWC && <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "1px 7px", borderRadius: 3 }}>🏆 世界杯</span>}
            {signal.mode === "darkHorse" && <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, border: `1px solid ${C.amber}44`, padding: "1px 7px", borderRadius: 3, background: C.amberBg }}>黑馬模式</span>}
            <span style={{ fontSize: 12, color: C.muted }}>{signal.time}</span>
            <StatusBadge status={signal.status} />
          </div>
          <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: C.dark, marginBottom: 14, letterSpacing: -0.5, lineHeight: 1.3 }}>
            {signal.flag?.home && <span style={{ marginRight: 4 }}>{signal.flag.home}</span>}
            {signal.home} <span style={{ color: C.mutedLight, fontWeight: 400 }}>vs</span>{" "}
            {signal.flag?.away && <span style={{ marginRight: 4 }}>{signal.flag.away}</span>}
            {signal.away}
          </div>
          <div style={{ display: "flex", gap: isMobile ? 16 : 32, flexWrap: "wrap" }}>
            {[
              { label: "推薦方向", val: signal.pick },
              { label: "賠率", val: signal.odds.toFixed(2) },
              { label: "模型勝率", val: `${signal.modelProb}%`, color: C.win },
              { label: "隱含勝率", val: `${signal.impliedProb}%`, color: C.muted },
              { label: "期望值", val: `+${signal.ev}%`, color: C.win },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 10, color: C.mutedLight, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: s.color || C.dark, fontFamily: "ui-monospace, monospace" }}>{s.val}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 10, color: C.mutedLight, marginBottom: 6 }}>信號強度</div>
              <StrengthDots n={signal.strength} />
            </div>
          </div>
        </div>

        {/* Three API Windows */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <APIWindow index="①" title="AI 深度分析" locked={!canSeeVIP}>
            <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.7, margin: 0 }}>{signal.aiAnalysis}</p>
            <div style={{ marginTop: 12, padding: "8px 10px", background: C.panelAlt, borderRadius: 5, fontSize: 11, color: C.muted }}>自研 AI 分析引擎 · 每30分鐘更新</div>
          </APIWindow>
          <APIWindow index="②" title="多平台賠率比對" locked={!canSeeVIP}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr>{["平台","賠率","隱含"].map(h => <th key={h} style={{ textAlign: "left", color: C.mutedLight, fontWeight: 600, paddingBottom: 6, fontSize: 10 }}>{h}</th>)}</tr></thead>
              <tbody>
                {signal.oddsData.map((o, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.borderLight}` }}>
                    <td style={{ padding: "6px 0", color: i === 0 ? C.navy : C.dark, fontWeight: i === 0 ? 700 : 400, fontSize: 11 }}>{o.book}</td>
                    <td style={{ padding: "6px 0", fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{o.odds.toFixed(2)}</td>
                    <td style={{ padding: "6px 0", color: C.muted }}>{o.implied.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 10, fontSize: 11, color: C.muted }}>The Odds API · 即時數據</div>
          </APIWindow>
          <APIWindow index="③" title="Polymarket 預測市場" locked={!canSeeVIP}>
            <div style={{ textAlign: "center", padding: "6px 0 12px" }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: C.win, fontFamily: "ui-monospace, monospace" }}>{signal.polymarket.yes}%</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>市場預測勝率</div>
            </div>
            <div style={{ background: C.borderLight, borderRadius: 4, height: 7, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ width: `${signal.polymarket.yes}%`, height: "100%", background: C.win }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted }}>
              <span>{signal.polymarket.volume}</span>
              <span style={{ color: C.win }}>{signal.polymarket.trend}</span>
            </div>
            <div style={{ marginTop: 10, padding: "7px 10px", background: "#ECFDF5", borderRadius: 5, fontSize: 11, color: C.win, fontWeight: 600 }}>
              vs 博彩差距：+{(signal.polymarket.yes - signal.impliedProb).toFixed(1)}%
            </div>
          </APIWindow>
        </div>

        {/* Basic Analysis */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>基本分析摘要</div>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, margin: 0 }}>{signal.brief}</p>
          {signal.isWC && signal.group && (
            <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>🏆 2026 FIFA 世界杯 · {signal.group} · {signal.venue}</div>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {signal.tags.map(t => (
              <span key={t} style={{ fontSize: 11, color: C.navy, background: "#EFF6FF", border: `1px solid #BFDBFE`, padding: "3px 10px", borderRadius: 4 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Result box */}
        {signal.result && (
          <div style={{ background: signal.status === "win" ? "#ECFDF5" : "#FEF2F2", border: `2px solid ${signal.status === "win" ? "#A7F3D0" : "#FECACA"}`, borderRadius: 10, padding: "16px 20px", marginBottom: 14, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 36 }}>{signal.status === "win" ? "✅" : "❌"}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: signal.status === "win" ? C.win : C.loss }}>
                {signal.status === "win" ? "信號命中" : "信號未中"} — 比分 {signal.result.score}
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{signal.result.detail}</div>
            </div>
          </div>
        )}

        {/* Data Sources */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>分析數據來源</span>
            <span style={{ fontSize: 11, color: C.muted }}>— 所有信號均基於以下公開數據，用戶可自行驗證</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 0 }}>
            {DATA_SOURCES.map((src, i) => {
              const typeColor = { sharp: C.navy, market: "#7C3AED", soft: C.muted, exchange: "#065F46", ai: C.amber, stats: "#0E7490" };
              const typeLabel = { sharp: "銳盤", market: "預測市場", soft: "軟盤", exchange: "交易所", ai: "AI分析", stats: "官方數據" };
              return (
                <div key={src.name} style={{ padding: "14px 16px", borderBottom: i < 3 ? `1px solid ${C.borderLight}` : "none", borderRight: !isMobile && i % 3 !== 2 ? `1px solid ${C.borderLight}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, color: C.dark, fontSize: 13 }}>{src.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: typeColor[src.type], background: typeColor[src.type] + "15", padding: "1px 7px", borderRadius: 3 }}>{typeLabel[src.type]}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{src.desc}</div>
                  <div style={{ fontSize: 10, color: C.navy, fontFamily: "ui-monospace, monospace" }}>{src.url}</div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "12px 16px", background: C.panelAlt, borderTop: `1px solid ${C.borderLight}`, fontSize: 11, color: C.mutedLight }}>
            ⓘ 本平台不為任何博彩公司背書。所有分析僅供參考，博彩在台灣受法律限制，請自行評估風險。
          </div>
        </div>
      </div>
    </div>
  );
}
