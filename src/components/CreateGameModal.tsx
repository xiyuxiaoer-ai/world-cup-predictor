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
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 animate-float-up">
        <h2 className="text-lg font-bold text-gray-900 mb-4">创建 Game</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}
          <div>
            <label className="text-gray-600 text-sm mb-1.5 block font-medium">Game 名称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={30} autoFocus
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              placeholder="比如：我们的世界杯竞猜" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium">取消</button>
            <button type="submit" disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm">
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
