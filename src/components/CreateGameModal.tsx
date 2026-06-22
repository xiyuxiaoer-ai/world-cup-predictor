'use client'

import { useState } from 'react'
import type { GameWithRole } from '@/types'

export default function CreateGameModal({ onCreated, onClose }: { onCreated: (game: GameWithRole) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
      const data = await res.json()
      if (!res.ok) setError(data.error || '创建失败')
      else onCreated({ ...data, role: 'admin' })
    } catch { setError('网络错误，请重试') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-sm animate-spring-in">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">创建 Game</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}
          <div>
            <label className="text-gray-600 dark:text-gray-300 text-sm mb-1.5 block font-medium">Game 名称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={30} autoFocus
              className="w-full bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-gray-700 transition-colors"
              placeholder="比如：我们的世界杯竞猜" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">取消</button>
            <button type="submit" disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm">
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
