'use client'

import { useState } from 'react'
import type { GameWithRole } from '@/types'

export default function CreateGameModal({
  onCreated,
  onClose,
}: {
  onCreated: (game: GameWithRole) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '创建失败')
      } else {
        onCreated({ ...data, role: 'admin' })
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">创建 Game</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Game 名称</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={30}
              autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="比如：我们的世界杯竞猜"
            />
          </div>
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
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
