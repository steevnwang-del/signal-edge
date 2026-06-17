export const buildContentQualityReport = (db = {}) => {
  const coverage = db.sourceCoverage || {};
  const checks = [
    { key: 'odds', label: '賠率 / 市場', ok: coverage.odds === true, weight: 20 },
    { key: 'schedule', label: '賽程時間', ok: coverage.schedule === true, weight: 10 },
    { key: 'stats', label: '隊伍 / 球員資料', ok: coverage.stats === true, weight: 12 },
    { key: 'predictions', label: '外部預測', ok: coverage.predictions === true, weight: 10 },
    { key: 'foreignMasters', label: '國外分析大師', ok: coverage.foreignMasters === true, weight: 16 },
    { key: 'internationalInsights', label: '國際新聞 / 觀點', ok: coverage.internationalInsights === true, weight: 10 },
    { key: 'lineups', label: '陣容 / 先發', ok: coverage.lineups === true, weight: 12 },
    { key: 'oddsMovement', label: '盤口變化', ok: coverage.oddsMovement === true, weight: 10 },
  ];
  const earned = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  const max = checks.reduce((s, c) => s + c.weight, 0);
  const coverageScore = Math.round((earned / max) * 100);
  const score = Math.round((Number(db.dataCompleteness || 0) * 0.48) + (coverageScore * 0.32) + ((db.signalFusion?.alignmentScore || 0) * 0.2));
  return {
    score,
    coverageScore,
    checks,
    missing: checks.filter(c => !c.ok).map(c => c.label),
    strengths: checks.filter(c => c.ok).map(c => c.label),
    level: score >= 80 ? '高' : score >= 62 ? '中' : '低',
    note: score >= 80
      ? '本場資料密度足夠，可產出高品質賽前研究。'
      : score >= 62
      ? '本場已有主要資料，但仍有臨場資訊或部分來源缺口。'
      : '本場資料不足，建議以觀察與賽前確認為主。',
  };
};

export default { buildContentQualityReport };
