import { NextResponse } from 'next/server'
import path from 'path'

export async function POST() {
  try {
    // Dynamically require monitor.js (plain JS, not transpiled)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    // Try multiple possible paths and log them for debugging
    const candidates = [
      path.join(process.cwd(), 'monitor.js'),
      path.resolve('/app', 'monitor.js'),
      path.resolve(__dirname, '../../../../..', 'monitor.js'),
      path.resolve(__dirname, '../../../../../', 'monitor.js'),
    ]
    console.log('[api/monitor/run] cwd:', process.cwd(), '__dirname:', __dirname)
    console.log('[api/monitor/run] candidates:', candidates)
    const monitorPath = candidates.find(p => fs.existsSync(p))
    if (!monitorPath) throw new Error('monitor.js not found in: ' + candidates.join(', '))
    const { runMonitor } = require(monitorPath)
    await runMonitor()
    return NextResponse.json({ ok: true, ran: new Date().toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/monitor/run]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
