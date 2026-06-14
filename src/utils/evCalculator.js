// SIGNALEDGE EV 計算引擎 - 所有數學計算在這裡，Gemini 只負責文字敘述

export const americanToDecimal = (am) => am > 0 ? am/100+1 : 100/Math.abs(am)+1;
export const toImplied = (decimal) => 1/decimal;

// 去水概率 - 移除莊家水錢得到真實市場概率
export const calcNoVig = (oddsArray) => {
  const implied = oddsArray.map(o => 1/o);
  const overround = implied.reduce((s,p) => s+p, 0);
  return implied.map(p => +(p/overround*100).toFixed(1));
};

// EV = 模型概率 × 賠率 - 1
export const calcEV = (modelProbPct, decimalOdds) =>
  +((modelProbPct/100 * decimalOdds - 1)*100).toFixed(1);

// Edge = 模型概率 - 去水市場概率（兩者都是%）
export const calcEdge = (modelPct, noVigPct) =>
  +(modelPct - noVigPct).toFixed(1);

// 最低可下注賠率（安全邊際 2%）
export const calcMinOdds = (modelPct, safetyPct = 2) =>
  +(1/((modelPct - safetyPct)/100)).toFixed(2);

// 建議注碼（0.25 Kelly）
export const calcStake = (edge, confidence = 65) => {
  if (edge < 2) return 0;
  const max = confidence >= 80 ? 1.0 : confidence >= 70 ? 0.75 : confidence >= 60 ? 0.5 : 0.25;
  const kelly = (edge/100) * 0.25;
  return Math.min(+(Math.max(0.25, Math.ceil(kelly*4)/4)).toFixed(2), max);
};

// 決策框架（Edge 都是百分比）
export const getDecision = (edge, dataComplete = 1, lineupOK = true) => {
  if (!lineupOK && edge < 7) return 'WAIT';
  if (dataComplete < 0.65) return 'WAIT';
  if (edge > 10) return 'REVIEW';
  if (edge >= 4) return 'BET';
  if (edge >= 2) return 'LEAN';
  return 'NO_BET';
};

export const DECISIONS = {
  BET:    { label:'BET',    zh:'可下注',   color:'#059669', bg:'#ECFDF5', border:'#A7F3D0' },
  LEAN:   { label:'LEAN',   zh:'輕微優勢', color:'#D97706', bg:'#FFFBEB', border:'#FDE68A' },
  WAIT:   { label:'WAIT',   zh:'等待確認', color:'#6B7280', bg:'#F6F7FA', border:'#D4D8DF' },
  NO_BET: { label:'NO BET', zh:'無EV',     color:'#DC2626', bg:'#FEF2F2', border:'#FECACA' },
  REVIEW: { label:'REVIEW', zh:'確認數據', color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE' },
};

// 莊家水錢計算
export const calcOverround = (oddsArray) => {
  const sum = oddsArray.map(o=>1/o).reduce((s,p)=>s+p,0);
  return +((sum-1)*100).toFixed(2);
};
