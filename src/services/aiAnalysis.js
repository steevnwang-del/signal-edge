// 統一 AI 分析入口 - 所有頁面透過 /api/gateway → aiProvider
// 注意：AI 只負責文字敘述，不負責計算 EV / 勝率 / 推薦決策。

export const getAIAnalysis = async (prompt, type = 'general') => {
  try {
    const r = await fetch('/api/gateway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'aiProvider',
        action: 'analyze',
        params: { prompt, type },
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.success === false) {
      throw new Error(data.error || `AI gateway failed: HTTP ${r.status}`);
    }

    return data.result?.analysis || data.analysis || '分析生成失敗';
  } catch (e) {
    console.warn('[AIAnalysis] failed:', e.message);
    return '目前無法連接 AI 分析服務，請稍後再試。';
  }
};

export const buildPlayerPrompt = (player, stats) =>
  `選手：${player.name}，隊伍：${player.team}，位置：${player.position || player.role}，運動：${player.sport}
` +
  `統計數據：${Object.entries(stats).map(([k,v]) => `${k}: ${v}`).join('，')}`;

export const buildTeamPrompt = (team, stats) =>
  `隊伍：${team.name}，聯賽：${team.league || team.region}，近期戰績：${team.form?.join(' ')}
` +
  `核心球員：${team.players?.slice(0,5).join('，')}
` +
  `統計：${Object.entries(stats).map(([k,v]) => `${k}: ${v}`).join('，')}`;

export const buildMatchPrompt = (home, away, odds) =>
  `主隊：${home.name}，客隊：${away.name}
` +
  `主隊近5場：${home.form?.join(' ')}，客隊近5場：${away.form?.join(' ')}
` +
  `市場賠率：主隊 ${odds?.home || 'N/A'}，客隊 ${odds?.away || 'N/A'}`;

export const buildComparePrompt = (a, b, sport) =>
  `運動：${sport}
` +
  `對象A：${a.name}（${a.team}）數據：${JSON.stringify(a.stats)}
` +
  `對象B：${b.name}（${b.team}）數據：${JSON.stringify(b.stats)}`;
