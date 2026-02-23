'use client'

import { useEffect, useState, useCallback } from 'react'

interface Config {
  includes: string[]
  excludes: string[]
  subreddits: string[]
  lastRun: string | null
  seenCount: number
}

type ListKey = 'includes' | 'excludes' | 'subreddits'

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never'
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const SECTION_META: Record<ListKey, { label: string; placeholder: string; color: string }> = {
  includes: {
    label: 'Include Keywords',
    placeholder: 'Add keyword…',
    color: 'bg-green-500/20 text-green-300 border-green-500/30',
  },
  excludes: {
    label: 'Exclude Keywords',
    placeholder: 'Add exclusion…',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  subreddits: {
    label: 'Subreddits',
    placeholder: 'Add subreddit…',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
}

export default function Home() {
  const [config, setConfig] = useState<Config | null>(null)
  const [inputs, setInputs] = useState<Record<ListKey, string>>({
    includes: '',
    excludes: '',
    subreddits: '',
  })
  const [status, setStatus] = useState<{ lastRun: string | null; seenCount: number }>({
    lastRun: null,
    seenCount: 0,
  })
  const [running, setRunning] = useState(false)
  const [testing, setTesting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchConfig = useCallback(async () => {
    const res = await fetch('/api/config')
    const data: Config = await res.json()
    setConfig(data)
    setStatus({ lastRun: data.lastRun, seenCount: data.seenCount })
  }, [])

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/status')
    const data = await res.json()
    setStatus(data)
  }, [])

  useEffect(() => {
    fetchConfig()
    // Poll status every 30s
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchConfig, fetchStatus])

  const saveConfig = async (updated: Config) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    if (!res.ok) throw new Error('Failed to save config')
    const data: Config = await res.json()
    setConfig(data)
  }

  const addItem = async (key: ListKey) => {
    if (!config) return
    const value = inputs[key].trim()
    if (!value) return
    const cleaned = key === 'subreddits' ? value.replace(/^r\//, '') : value
    if (config[key].includes(cleaned)) {
      showToast(`"${cleaned}" is already in the list`, 'error')
      return
    }
    const updated = { ...config, [key]: [...config[key], cleaned] }
    try {
      await saveConfig(updated)
      setInputs((prev) => ({ ...prev, [key]: '' }))
    } catch {
      showToast('Failed to save', 'error')
    }
  }

  const removeItem = async (key: ListKey, item: string) => {
    if (!config) return
    const updated = { ...config, [key]: config[key].filter((i) => i !== item) }
    try {
      await saveConfig(updated)
    } catch {
      showToast('Failed to save', 'error')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, key: ListKey) => {
    if (e.key === 'Enter') addItem(key)
  }

  const handleRunNow = async () => {
    setRunning(true)
    try {
      const res = await fetch('/api/monitor/run', { method: 'POST' })
      if (!res.ok) throw new Error('Run failed')
      await fetchStatus()
      showToast('Monitor run complete')
    } catch {
      showToast('Run failed', 'error')
    } finally {
      setRunning(false)
    }
  }

  const handleTestNotification = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/test-notification', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test failed')
      showToast('Test notification sent to Slack!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test failed'
      showToast(message, 'error')
    } finally {
      setTesting(false)
    }
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 animate-pulse">Loading…</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all ${
            toast.type === 'error'
              ? 'bg-red-900/90 text-red-200 border border-red-700'
              : 'bg-green-900/90 text-green-200 border border-green-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>📡</span> Reddit Listener
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Monitors Reddit and sends Slack alerts when keywords appear.
        </p>
      </div>

      {/* Status bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-gray-500">Last run:</span>
          <span className="text-gray-200 font-medium">{formatRelativeTime(status.lastRun)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-gray-500">Posts seen:</span>
          <span className="text-gray-200 font-medium">{status.seenCount.toLocaleString()}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleTestNotification}
            disabled={testing}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-600/30 hover:bg-purple-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Sending…' : '🔔 Test Slack'}
          </button>
          <button
            onClick={handleRunNow}
            disabled={running}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-600/30 hover:bg-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? 'Running…' : '▶ Run now'}
          </button>
        </div>
      </div>

      {/* Keyword sections */}
      {(['includes', 'excludes', 'subreddits'] as ListKey[]).map((key) => {
        const meta = SECTION_META[key]
        return (
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-300">{meta.label}</h2>

            {/* Tag list */}
            <div className="flex flex-wrap gap-2 min-h-[2rem]">
              {config[key].length === 0 && (
                <span className="text-gray-600 text-xs italic">None added yet</span>
              )}
              {config[key].map((item) => (
                <span
                  key={item}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.color}`}
                >
                  {key === 'subreddits' ? `r/${item}` : item}
                  <button
                    onClick={() => removeItem(key, item)}
                    className="opacity-60 hover:opacity-100 transition leading-none"
                    aria-label={`Remove ${item}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Input row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputs[key]}
                onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, key)}
                placeholder={meta.placeholder}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => addItem(key)}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 transition"
              >
                Add
              </button>
            </div>
          </div>
        )
      })}

      <p className="text-xs text-gray-600 text-center">
        Changes save immediately · Cron runs every 15 minutes
      </p>
    </div>
  )
}
