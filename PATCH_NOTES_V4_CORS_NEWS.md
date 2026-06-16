# SignalEdge Bugfix v4 — CORS / News Timeout / TeamAnalysis Gateway

## 修正重點

### 1. TeamAnalysis NBA CORS
前端原本直接呼叫：
`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams`

ESPN 沒有提供 `Access-Control-Allow-Origin` 給瀏覽器，所以 production 會被 CORS 擋。

v4 改成：
前端 `TeamAnalysis.jsx` → `/api/gateway` → `lib/sources/nba.js` → ESPN server-side

新增 actions：
- `nba.getTeams`
- `nba.getTeamRoster`

### 2. TeamAnalysis MLB 也改走 Gateway
避免未來 MLB API 也遇到瀏覽器端 CORS 或網路不穩。

新增 actions：
- `mlb.getTeams`
- `mlb.getTeamRoster`

### 3. NewsPage signal aborted without reason
前端原本用 `AbortController.abort()`，會在 console 顯示：
`signal is aborted without reason`

v4 改成 Promise timeout，不再把 abort signal 傳入 fetch。

### 4. News RSS 更穩
`lib/sources/news.js` 改成：
- 每個 RSS feed 獨立 timeout
- `Promise.allSettled`，單一來源失敗不影響整頁
- RSS / Atom link parser 更完整
- 標題翻譯改成 safe mode，最多先翻前 8 則，避免 AI 翻譯拖慢整頁

### 5. apiGateway helper 更新
新增：
- `NBA.teams()`
- `NBA.roster(teamId)`
- `MLB.teams(season)`
- `MLB.roster(teamId, season)`
- `News.latest(limit, sources, options)` 可帶 `translate:'safe'`

## 覆蓋檔案

- `src/pages/TeamAnalysis.jsx`
- `src/pages/NewsPage.jsx`
- `src/services/apiGateway.js`
- `lib/sources/nba.js`
- `lib/sources/mlb.js`
- `lib/sources/news.js`
- `PATCH_NOTES_V4_CORS_NEWS.md`

## 測試結果

本地已執行：

```bash
npm run build
```

結果：build 成功。只有 bundle size warning，不影響部署。

## 部署後測試

1. 進「隊伍分析」→ NBA：不應再看到 ESPN CORS error。
2. 打開 NBA 球隊：名單應由 gateway 載入。
3. 進「隊伍分析」→ MLB：球隊應正常載入。
4. 進「新聞」：不應再卡在 loading，也不應再出現 `signal is aborted without reason`。
5. 如果 RSS / AI 暫時慢，新聞頁會顯示 fallback，不會整頁空白。
