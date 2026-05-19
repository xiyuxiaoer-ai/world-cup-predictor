'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function ComicIllustration() {
  return (
    <svg viewBox="0 0 280 260" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 地面 */}
      <ellipse cx="140" cy="248" rx="80" ry="10" fill="#E5E7EB"/>
      {/* 速度线 */}
      <line x1="195" y1="130" x2="255" y2="108" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
      <line x1="198" y1="148" x2="262" y2="145" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="192" y1="115" x2="248" y2="92" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      {/* 足球 */}
      <circle cx="210" cy="140" r="32" fill="#F59E0B" stroke="#111827" strokeWidth="3"/>
      <circle cx="210" cy="140" r="32" fill="none" stroke="#111827" strokeWidth="3"/>
      <path d="M210 112 L222 126 L218 142 L202 142 L198 126 Z" fill="#111827" opacity="0.25"/>
      <path d="M210 168 L222 154 L218 142 L202 142 L198 154 Z" fill="#111827" opacity="0.2"/>
      <path d="M183 131 L198 126 L202 142 L190 152 L178 144 Z" fill="#111827" opacity="0.2"/>
      {/* 腿（踢球姿势）*/}
      <path d="M95 200 L82 248 L96 248 L108 218 L118 248 L134 248 L122 198 Z" fill="#1D4ED8" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 踢球腿延伸 */}
      <path d="M122 200 L168 162 L178 174 L136 214 Z" fill="#1D4ED8" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 球鞋 */}
      <path d="M78 248 L62 258 L100 260 L96 248 Z" fill="#111827" stroke="#111827" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M118 248 L114 258 L148 258 L148 248 Z" fill="#111827" stroke="#111827" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* 球衣身体 */}
      <path d="M72 142 L80 200 L136 200 L145 142 L120 132 L108 148 L96 132 Z" fill="#DC2626" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 号码 */}
      <text x="108" y="182" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial">10</text>
      {/* 手臂 */}
      <path d="M72 148 L44 172 L50 182 L82 162 Z" fill="#FBBF24" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M145 148 L162 158 L158 168 L142 160 Z" fill="#FBBF24" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 脖子 */}
      <rect x="100" y="104" width="16" height="30" rx="4" fill="#FBBF24" stroke="#111827" strokeWidth="2"/>
      {/* 头 */}
      <circle cx="108" cy="88" r="28" fill="#FBBF24" stroke="#111827" strokeWidth="2.5"/>
      {/* 头发 */}
      <path d="M82 80 Q88 60 108 57 Q128 60 134 80 L130 82 Q120 64 108 63 Q96 64 86 82 Z" fill="#111827"/>
      {/* 眼睛 */}
      <ellipse cx="100" cy="86" rx="5" ry="6" fill="white" stroke="#111827" strokeWidth="1.5"/>
      <ellipse cx="116" cy="86" rx="5" ry="6" fill="white" stroke="#111827" strokeWidth="1.5"/>
      <circle cx="101" cy="87" r="2.5" fill="#111827"/>
      <circle cx="117" cy="87" r="2.5" fill="#111827"/>
      {/* 眉毛 */}
      <path d="M94 79 L106 76" stroke="#111827" strokeWidth="2" strokeLinecap="round"/>
      <path d="M110 76 L122 79" stroke="#111827" strokeWidth="2" strokeLinecap="round"/>
      {/* 嘴巴 */}
      <path d="M101 98 Q108 103 115 98" stroke="#111827" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* 星星装饰 */}
      <text x="30" y="110" fontSize="18" opacity="0.8">⭐</text>
      <text x="220" y="60" fontSize="14" opacity="0.7">✨</text>
      <text x="15" y="185" fontSize="12" opacity="0.6">💫</text>
      {/* 2026 文字 */}
      <text x="140" y="28" textAnchor="middle" fill="#F59E0B" fontSize="16" fontWeight="bold" fontFamily="Arial" letterSpacing="3">2026</text>
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
      router.push('/')
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
