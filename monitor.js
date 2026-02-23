// @ts-check
const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json')
const SEEN_PATH = path.join(process.cwd(), 'data', 'seen.json')

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

let cachedToken = null
let tokenExpiry = 0

async function getRedditToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  const username = process.env.REDDIT_USERNAME
  const password = process.env.REDDIT_PASSWORD

  if (!clientId || !clientSecret) {
    throw new Error('REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are required')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const body = username && password
    ? `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    : 'grant_type=client_credentials'

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'reddit-listener/1.0 by polymath93',
    },
    body,
  })

  if (!res.ok) {
    throw new Error(`Reddit auth failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

async function sendSlackNotification(post, keyword) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('[monitor] SLACK_WEBHOOK_URL not set, skipping notification')
    return
  }

  const url = `https://www.reddit.com${post.permalink}`
  const payload = {
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '📡 *Reddit Signal Detected*' },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${url}|${post.title}>*\n📌 r/${post.subreddit}  ▲ ${post.score}  💬 ${post.num_comments} comments\n🔑 Matched: \`${keyword}\``,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Post →' },
            url,
          },
        ],
      },
    ],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    console.error(`[monitor] Slack notification failed: ${res.status} ${res.statusText}`)
  }
}

async function runMonitor() {
  console.log(`[monitor] Starting run at ${new Date().toISOString()}`)

  const config = readJSON(CONFIG_PATH)
  if (!config) {
    console.error('[monitor] Could not read config.json')
    return
  }

  const seenIds = readJSON(SEEN_PATH) || []
  const seenSet = new Set(seenIds)

  const { includes = [], excludes = [], subreddits = [] } = config
  const newIds = []
  let totalMatches = 0

  let token
  try {
    token = await getRedditToken()
    console.log('[monitor] Reddit OAuth token obtained')
  } catch (err) {
    console.error('[monitor] Failed to get Reddit token:', err.message)
    return
  }

  for (const subreddit of subreddits) {
    for (const keyword of includes) {
      const encodedKeyword = encodeURIComponent(keyword)
      const url = `https://oauth.reddit.com/r/${subreddit}/search.json?q=${encodedKeyword}&sort=new&limit=25&t=day&restrict_sr=1`

      let posts
      try {
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'reddit-listener/1.0 by polymath93',
          },
        })
        if (!res.ok) {
          console.error(`[monitor] Reddit fetch failed for r/${subreddit} "${keyword}": ${res.status}`)
          continue
        }
        const json = await res.json()
        posts = json?.data?.children?.map((c) => c.data) || []
      } catch (err) {
        console.error(`[monitor] Fetch error for r/${subreddit} "${keyword}":`, err.message)
        continue
      }

      for (const post of posts) {
        // Skip if already seen
        if (seenSet.has(post.id)) continue

        // Check excludes against title and selftext (case-insensitive)
        const textToCheck = `${post.title} ${post.selftext || ''}`.toLowerCase()
        const isExcluded = excludes.some((ex) => textToCheck.includes(ex.toLowerCase()))
        if (isExcluded) {
          seenSet.add(post.id)
          newIds.push(post.id)
          continue
        }

        // Verify the include keyword is actually in the post (Reddit search can be fuzzy)
        const hasKeyword = textToCheck.includes(keyword.toLowerCase())
        if (!hasKeyword) {
          continue
        }

        // Send notification
        try {
          await sendSlackNotification(post, keyword)
          totalMatches++
        } catch (err) {
          console.error('[monitor] Notification error:', err.message)
        }

        seenSet.add(post.id)
        newIds.push(post.id)
      }

      // Small delay between requests to be polite to Reddit
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  // Update seen.json — keep only last 5000
  const updatedSeen = [...seenSet].slice(-5000)
  writeJSON(SEEN_PATH, updatedSeen)

  // Update config with lastRun and seenCount
  config.lastRun = new Date().toISOString()
  config.seenCount = updatedSeen.length
  writeJSON(CONFIG_PATH, config)

  console.log(`[monitor] Done. New matches: ${totalMatches}, Total seen: ${updatedSeen.length}`)
}

module.exports = { runMonitor }
