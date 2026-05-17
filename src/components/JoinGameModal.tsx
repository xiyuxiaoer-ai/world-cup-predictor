'use client'

import { useState } from 'react'
import type { GameWithRole } from '@/types'

export default function JoinGameModal({
  onJoined,
  onClose,
}: {
  onJoined: (game: GameWithRole) => void
  onClose: () => void
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/games/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || '加入失败')
      setLoading(false)
    } else {
      onJoined({ ...data.game, role: 'member' })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-1">加入 Game</h2>
        <p className="text-zinc-500 text-sm mb-4">输入管理员分享的 Game 码（8位）</p>
        <form onSubmit={handleJoin} className="space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3">{error}</p>}
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            autoFocus
            maxLength={36}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono tracking-widest text-center text-lg transition-colors"
            placeholder="例如：a1b2c3d4"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-700 text-zinc-400 py-2.5 rounded-lg hover:border-zinc-500 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? '加入中...' : '加入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
