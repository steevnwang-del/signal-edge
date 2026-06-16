const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
const round = (n, d = 1) => +Number(n || 0).toFixed(d);

export const computeDataCompleteness = ({ sport, hasOdds, hasKickoff, hasTeamNames, hasStats = false, hasLineups = false, hasScores = false, hasEsportsSchedule = false } = {}) => {
  let score = 0;
  if (hasTeamNames) score += 18;
  if (hasKickoff) score += 18;
  if (hasOdds) score += 28;
  if (hasStats) score += 16;
  if (hasLineups) score += 12;
  if (hasScores) score += 4;
  if (sport === '電競' || sport === 'MSI 2026' || sport === 'LOL 電競') score += hasEsportsSchedule ? 8 : -12;
  return clamp(score, 25, 96);
};

export const riskLevel = ({ dataCompleteness = 50, overround = 0, kickoffHours = 48, sport = '' } = {}) => {
  let risk = 50;
  risk += dataCompleteness < 60 ? 18 : dataCompleteness > 80 ? -10 : 0;
  risk += overround > 8 ? 10 : overround > 5 ? 5 : 0;
  risk += kickoffHours > 72 ? 6 : kickoffHours < 8 ? -3 : 0;
  risk += /電競|MSI|LOL/.test(sport) ? 8 : 0;
  return clamp(risk, 10, 95);
};

export const confidenceScore = ({ dataCompleteness = 60, edgePct = 0, evPct = 0, risk = 50, decision = 'WAIT' } = {}) => {
  let score = 38;
  score += dataCompleteness * 0.34;
  score += clamp(edgePct, -8, 10) * 1.2;
  score += clamp(evPct, -10, 12) * 0.75;
  score -= risk * 0.18;
  if (decision === 'BET') score += 6;
  if (decision === 'NO_BET') score -= 6;
  return clamp(round(score, 0), 30, 88);
};

export const decisionLabel = (decision) => ({ BET:'可關注', LEAN:'偏向觀察', WAIT:'等待確認', NO_BET:'不建議追價' }[decision] || '等待確認');

export default { computeDataCompleteness, riskLevel, confidenceScore, decisionLabel };
