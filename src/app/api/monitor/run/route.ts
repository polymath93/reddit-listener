import { NextResponse } from 'next/server'
import path from 'path'

export async function POST() {
  try {
    // Dynamically require monitor.js (plain JS, not transpiled)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // Try cwd first (local dev), fall back to path relative to this file (Railway)
    let monitorPath = path.join(process.cwd(), 'monitor.js')
    const fs = require('fs')
    if (!fs.existsSync(monitorPath)) {
      monitorPath = path.resolve(__dirname, '../../../../..', 'monitor.js')
    }
    const { runMonitor } = require(monitorPath)
    await runMonitor()
    return NextResponse.json({ ok: true, ran: new Date().toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/monitor/run]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
