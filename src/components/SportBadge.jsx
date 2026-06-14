import { C } from '../constants/colors';
export const SportBadge = ({ sport }) => {
  const colors = { NBA: C.navy, 足球: "#065F46", MLB: "#7C2D12", 世界杯: "#064E3B" };
  return (
    <span style={{ background: colors[sport] || C.navy, color: C.white, fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "2px 7px", borderRadius: 3 }}>
      {sport}
    </span>
  );
};
