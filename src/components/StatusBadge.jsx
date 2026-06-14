import { C } from '../constants/colors';
export const StatusBadge = ({ status }) => {
  const map = {
    pending: { label: "進行中", bg: "#EFF6FF", color: C.navy },
    win: { label: "✓ 勝", bg: "#ECFDF5", color: C.win },
    loss: { label: "✗ 負", bg: "#FEF2F2", color: C.loss },
  };
  const s = map[status] || map.pending;
  return <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 4, letterSpacing: 0.5 }}>{s.label}</span>;
};
