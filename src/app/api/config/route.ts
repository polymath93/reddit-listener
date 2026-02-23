import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json')

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
  } catch {
    return {
      includes: [],
      excludes: [],
      subreddits: [],
      lastRun: null,
      seenCount: 0,
    }
  }
}

export async function GET() {
  const config = readConfig()
  return NextResponse.json(config)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const current = readConfig()

    // Merge the update into current config, preserving fields not sent
    const updated = { ...current, ...body }

    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8')

    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
