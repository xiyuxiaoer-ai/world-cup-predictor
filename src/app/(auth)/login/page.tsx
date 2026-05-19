'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function ComicIllustration() {
  return (
    <svg viewBox="0 0 280 280" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 2026 */}
      <text x="140" y="28" textAnchor="middle" fill="#F59E0B" fontSize="16" fontWeight="bold" fontFamily="Arial" letterSpacing="3">2026</text>
      {/* 地面阴影 */}
      <ellipse cx="118" cy="268" rx="75" ry="9" fill="#E5E7EB"/>
      {/* 速度线 */}
      <line x1="210" y1="155" x2="268" y2="135" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
      <line x1="214" y1="172" x2="272" y2="168" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="206" y1="140" x2="260" y2="118" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      {/* 足球 */}
      <circle cx="228" cy="160" r="30" fill="#F59E0B" stroke="#111827" strokeWidth="3"/>
      <path d="M228 133 L239 146 L235 160 L221 160 L217 146 Z" fill="#111827" opacity="0.25"/>
      <path d="M228 187 L239 174 L235 160 L221 160 L217 174 Z" fill="#111827" opacity="0.2"/>
      {/* 左腿 */}
      <path d="M100 205 L88 262 L106 262 L112 205 Z" fill="#1D4ED8" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 右腿 */}
      <path d="M124 205 L138 262 L156 262 L140 205 Z" fill="#1D4ED8" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 左脚 */}
      <path d="M83 262 L65 270 L108 272 L106 262 Z" fill="#111827" strokeLinejoin="round"/>
      {/* 右脚 */}
      <path d="M138 262 L156 262 L172 270 L148 272 Z" fill="#111827" strokeLinejoin="round"/>
      {/* 球衣身体 */}
      <path d="M76 148 L88 210 L150 210 L158 148 L134 138 L120 154 L106 138 Z" fill="#DC2626" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 号码 */}
      <text x="117" y="190" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial">10</text>
      {/* 左手臂 */}
      <path d="M78 155 L50 178 L58 188 L90 168 Z" fill="#FBBF24" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 右手臂（向右举起）*/}
      <path d="M155 152 L195 140 L192 152 L156 166 Z" fill="#FBBF24" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 脖子 */}
      <rect x="108" y="110" width="18" height="30" rx="4" fill="#FBBF24" stroke="#111827" strokeWidth="2"/>
      {/* 头 */}
      <circle cx="117" cy="92" r="30" fill="#FBBF24" stroke="#111827" strokeWidth="2.5"/>
      {/* 头发 */}
      <path d="M89 83 Q95 61 117 58 Q139 61 145 83 L141 85 Q132 65 117 64 Q102 65 93 85 Z" fill="#111827"/>
      {/* 眼睛 */}
      <ellipse cx="108" cy="90" rx="5.5" ry="6.5" fill="white" stroke="#111827" strokeWidth="1.5"/>
      <ellipse cx="126" cy="90" rx="5.5" ry="6.5" fill="white" stroke="#111827" strokeWidth="1.5"/>
      <circle cx="109" cy="91" r="3" fill="#111827"/>
      <circle cx="127" cy="91" r="3" fill="#111827"/>
      {/* 眉毛 */}
      <path d="M102 82 L114 79" stroke="#111827" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M120 79 L132 82" stroke="#111827" strokeWidth="2.5" strokeLinecap="round"/>
      {/* 微笑 */}
      <path d="M108 104 Q117 110 126 104" stroke="#111827" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* 装饰 */}
      <text x="35" y="120" fontSize="18" opacity="0.8">⭐</text>
      <text x="22" y="195" fontSize="13" opacity="0.6">💫</text>
    </svg>
  )
}

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
      <div className="w-full md:w-1/2 max-w-xs md:max-w-none animate-float-up">
        <ComicIllustration />
      </div>

      {/* 右侧登录表单 */}
      <div className="w-full md:w-1/2 max-w-sm animate-float-up" style={{ animationDelay: '0.1s' }}>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">2026年世界杯足球赛</h1>
            <img src="https://crests.football-data.org/wm26.png" alt="" className="w-7 h-7 object-contain" />
          </div>
          <p className="text-gray-500 text-sm">登录你的账号继续</p>
        </div>

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
