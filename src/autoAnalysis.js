const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

// ── Prompt 模板 ────────────────────────────────────────────────────────────────
const PROMPTS = {
  soccer_match: (data) =>
    `你是專業足球數據分析師。根據以下數據，用繁體中文生成200字以內的賽前分析報告。
    以數據為基礎，客觀描述兩隊實力差距、關鍵因素、值得關注的統計亮點。
    不做任何投注建議，不保證結果。
    
    賽事：${data.home} vs ${data.away}
    主隊近況：${data.homeForm}，場均進球：${data.homeGoals}，場均失球：${data.homeConc}
    客隊近況：${data.awayForm}，場均進球：${data.awayGoals}，場均失球：${data.awayConc}
    模型預測主隊勝率：${data.homeWinProb}%
    ${data.keyNote ? '補充：' + data.keyNote : ''}`,

  basketball_match: (data) =>
    `你是專業籃球數據分析師。根據以下數據，用繁體中文生成200字以內的賽前分析。
    以數據說話，描述兩隊攻守差異、關鍵球員狀態影響、歷史交手趨勢。
    不做任何投注建議。
    
    賽事：${data.home} vs ${data.away}
    主隊：近況${data.homeForm}，場均得分${data.homeOffense}，場均失分${data.homeDefense}
    客隊：近況${data.awayForm}，場均得分${data.awayOffense}，場均失分${data.awayDefense}
    傷病：${data.injuries || '無重大傷病報告'}`,

  esports_match: (data) =>
    `你是專業電競數據分析師。根據以下數據，用繁體中文生成200字以內的賽前分析。
    重點分析兩隊本賽季數據差異、選手狀態、對陣歷史。
    不做任何投注建議。
    
    賽事：${data.home} vs ${data.away}，賽制：${data.format || 'BO5'}
    ${data.home}近況：${data.homeForm}，勝率：${data.homeWinRate}%
    ${data.away}近況：${data.awayForm}，勝率：${data.awayWinRate}%
    ${data.keyNote ? '重點：' + data.keyNote : ''}`,

  player: (data) =>
    `你是專業運動數據分析師。根據以下選手統計數據，用繁體中文生成150字以內的客觀分析。
    描述選手相較聯盟平均的優勢與弱點，以具體數據支撐，不做主觀評語。
    
    選手：${data.name}（${data.team}，${data.position}）
    ${Object.entries(data.stats).map(([k,v]) => `${k}: ${v}`).join('，')}`,

  team: (data) =>
    `你是專業戰術分析師。根據以下隊伍數據，用繁體中文生成200字以內的戰術分析。
    包含戰術風格、核心優勢、潛在弱點。不做預測性保證。
    
    隊伍：${data.name}（${data.league}）
    近5場：${data.form}
    關鍵數據：${Object.entries(data.stats).map(([k,v]) => `${k} ${v}`).join('，')}`,
};

// ── 呼叫 Gemini API ────────────────────────────────────────────────────────────
const callGemini = async (prompt) => {
  const key = process.env.GEMINI_API_KEY;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
      }),
    }
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

// ── 每日自動生成（台灣時間早上 6 點 = UTC 22:00 前一天） ─────────────────────
exports.dailyAutoAnalysis = onSchedule('0 22 * * *', async () => {
  console.log('[AutoAnalysis] 開始每日自動分析生成...');

  // 1. 讀取 Firestore 中今明兩天的待分析賽事
  const now = new Date();
  const twoDaysLater = new Date(now.getTime() + 48 * 3600 * 1000);

  const matchesSnap = await db.collection('matches')
    .where('matchTime', '>=', now)
    .where('matchTime', '<=', twoDaysLater)
    .where('analysisStatus', '==', 'pending')
    .get();

  console.log(`[AutoAnalysis] 找到 ${matchesSnap.size} 場待分析賽事`);

  // 2. 讀取 Prompt 設定（admin 在 Firestore 設定的模板開關）
  const settingsDoc = await db.collection('settings').doc('autoAnalysis').get();
  const settings = settingsDoc.data() || {};
  const requireReview = settings.requireReview ?? false;

  // 3. 對每場賽事生成分析
  const batch = db.batch();
  let count = 0;

  for (const doc of matchesSnap.docs) {
    const match = doc.data();
    try {
      const sport = match.sport || 'soccer';
      const promptFn = PROMPTS[`${sport}_match`] || PROMPTS.soccer_match;
      const prompt = promptFn(match.analysisData || match);
      const analysis = await callGemini(prompt);

      batch.update(doc.ref, {
        analysis,
        analysisStatus: requireReview ? 'review' : 'published',
        analysisGeneratedAt: new Date(),
      });
      count++;

      // 避免超過 Gemini 速率限制
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`[AutoAnalysis] 賽事 ${doc.id} 生成失敗:`, err);
    }
  }

  await batch.commit();
  console.log(`[AutoAnalysis] 完成，已生成 ${count} 份分析`);
});

// ── 新賽事加入時自動觸發 ──────────────────────────────────────────────────────
exports.onMatchCreated = onDocumentCreated('matches/{matchId}', async (event) => {
  const match = event.data.data();
  if (!match.analysisData) return; // 沒有分析數據就跳過

  try {
    const sport = match.sport || 'soccer';
    const promptFn = PROMPTS[`${sport}_match`] || PROMPTS.soccer_match;
    const analysis = await callGemini(promptFn(match.analysisData));

    await event.data.ref.update({
      analysis,
      analysisStatus: 'published',
      analysisGeneratedAt: new Date(),
    });
    console.log(`[AutoAnalysis] 新賽事 ${event.params.matchId} 分析已生成`);
  } catch (err) {
    console.error('[AutoAnalysis] 新賽事分析失敗:', err);
  }
});
