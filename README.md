# SignalEdge V6F

V6F focuses on **content quality + Foreign Analyst Masters Intelligence**.

## Key upgrades

- Full automatic foreign analyst intelligence cache
  - `api/cron/refresh-foreign-masters.js`
  - `lib/sources/foreignMastersDirectory.js`
  - `lib/sources/foreignMasters.js`
- Event-level Foreign Masters Wall
  - matched public RSS / metadata posts
  - optional admin short-excerpt manual boosts
  - consensus direction, conflict level and usable source count
- Content quality engine
  - data completeness
  - source coverage
  - signal alignment score
  - quality score and tags
- Six sport families supported at the model / content layer
  - Soccer / football
  - LOL / esports
  - NBA
  - MLB
  - Tennis
  - F1
- AI is still DATA_BLOCK-only
  - no invented win rates
  - no invented EV / scores / injuries / lineups
  - no invented analyst picks
  - no full-text copying from foreign sites

## Cron endpoints

```txt
/api/cron/refresh-news
/api/cron/refresh-insights
/api/cron/refresh-foreign-masters
/api/cron/generate-analysis
```

## Firestore cache docs

```txt
cache/news
cache/insights
cache/foreignMasters
cache/odds
cache/todayDashboard
```

`cache/foreignMasters` stores only public metadata, source links, short excerpts and SignalEdge summaries. Paid content, login-only content and full-text copying are intentionally excluded.

## Deployment notes

Required production environment variables depend on which data providers you use. At minimum the existing project expects:

```txt
ODDS_API_KEY
FIREBASE_SERVICE_ACCOUNT_JSON
CRON_SECRET
```

Optional provider keys remain supported:

```txt
API_SPORTS_KEY
API_FOOTBALL_KEY
GEMINI_API_KEY
GROQ_API_KEY
```

`API_SPORTS_KEY` and `API_FOOTBALL_KEY` use fallback logic in the source layer.


## V6F-1 deployment hotfix

This package keeps all Vercel cron schedules to once per day so Hobby deployments do not fail on cron frequency limits. For high-frequency updates, keep the API endpoints and trigger them externally with `Authorization: Bearer <CRON_SECRET>`. Cron endpoints also accept official Vercel Cron requests when `CRON_SECRET` is not configured, but setting `CRON_SECRET` in Vercel is recommended.
