# SignalEdge

繁體中文運動賽事預測、賠率價值分析與台灣運彩比價工具。

## 核心定位

SignalEdge 不是報牌平台。AI 只負責中文摘要，勝率、EV、賠率價值與決策應由後端模型與資料流程計算。

## 開發

```bash
npm install
npm run dev
```

## 部署

請先閱讀：

- `docs/DEPLOYMENT_CHECKLIST.md`
- `docs/AI_PROVIDER_SETUP.md`

## 安全

不要提交任何 API key、GitHub token、Firebase service account 或 `.env`。

Firebase Web config 使用 `VITE_FIREBASE_*`；Gemini、Groq、Odds、Stripe 等 server-side keys 不要加 `VITE_`。
