# SignalEdge V6G

SignalEdge V6G 是「賽事情報決策引擎」版本。

核心能力：

- 國外分析大師情報庫與賽事大師牆
- 每場賽事高機率方向與進階價值判斷雙軌輸出
- probabilityScore / valueScore / riskScore 三分數
- bettingConditions 下注條件與放棄條件
- contentQuality 內容質量分數
- signalFusion 訊號一致性分數
- 支援足球、LOL、NBA、MLB、網球、F1
- AI 僅能讀 DATA_BLOCK，不可自行創造勝率、EV、比分、傷病、陣容或大師推薦

部署後建議先由管理員依序觸發：

1. `/api/cron/refresh-insights`
2. `/api/cron/refresh-foreign-masters`
3. `/api/cron/generate-analysis`

正式 zip 僅包含 GitHub / Vercel 需要的正式檔案，不包含 env、node_modules、docs、PATCH_NOTES 或測試金鑰檔。
