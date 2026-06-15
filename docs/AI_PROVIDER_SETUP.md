# AI Provider 設定指南

## 快速設定（推薦）

在 Vercel → Settings → Environment Variables 設定以下變數：

| 變數名 | 值 | 說明 |
|--------|-----|------|
| `AI_PROVIDER` | `auto` | 自動：Gemini 失敗自動切 Groq |
| `GEMINI_API_KEY` | `AIzaSy...` | 從 aistudio.google.com 取得 |
| `GROQ_API_KEY` | `gsk_...` | 從 console.groq.com 取得（免費） |

設定後點 **Redeploy**。

---

## 取得 Gemini API Key（正確方式）

1. 前往 https://aistudio.google.com/app/apikey
2. 點「Create API key in new project」
3. 複製 key，格式應為 `AIzaSy...`

⚠️ 注意：
- `AQ.Ab8...` 格式是 OAuth Bearer token，**短期有效，不適合長期使用**
- 應取得 `AIzaSy...` 格式的 API key
- 不需要開通計費，免費版每天 1500 次足夠

---

## 取得 Groq API Key（備用）

1. 前往 https://console.groq.com
2. 登入 → API Keys → Create API key
3. 格式為 `gsk_...`

免費版：每天 14,400 次（夠用）

---

## 診斷 AI 連線

部署後訪問：
```
POST /api/gateway
{ "source": "aiProvider", "action": "diagnose", "params": {} }
```

成功回應：
```json
{
  "ok": true,
  "active_provider": "gemini",
  "gemini": { "ok": true, "active_model": "gemini-2.5-flash" },
  "groq":   { "ok": true, "active_model": "llama-3.3-70b-versatile" }
}
```

---

## AI Provider 優先順序

```
AI_PROVIDER=auto（預設）：
  ↓ 先試 Gemini（若有 GEMINI_API_KEY）
  ↓ Gemini 失敗 → 自動切 Groq（若有 GROQ_API_KEY）
  ↓ 兩者都失敗 → 回傳詳細錯誤

AI_PROVIDER=gemini：只用 Gemini，失敗就失敗
AI_PROVIDER=groq：只用 Groq，失敗就失敗
```

---

## 模型選擇

Gemini 會動態呼叫 ListModels API 找最新可用的 flash 模型，**不寫死**。
若要強制指定：`GEMINI_MODEL=gemini-2.5-flash`

Groq 預設模型順序：llama-3.3-70b-versatile → llama-3.1-70b-versatile → llama-3.1-8b-instant
若要強制指定：`GROQ_MODEL=llama-3.3-70b-versatile`
