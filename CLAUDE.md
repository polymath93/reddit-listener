# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (same as prod — runs node server.js)
npm run build    # Next.js production build (required before deploy)
npm start        # Production start (same as dev)
```

There are no tests or linters configured.

## Architecture

This is a single Railway service running two things from one process:

**`server.js`** is the entry point. It:
1. Boots Next.js programmatically via `next()` + `createServer`
2. Schedules `monitor.js` via `node-cron` every 15 minutes

**`monitor.js`** (plain JS) contains all Reddit polling logic:
- Reads `data/config.json` for keywords/subreddits
- Fetches `https://www.reddit.com/r/{sub}/search.json` for each subreddit×keyword pair
- Filters posts against excludes and `data/seen.json`
- POSTs Slack Block Kit messages to `SLACK_WEBHOOK_URL`
- Writes updated seen IDs (capped at 5000) and `lastRun`/`seenCount` back to disk

**`src/app/`** is the Next.js 14 App Router frontend (TypeScript):
- `page.tsx` — single-page UI; fetches config on mount, polls `/api/status` every 30s, saves keyword changes immediately
- `api/config/route.ts` — GET/POST `data/config.json`
- `api/status/route.ts` — GET `lastRun` + `seenCount`
- `api/monitor/run/route.ts` — POST triggers `runMonitor()` via `require(path.join(process.cwd(), 'monitor.js'))`
- `api/test-notification/route.ts` — POST sends a sample Slack message

## Key conventions

- `server.js` and `monitor.js` are **plain CommonJS** (`require`/`module.exports`). All Next.js files are **TypeScript**.
- Data lives in `data/config.json` and `data/seen.json` at the project root — no database.
- `monitor.js` is loaded at runtime by the API route using an absolute `require()` path to avoid Next.js bundling it.
- `PORT` is read from `process.env.PORT` (set automatically by Railway); defaults to 3000.
- Required env var: `SLACK_WEBHOOK_URL`. Optional: `NODE_ENV`.
