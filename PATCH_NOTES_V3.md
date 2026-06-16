# SignalEdge Bugfix v3

本包修復你回報的問題：Firebase/Firestore 被 rules 擋住、AI 分析短且像沒吃 prompt、新聞頁卡住、隊伍頁資料不足、賽事分析頁運動分類消失、回測沒有舊資料可測。

## 覆蓋檔案

- package.json
- firestore.rules
- api/cron/generate-analysis.js
- lib/server/firebaseAdmin.js
- lib/sources/news.js
- src/services/firebase.js
- src/services/firestore.js
- src/pages/Dashboard.jsx
- src/pages/TeamAnalysis.jsx
- src/pages/NewsPage.jsx
- src/pages/admin/BacktestPanel.jsx

## 重點修復

1. Cron 寫 Firestore 改成優先使用 Firebase Admin SDK。
   - 需要在 Vercel 設 FIREBASE_SERVICE_ACCOUNT_JSON。
   - 沒設時會 fallback client SDK，但會受 Firestore Rules 限制。

2. Firestore Rules 保留 owner 保護，不再影響前端初始化。
   - kelvinchen20000108@gmail.com 仍是最高 owner。
   - 其他 admin 不能修改 owner 或建立 super_admin。

3. AI 分析頁改用 aiProvider + type=match。
   - Dashboard 手動生成 AI 會走 match prompt。
   - 輸出要求固定結構：一句話結論、模型解讀、關鍵風險、賽前確認、SignalEdge 判斷。

4. Dashboard 不再因 Firestore 有少量資料就跳過 The Odds API。
   - 會合併 Firestore + live odds + demo watchlist。
   - 分類固定保留 世界杯 / MLB / MSI 2026 / LOL 電競。

5. TeamAnalysis 增加 MSI 2026 隊伍與更多 LOL 隊伍。
   - 世界杯 48 隊靜態資料。
   - MSI 2026 11 隊觀察名單。
   - LOL 主要賽區隊伍超過 30 隊。
   - NBA/MLB 保留公開 API。

6. NewsPage 修 RSS 卡住與原文連結問題。
   - 加 timeout。
   - 支援 RSS link href / guid / feedburner。
   - 失敗時顯示 fallback，不會無限 loading。

7. BacktestPanel 可用 mockData 舊資料示範回測。
   - Firestore 無資料時自動用 mockData。
   - Firestore 有 analyses 後自動切正式資料。

## 部署後必做

1. npm install 會新增 firebase-admin。
2. Vercel 新增：FIREBASE_SERVICE_ACCOUNT_JSON。
3. Firebase Console 重新貼上 firestore.rules。
4. Vercel redeploy。
5. Admin → API 設定 → 測 aiProvider。
6. Admin → 更新分析。

## 注意

目前 Dashboard 裡面的 EV 仍標註為展示 EV，還不是正式 Poisson/Elo 模型 EV。下一步才做 oddsMath / Poisson / Elo / backtest CLV。
