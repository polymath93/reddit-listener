import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json')

export async function GET() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
    return NextResponse.json({
      lastRun: config.lastRun ?? null,
      seenCount: config.seenCount ?? 0,
    })
  } catch {
    return NextResponse.json({ lastRun: null, seenCount: 0 })
  }
}
