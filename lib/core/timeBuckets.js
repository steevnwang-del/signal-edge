const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const taipeiDateKey = (date = new Date()) => {
  const d = new Date(new Date(date).getTime() + TAIPEI_OFFSET_MS);
  return d.toISOString().slice(0, 10);
};

export const taipeiWindow = (date = new Date()) => {
  const key = taipeiDateKey(date);
  const startUtc = new Date(`${key}T00:00:00.000+08:00`).getTime();
  // Include after-midnight games that still belong to the Taiwan viewing night.
  const endUtc = startUtc + DAY_MS + 4 * 60 * 60 * 1000;
  return { key, start: new Date(startUtc), end: new Date(endUtc) };
};

export const classifyByTaipeiDay = (iso, now = new Date()) => {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 'unknown';
  const { start, end } = taipeiWindow(now);
  const startMs = start.getTime();
  const endMs = end.getTime();
  const nowMs = new Date(now).getTime();
  if (t < startMs) return 'past';
  if (t < nowMs - 4 * 60 * 60 * 1000) return 'past';
  if (t >= startMs && t < endMs) return 'today';
  return 'future';
};

export const formatTaipeiTime = (iso) => {
  try {
    return new Date(iso).toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
    }) + ' 台灣';
  } catch { return ''; }
};

export default { taipeiDateKey, taipeiWindow, classifyByTaipeiDay, formatTaipeiTime };
