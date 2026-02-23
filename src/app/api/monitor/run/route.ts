import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const runMonitor = (global as any).__runMonitor
    if (!runMonitor) throw new Error('Monitor not initialized')
    await runMonitor()
    return NextResponse.json({ ok: true, ran: new Date().toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/monitor/run]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
