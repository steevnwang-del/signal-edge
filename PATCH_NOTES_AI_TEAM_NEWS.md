# SignalEdge Bugfix v2 — AI Quality + TeamAnalysis + NewsPage

## Fixed

### 1. AI analysis too short / not following prompt
- Reworked `lib/sources/gemini.js` and `lib/sources/groq.js` prompt wrappers.
- Removed hard 150/200-word style constraints for match/team/player analysis.
- Match analysis now requests a fuller 320–520 Traditional Chinese analysis.
- Added required sections:
  - 一句話結論
  - 模型解讀
  - 關鍵風險
  - 賽前確認
  - SignalEdge 判斷
- Increased output token budget.
- Lowered temperature for more stable, less random answers.
- Kept safety rules: no fabricated EV/probability, no guaranteed betting wording.

### 2. TeamAnalysis World Cup blank
- Replaced unstable football-data World Cup team endpoint with static 2026 World Cup group/team data.
- This prevents blank pages while API providers do not reliably expose 2026 teams.
- Added all 48 teams from groups A–L as current static content.

### 3. TeamAnalysis NBA blank
- Removed the first Ball Don't Lie request that used an empty Authorization header and caused 401 failures.
- NBA teams now load directly from ESPN unofficial API.
- Added try/catch and safer JSON parsing to avoid one failed API breaking the entire page.

### 4. LOL teams missing
- Expanded LOL static team list across LCK, LPL, LEC, LCS, PCS/VCS/CBLOL.
- Added basic core-player display fallback.

### 5. NewsPage links not opening
- Rebuilt RSS parser in `lib/sources/news.js`.
- Supports:
  - `<link>url</link>`
  - `<link><![CDATA[url]]></link>`
  - Atom `<link href="url" />`
  - unusual `<link/>url` feed format
  - URL fallback from item block
- NewsPage now disables click only if no valid URL exists instead of linking to `#`.

### 6. News title translation
- `news.getLatest` now accepts `translate:true` and uses `aiProvider.translateTitles` server-side.
- NewsPage requests translated headlines through `/api/gateway` without exposing AI keys.
- If AI is not configured, it falls back to English titles.

### 7. Cron analysis quality
- Cron DATA_BLOCK prompt now includes more context and no longer asks for a 150-character/short answer.
- Explicitly marks current EV as a market no-vig placeholder until true modelProbability is implemented.

## Files included
- `lib/sources/gemini.js`
- `lib/sources/groq.js`
- `lib/sources/news.js`
- `src/pages/TeamAnalysis.jsx`
- `src/pages/NewsPage.jsx`
- `api/cron/generate-analysis.js`
- `src/services/apiGateway.js`
- `src/services/aiAnalysis.js`
- `src/pages/admin/PromptSettings.jsx`

## Build result
`npm run build` passed locally.
