import { C } from '../constants/colors';
export const StrengthDots = ({ n }) => (
  <span style={{ display: "inline-flex", gap: 3 }}>
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i <= n ? C.amber : C.borderLight, display: "inline-block" }} />
    ))}
  </span>
);
