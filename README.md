# Reddit Listener

Monitors Reddit for keywords and sends Slack notifications. Runs as a single Railway service combining a Next.js frontend/API and a background cron job.

## Features

- Monitor multiple subreddits for include keywords
- Filter out posts matching exclude keywords
- Slack Block Kit notifications with direct post links
- Web UI to manage keywords in real time
- "Run now" button to trigger a manual poll
- "Test notification" button to verify Slack is wired up
- Cron runs every 15 minutes automatically

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Set `SLACK_WEBHOOK_URL` in your shell or a `.env.local` file for Slack notifications to work locally.

---

## Getting a Slack Webhook URL

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) and click **Create New App → From scratch**.
2. Name your app (e.g. "Reddit Listener") and pick your workspace.
3. In the left sidebar, go to **Incoming Webhooks** and toggle it **On**.
4. Click **Add New Webhook to Workspace**, pick the channel, and click **Allow**.
5. Copy the Webhook URL — it looks like `https://hooks.slack.com/services/T.../B.../...`.

---

## Deploy to Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create reddit-listener --private --push --source=.
```

### 2. Create a Railway project

1. Go to [railway.app](https://railway.app) and click **New Project → Deploy from GitHub repo**.
2. Select your `reddit-listener` repository.
3. Railway auto-detects the `railway.json` and uses `node server.js` as the start command.

### 3. Set environment variables

In the Railway project dashboard → your service → **Variables** tab, add:

| Variable | Value |
|---|---|
| `SLACK_WEBHOOK_URL` | Your Slack webhook URL |
| `NODE_ENV` | `production` |

Railway automatically sets `PORT` — the server reads it automatically.

### 4. Deploy

Click **Deploy** (or push a new commit). Railway will:

1. Run `npm install`
2. Run `npm run build` (Next.js build)
3. Start with `node server.js`

The app will be live at the Railway-provided URL (e.g. `https://reddit-listener-production.up.railway.app`).

---

## Project Structure

```
.
├── data/
│   ├── config.json        # Keywords, subreddits, lastRun, seenCount
│   └── seen.json          # IDs of posts already processed
├── src/
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx        # Main UI
│       ├── globals.css
│       └── api/
│           ├── config/route.ts
│           ├── status/route.ts
│           ├── monitor/run/route.ts
│           └── test-notification/route.ts
├── monitor.js             # Reddit polling + Slack notification logic
├── server.js              # Entry point: Next.js + node-cron
├── railway.json
└── package.json
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SLACK_WEBHOOK_URL` | Yes | Slack Incoming Webhook URL |
| `NODE_ENV` | Yes (prod) | Set to `production` on Railway |
| `PORT` | No | Auto-set by Railway (defaults to 3000) |
