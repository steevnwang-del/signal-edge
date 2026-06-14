export default async function handler(req, res) {
  // Vercel 自動驗證 cron 請求
  const matches = [
    { id: 'wc_brazil_morocco', sport: 'soccer',
      home: '巴西', away: '摩洛哥',
      homeForm: 'W W D W W', awayForm: 'W L W W D',
      homeGoals: 2.1, awayGoals: 0.8, homeWinProb: 67 },
    { id: 'nba_celtics_heat', sport: 'basketball',
      home: '塞爾提克', away: '熱火',
      homeForm: 'W W L W W', awayForm: 'L W W D W',
      homeOffense: 118.4, homeDefense: 108.2,
      awayOffense: 112.1, awayDefense: 114.8 },
  ];

  const PROMPTS = {
    soccer: (d) => `你是專業足球數據分析師。根據以下數據，用繁體中文生成150字以內的賽前分析。不做任何投注建議。\n\n${d.home} vs ${d.away}\n主隊近況：${d.homeForm}，場均進球：${d.homeGoals}\n客隊近況：${d.awayForm}，場均進球：${d.awayGoals}\n模型預測主隊勝率：${d.homeWinProb}%`,
    basketball: (d) => `你是專業籃球數據分析師。根據以下數據，用繁體中文生成150字以內的賽前分析。不做任何投注建議。\n\n${d.home} vs ${d.away}\n主隊：近況${d.homeForm}，場均得分${d.homeOffense}，失分${d.homeDefense}\n客隊：近況${d.awayForm}，場均得分${d.awayOffense}，失分${d.awayDefense}`,
  };

  const results = [];

  for (const match of matches) {
    try {
      const prompt = PROMPTS[match.sport]?.(match);
      if (!prompt) continue;

      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 400 } }) }
      );
      const data = await r.json();
      const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // 存到 Firestore（串接後啟用）
      // await db.collection('matches').doc(match.id).update({ analysis, analysisGeneratedAt: new Date() });

      results.push({ id: match.id, status: 'success', preview: analysis.slice(0, 50) + '...' });
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      results.push({ id: match.id, status: 'error', error: err.message });
    }
  }

  res.json({ success: true, generated: results.length, results, time: new Date().toISOString() });
}
