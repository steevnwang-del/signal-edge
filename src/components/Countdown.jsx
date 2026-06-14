import { useState, useEffect } from 'react';
import { C } from '../constants/colors';
export const Countdown = ({ matchTimestamp }) => {
  const [remaining, setRemaining] = useState(matchTimestamp - Date.now());
  useEffect(() => {
    const id = setInterval(() => setRemaining(matchTimestamp - Date.now()), 1000);
    return () => clearInterval(id);
  }, [matchTimestamp]);
  if (remaining <= 0) return <span style={{ color: C.amber, fontSize: 11, fontWeight: 700 }}>結算中...</span>;
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.navy, fontWeight: 700 }}>{h > 0 ? `${h}h ` : ""}{m}m {s}s</span>;
};
