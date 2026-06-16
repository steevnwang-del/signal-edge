# SignalEdge Foundation Fix Patch

此包只包含可直接覆蓋到 GitHub repo 的檔案，不包含任何真實 API key。

## 修復內容

1. `/api/analyze` 改走 `/api/gateway → aiProvider`
2. 前端 AI 便捷方法改用 `aiProvider`，支援 Gemini/Groq fallback
3. `api/cron/generate-analysis.js` 改用 `lib/sources/aiProvider.js`
4. 後台手動 Cron 觸發補上 `x-admin-trigger: 1`
5. 停用 `api/test-gemini.js` 與 `api/test-gemini-full.js`，避免洩漏 key prefix
6. `AdminPanel` 前端鎖定 owner，不允許 UI 修改 owner 或建立 `super_admin`
7. `AIBox` 修正 `useState` side effect，改為 `useEffect`
8. 新增 `firestore.rules` 與 `firestore.indexes.json`
9. 新增 `.env.example`、部署 checklist、README
10. `src/services/firebase.js` 增加 Firebase config 防呆

## 覆蓋後必做

1. Push 到 GitHub
2. Vercel 重新部署
3. Firebase Console 部署/貼上 `firestore.rules`
4. Firestore 建立 indexes 或用 `firestore.indexes.json`
5. 到 Admin → API 設定 → 測試 AI Provider
6. 測試 Google 登入與 owner 權限

## 注意

目前 cron 仍用 Firebase Client SDK 寫 Firestore。正式上線前建議再升級 Firebase Admin SDK。
