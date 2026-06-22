'use client'

import { useState } from 'react'

export default function InviteMemberModal({ gameId, onClose }: { gameId: string; onClose: () => void }) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    const res = await fetch(`/api/games/${gameId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim() }) })
    const data = await res.json()
    if (!res.ok) setError(data.error || '邀请失败')
    else { setSuccess(`已成功邀请 ${username}！`); setUsername('') }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-sm animate-spring-in">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">邀请成员</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">输入对方注册时的用户名</p>
        <form onSubmit={handleInvite} className="space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}
          {success && <p className="text-green-600 text-sm bg-green-50 rounded-lg p-3">{success}</p>}
          <div>
            <label className="text-gray-600 dark:text-gray-300 text-sm mb-1.5 block font-medium">用户名</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus
              className="w-full bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-gray-700 transition-colors"
              placeholder="对方的用户名" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">关闭</button>
            <button type="submit" disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm">
              {loading ? '邀请中...' : '邀请'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
