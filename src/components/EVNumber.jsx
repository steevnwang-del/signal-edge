import { C } from '../constants/colors';
export const EVNumber = ({ ev, size = 28 }) => (
  <span style={{ fontSize: size, fontWeight: 800, letterSpacing: -0.5, color: ev > 0 ? C.win : C.loss, fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, 'SF Mono', monospace" }}>
    {ev > 0 ? "+" : ""}{ev.toFixed(1)}%
  </span>
);
