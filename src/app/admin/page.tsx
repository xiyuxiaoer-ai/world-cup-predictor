'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Tab = 'users' | 'games'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<any[]>([])
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<any>(null)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/'); return }
      loadData()
    })
  }, [])

  async function loadData() {
    setLoading(true)
    const [usersRes, gamesRes] = await Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/games').then(r => r.json()),
    ])
    setUsers(Array.isArray(usersRes) ? usersRes : [])
    setGames(Array.isArray(gamesRes) ? gamesRes : [])
    setLoading(false)
  }

  async function handleUpdateUser(id: string) {
    const body: any = {}
    if (newEmail) body.email = newEmail
    if (newPassword) body.password = newPassword
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok) { setMsg('修改成功'); setEditUser(null); setNewEmail(''); setNewPassword(''); loadData() }
    else setMsg(data.error || '修改失败')
  }

  async function handleDeleteUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) { setMsg('用户已删除'); loadData() }
    else setMsg(data.error || '删除失败')
    setConfirmDelete(null)
  }

  async function handleDeleteGame(id: string) {
    const res = await fetch(`/api/admin/games/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) { setMsg('Game 已删除'); loadData() }
    else setMsg(data.error || '删除失败')
    setConfirmDelete(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-400">加载中...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">超级管理员</h1>
          <button onClick={() => router.push('/')} className="text-sm text-zinc-400 hover:text-white transition-colors">← 返回主页</button>
        </div>

        {msg && (
          <div className="mb-4 p-3 bg-zinc-800 rounded-lg text-sm text-emerald-400 flex justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="text-zinc-500 hover:text-white">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['users', 'games'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>
              {t === 'users' ? `用户管理 (${users.length})` : `Game管理 (${games.length})`}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{u.display_name || u.username || '—'}</span>
                      {u.username && <span className="text-xs text-zinc-500">@{u.username}</span>}
                      {u.is_admin && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">管理员</span>}
                    </div>
                    <div className="text-sm text-zinc-400 mt-1">{u.email}</div>
                    <div className="text-xs text-zinc-600 mt-0.5">
                      注册：{new Date(u.created_at).toLocaleDateString('zh-CN')}
                      {u.last_sign_in_at && ` · 最后登录：${new Date(u.last_sign_in_at).toLocaleDateString('zh-CN')}`}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setEditUser(u); setNewEmail(''); setNewPassword('') }}
                      className="text-xs text-zinc-400 hover:text-white border border-zinc-700 px-2 py-1 rounded-lg transition-colors">
                      修改
                    </button>
                    {!u.is_admin && (
                      confirmDelete === u.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDeleteUser(u.id)} className="text-xs text-red-400 border border-red-400/50 px-2 py-1 rounded-lg">确定</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs text-zinc-400 border border-zinc-700 px-2 py-1 rounded-lg">取消</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(u.id)}
                          className="text-xs text-red-400/60 hover:text-red-400 border border-red-400/20 hover:border-red-400/50 px-2 py-1 rounded-lg transition-colors">
                          删除
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Edit form */}
                {editUser?.id === u.id && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">新邮箱（留空不改）</label>
                        <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                          placeholder={u.email} />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">新密码（留空不改）</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                          placeholder="••••••" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateUser(u.id)}
                        className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-1.5 rounded-lg transition-colors">
                        保存
                      </button>
                      <button onClick={() => setEditUser(null)}
                        className="text-sm text-zinc-400 border border-zinc-700 px-4 py-1.5 rounded-lg hover:border-zinc-500 transition-colors">
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Games Tab */}
        {tab === 'games' && (
          <div className="space-y-3">
            {games.map(g => (
              <div key={g.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{g.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${g.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                      {g.status === 'active' ? '进行中' : g.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    创建者：{g.creator || '—'} · {g.member_count} 名成员 · {new Date(g.created_at).toLocaleDateString('zh-CN')}
                  </div>
                  <div className="text-xs text-zinc-700 mt-0.5 font-mono">码: {g.id.slice(0, 8)}</div>
                </div>
                {confirmDelete === g.id ? (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleDeleteGame(g.id)} className="text-xs text-red-400 border border-red-400/50 px-2 py-1 rounded-lg">确定</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-xs text-zinc-400 border border-zinc-700 px-2 py-1 rounded-lg">取消</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(g.id)} className="text-xs text-red-400/60 hover:text-red-400 border border-red-400/20 hover:border-red-400/50 px-2 py-1 rounded-lg transition-colors shrink-0">
                    删除
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
