# SIGNALEDGE — 台灣首個專業運動分析平台

## 技術架構
- **前端**: React 18 + Vite 5
- **路由**: State-based（串接 React Router 6 後升級）
- **資料庫**: Firebase Firestore（MVP 階段用 mockData.js）
- **身份驗證**: Firebase Auth（含 LINE Login 預留）
- **部署**: Vercel（GitHub 自動 CI/CD）

## 開發流程
```bash
npm install
npm run dev        # 本地開發 http://localhost:5173
npm run build      # 打包
```

## 環境變數設定
複製 `.env.example` 為 `.env`，填入真實值：
```
cp .env.example .env
```
**重要：`.env` 永遠不要 commit 到 GitHub**

## 檔案結構說明
```
src/
├── constants/     ← 顏色、Mock數據（串接Firebase後移除mockData.js）
├── hooks/         ← 自定義 hooks
├── components/    ← 可重複使用的小元件
├── pages/         ← 每個頁面獨立檔案
│   └── admin/    ← 管理後台（tab 拆成獨立檔案）
└── services/      ← Firebase 串接函數
```

## 角色系統
| 角色 | 說明 |
|------|------|
| guest | 未登入訪客 |
| free | 免費用戶（每日3個信號）|
| vip | VIP用戶（所有信號+AI分析）|
| agent | 代理（推廣+佣金）|
| admin | 管理員（全平台控制）|

## TODO（MVP後）
- [ ] Firebase Auth 串接
- [ ] LINE Login 整合
- [ ] Firestore 安全規則
- [ ] The Odds API 串接
- [ ] AI 分析 API 串接
- [ ] Polymarket API 串接
