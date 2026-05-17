'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('邮箱或密码错误')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">世界杯竞猜</h1>
        <p className="text-zinc-400 text-sm mt-1">登录你的账号继续</p>
      </div>

      <form onSubmit={handleLogin} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4 animate-slide-up">
        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3 animate-pop">{error}</p>
        )}
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
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? '登录中...' : '登录 ⚽'}
        </button>
        <p className="text-center text-zinc-400 text-sm">
          没有账号？{' '}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            立即注册
          </Link>
        </p>
      </form>
    </div>
  )
}
