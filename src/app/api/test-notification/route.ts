import { NextResponse } from 'next/server'

export async function POST() {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'SLACK_WEBHOOK_URL is not configured' },
      { status: 400 }
    )
  }

  const testUrl = 'https://www.reddit.com/r/dataengineering/comments/example'
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
          text: `*<${testUrl}|[TEST] How we improved our data pipeline by 10x>*\n📌 r/dataengineering  ▲ 42  💬 7 comments\n🔑 Matched: \`data pipeline\``,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Post →' },
            url: testUrl,
          },
        ],
      },
    ],
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `Slack returned ${res.status}: ${text}` },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
