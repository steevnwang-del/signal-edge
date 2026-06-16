# SignalEdge 部署檢查清單

## 1. 不要提交任何秘密

確認 repo 沒有：

- `.env`
- `.env.local`
- Firebase service account JSON
- GitHub token
- Gemini / Groq / Odds API 真實 key

`.env.example` 只能放變數名稱，不放真實值。

## 2. Vercel Environment Variables

前端 Firebase：

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

後端 API：

- `ODDS_API_KEY`
- `AI_PROVIDER=auto`
- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-2.5-flash`
- `GROQ_API_KEY`
- `GROQ_MODEL=llama-3.1-8b-instant`
- `CRON_SECRET`

設定完一定要 Redeploy。

## 3. Firebase Auth

Firebase Console → Authentication → Sign-in method：

- 開啟 Google provider
- Authorized domains 加上正式 Vercel domain，例如 `signal-edge-hews.vercel.app`

## 4. Owner Admin

Owner email 固定在：

```txt
kelvinchen20000108@gmail.com
```

第一次 Google 登入後，`users/{uid}` 應為：

```json
{
  "email": "kelvinchen20000108@gmail.com",
  "role": "super_admin",
  "isOwner": true
}
```

## 5. Firestore Rules / Indexes

把根目錄：

- `firestore.rules`
- `firestore.indexes.json`

同步到 Firebase。也可以先在 Console 手動建立這 4 個 index：

- `analyses`: `status ASC`, `createdAt DESC`
- `analyses`: `sport ASC`, `createdAt DESC`
- `analyses`: `accessLevel ASC`, `createdAt DESC`
- `commissions`: `agentId ASC`, `createdAt DESC`

## 6. 測試順序

1. Google 登入
2. Owner 是否自動變 `super_admin`
3. `/api/gateway` GET 是否正常
4. Admin → API 設定 → AI Provider 測試
5. Admin → API 設定 → 手動生成分析
6. Dashboard 是否從 Firestore 讀到 analyses

## 7. 已知技術債

目前 `/api/cron/generate-analysis.js` 仍使用 Firebase Client SDK 寫 Firestore。正式上線建議升級為 Firebase Admin SDK，避免 Firestore Rules 與 server 寫入權限互相牽制。
