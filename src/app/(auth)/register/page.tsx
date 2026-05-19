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
    if (password !== confirm) { setError('两次输入的密码不一致'); return }
    if (password.length < 6) { setError('密码至少需要6位'); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id, username: username.trim(), display_name: username.trim(),
      })
      if (profileError) {
        setError(profileError.code === '23505' ? '用户名已被使用，请换一个' : profileError.message)
        setLoading(false); return
      }
    }
    router.push('/'); router.refresh()
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"

  return (
    <div className="w-full max-w-sm animate-float-up">
      <div className="mb-6 text-center">
        <div className="text-5xl mb-3 animate-football">⚽</div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">世界杯竞猜</h1>
        <p className="text-gray-500 text-sm mt-1">创建你的账号加入竞猜</p>
      </div>
      <form onSubmit={handleRegister} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}
        <div>
          <label className="text-gray-600 text-sm mb-1.5 block font-medium">用户名</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required maxLength={20} className={inputClass} placeholder="你的昵称" />
        </div>
        <div>
          <label className="text-gray-600 text-sm mb-1.5 block font-medium">邮箱</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="your@email.com" />
        </div>
        <div>
          <label className="text-gray-600 text-sm mb-1.5 block font-medium">密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputClass} placeholder="至少6位" />
        </div>
        <div>
          <label className="text-gray-600 text-sm mb-1.5 block font-medium">确认密码</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className={inputClass} placeholder="再输一次" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm">
          {loading ? '注册中...' : '注册'}
        </button>
        <p className="text-center text-gray-500 text-sm">
          已有账号？{' '}
          <Link href="/login" className="text-amber-500 hover:text-amber-600 font-medium transition-colors">立即登录</Link>
        </p>
      </form>
    </div>
  )
}
