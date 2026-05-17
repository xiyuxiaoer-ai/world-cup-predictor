'use client'

import { useState } from 'react'

export default function InviteMemberModal({
  gameId,
  onClose,
}: {
  gameId: string
  onClose: () => void
}) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const res = await fetch(`/api/games/${gameId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || '邀请失败')
    } else {
      setSuccess(`已成功邀请 ${username}！`)
      setUsername('')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-1">邀请成员</h2>
        <p className="text-zinc-500 text-sm mb-4">输入对方注册时的用户名</p>
        <form onSubmit={handleInvite} className="space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3">{error}</p>}
          {success && <p className="text-emerald-400 text-sm bg-emerald-400/10 rounded-lg p-3">{success}</p>}
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="对方的用户名"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-700 text-zinc-400 py-2.5 rounded-lg hover:border-zinc-500 transition-colors"
            >
              关闭
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? '邀请中...' : '邀请'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
