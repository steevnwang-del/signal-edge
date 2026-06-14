// 統一 AI 分析入口 - 所有頁面透過這裡呼叫 /api/analyze
export const getAIAnalysis = async (prompt, type = 'general') => {
  try {
    const r = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type }),
    });
    const data = await r.json();
    return data.analysis || '分析生成失敗';
  } catch {
    return '目前無法連接AI分析服務，請稍後再試。';
  }
};

export const buildPlayerPrompt = (player, stats) =>
  `選手：${player.name}，隊伍：${player.team}，位置：${player.position || player.role}，運動：${player.sport}\n` +
  `統計數據：${Object.entries(stats).map(([k,v]) => `${k}: ${v}`).join('，')}`;

export const buildTeamPrompt = (team, stats) =>
  `隊伍：${team.name}，聯賽：${team.league || team.region}，近期戰績：${team.form?.join(' ')}\n` +
  `核心球員：${team.players?.slice(0,5).join('，')}\n` +
  `統計：${Object.entries(stats).map(([k,v]) => `${k}: ${v}`).join('，')}`;

export const buildMatchPrompt = (home, away, odds) =>
  `主隊：${home.name}，客隊：${away.name}\n` +
  `主隊近5場：${home.form?.join(' ')}，客隊近5場：${away.form?.join(' ')}\n` +
  `市場賠率：主隊 ${odds?.home || 'N/A'}，客隊 ${odds?.away || 'N/A'}`;

export const buildComparePrompt = (a, b, sport) =>
  `運動：${sport}\n` +
  `對象A：${a.name}（${a.team}）數據：${JSON.stringify(a.stats)}\n` +
  `對象B：${b.name}（${b.team}）數據：${JSON.stringify(b.stats)}`;
