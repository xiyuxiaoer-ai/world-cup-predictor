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
      router.replace('/')
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-8 md:gap-12">
      {/* 左侧插图 */}
      <div className="w-full md:w-1/2 max-w-sm md:max-w-none animate-float-up">
        <img src="/zy.png" alt="" className="w-full h-auto" />
      </div>

      {/* 右侧登录表单 */}
      <div className="w-full md:w-1/2 max-w-sm animate-float-up" style={{ animationDelay: '0.1s' }}>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 space-y-4">
          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>
          )}
          <div>
            <label className="text-gray-600 text-sm mb-1.5 block font-medium">邮箱</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-1.5 block font-medium">密码</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
          >
            {loading ? '登录中...' : '登录 ⚽'}
          </button>
          <p className="text-center text-gray-500 text-sm">
            没有账号？{' '}
            <Link href="/register" className="text-amber-500 hover:text-amber-600 font-medium transition-colors">
              立即注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
