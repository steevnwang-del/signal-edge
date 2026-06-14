/**
 * 每日自動分析生成 Cron Job
 * 台灣時間早上 6 點執行（vercel.json: "0 22 * * *"）
 */
import { default as geminiSource } from '../../lib/sources/gemini.js';
import { default as footballSource } from '../../lib/sources/football.js';
import { default as nbaSource } from '../../lib/sources/nba.js';
import { default as newsSource } from '../../lib/sources/news.js';

const TODAY_MATCHES = [
  { id:'wc_bra_mar', sport:'soccer', home:'巴西', away:'摩洛哥', homeForm:'W W D W W', awayForm:'W L W W D', homeGoals:2.1, awayGoals:0.8, homeConc:0.7, awayConc:1.2, homeWinProb:67, keyNote:'' },
  { id:'wc_fra_sen', sport:'soccer', home:'法國', away:'塞內加爾', homeForm:'W W L W D', awayForm:'W W L W W', homeGoals:1.7, awayGoals:1.2, homeConc:0.9, awayConc:1.0, homeWinProb:52, keyNote:'法國 Griezmann 傷況存疑' },
  { id:'lck_t1_geng', sport:'esports', game:'LOL', format:'BO5', home:'T1', away:'Gen.G', homeForm:'W W W W W', awayForm:'W W L W W', homeWinRate:78, awayWinRate:72, keyNote:'Faker 本賽季個人評分最高值' },
];

export default async function handler(req, res) {
  console.log('[Cron] 每日分析生成開始', new Date().toISOString());
  const results = [];

  for (const match of TODAY_MATCHES) {
    try {
      const promptData = match.sport === 'soccer'
        ? `賽事：${match.home} vs ${match.away}\n主隊近況：${match.homeForm}，場均進球：${match.homeGoals}，場均失球：${match.homeConc}\n客隊近況：${match.awayForm}，場均進球：${match.awayGoals}，場均失球：${match.awayConc}\n模型預測主隊勝率：${match.homeWinProb}%\n補充：${match.keyNote}`
        : `遊戲：${match.game}，賽制：${match.format}\n${match.home} vs ${match.away}\n${match.home}近況：${match.homeForm}，勝率：${match.homeWinRate}%\n${match.away}近況：${match.awayForm}，勝率：${match.awayWinRate}%\n重點：${match.keyNote}`;

      const type = match.sport === 'soccer' ? 'match' : 'esports_match';
      const { analysis } = await geminiSource.analyze({ prompt: promptData, type }, process.env);

      // TODO: 串接 Firestore 後存入
      // await db.collection('matches').doc(match.id).update({ analysis, analysisGeneratedAt: new Date(), analysisStatus: 'published' });

      results.push({ id: match.id, success: true, chars: analysis.length });
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      results.push({ id: match.id, success: false, error: err.message });
    }
  }

  const summary = { generated: results.filter(r=>r.success).length, failed: results.filter(r=>!r.success).length, results };
  console.log('[Cron] 完成', summary);
  res.json({ success: true, ...summary, time: new Date().toISOString() });
}
