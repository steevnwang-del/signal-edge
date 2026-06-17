# SignalEdge V6D

繁體中文運動賽事預測、賠率價值分析與國際觀點整理工具。

## 核心定位

SignalEdge 不是報牌平台。AI 只負責把後端 `DATA_BLOCK` 寫成中文分析；勝率、EV、fair odds、最低參考價、比分分布與決策都必須由後端模型與資料流程計算。

## V6D 重點

- 國際觀點頁：`/insights`
- 國際觀點快取 API：`/api/cron/refresh-insights`
- 世界盃 Elo + Dixon-Coles/Poisson proxy：`lib/core/worldCupElo.js`
- 靜態 Elo priors：`lib/core/eloRatings.js`
- `generate-analysis` 整合 The Odds API、`predictions.js`、國際觀點快取與 DATA_BLOCK
- MSI / LOL 無賠率時保留賽事，但強制 `WAIT`，不計算投注 EV
- `gateway` 已封鎖前台直接呼叫 `aiProvider` / `gemini` / `groq`

## 開發

```bash
npm install
npm run dev
```

## 部署必要環境變數

前台 Firebase：

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Server-side：

```text
FIREBASE_SERVICE_ACCOUNT_JSON
ODDS_API_KEY
GEMINI_API_KEY 或 GROQ_API_KEY
CRON_SECRET
API_SPORTS_KEY 或 API_FOOTBALL_KEY
```

可選：

```text
BSD_API_KEY
ADMIN_API_SECRET
NEWS_API_KEY
```

## 安全

不要提交任何 API key、GitHub token、Firebase service account 或 `.env`。所有 AI provider 只能由 server/cron/admin secret 呼叫，前台只讀 Firestore 快取。
