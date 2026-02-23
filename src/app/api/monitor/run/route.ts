import { NextResponse } from 'next/server'
import path from 'path'

export async function POST() {
  try {
    // Dynamically require monitor.js (plain JS, not transpiled)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { runMonitor } = require(path.join(process.cwd(), 'monitor.js'))
    await runMonitor()
    return NextResponse.json({ ok: true, ran: new Date().toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/monitor/run]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
