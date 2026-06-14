import { useState, useEffect, useRef } from 'react';
import { AUTO_RESULTS } from '../constants/mockData';

const SETTLE_DELAY = 30 * 1000; // Demo: 30秒 | Production: 7200000 (2小時)

export const useAutoSettle = (initSignals) => {
  const [signals, setSignals] = useState(() => initSignals.map(s => ({ ...s })));
  const [justSettled, setJustSettled] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      let settledId = null;

      setSignals(prev => {
        let changed = false;
        const next = prev.map(s => {
          if (s.status === 'pending' && s.matchTimestamp && now > s.matchTimestamp + SETTLE_DELAY) {
            const result = AUTO_RESULTS[s.id];
            if (result) {
              changed = true;
              settledId = s.id;
              return { ...s, ...result };
            }
          }
          return s;
        });
        return changed ? next : prev;
      });

      // 在 setSignals 外部呼叫，避免 React 反模式
      if (settledId !== null) {
        setJustSettled(settledId);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setJustSettled(null), 4000);
      }
    };

    tick();
    const id = setInterval(tick, 5000);
    return () => {
      clearInterval(id);
      clearTimeout(timerRef.current);
    };
  }, []);

  return { signals, justSettled };
};
