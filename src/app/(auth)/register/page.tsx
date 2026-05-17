'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }
    if (password.length < 6) {
      setError('密码至少需要6位')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.trim(),
        display_name: username.trim(),
      })
      if (profileError) {
        setError(profileError.code === '23505' ? '用户名已被使用，请换一个' : profileError.message)
        setLoading(false)
        return
      }
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4 animate-football">⚽</div>
        <h1 className="text-2xl font-bold tracking-tight">世界杯竞猜</h1>
        <p className="text-zinc-400 text-sm mt-1">创建你的账号加入竞猜</p>
      </div>

      <form onSubmit={handleRegister} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4 animate-slide-up">
        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3">{error}</p>
        )}
        <div>
          <label className="text-zinc-400 text-sm mb-1.5 block">用户名</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            maxLength={20}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="你的昵称"
          />
        </div>
        <div>
          <label className="text-zinc-400 text-sm mb-1.5 block">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="text-zinc-400 text-sm mb-1.5 block">密码</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="至少6位"
          />
        </div>
        <div>
          <label className="text-zinc-400 text-sm mb-1.5 block">确认密码</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="再输一次"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? '注册中...' : '注册'}
        </button>
        <p className="text-center text-zinc-400 text-sm">
          已有账号？{' '}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            立即登录
          </Link>
        </p>
      </form>
    </div>
  )
}
