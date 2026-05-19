'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/', label: '主页' },
  { href: '/history', label: '竞猜记录' },
  { href: '/members', label: '成员' },
  { href: '/rules', label: '积分规则' },
]

export default function Navbar({ username, avatarUrl }: { username: string; avatarUrl?: string | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none min-w-0">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 shrink-0">
            <span className="text-xl">⚽</span>
            <span className="hidden sm:block text-sm">世界杯竞猜</span>
          </Link>
          <div className="flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors font-medium ${
                  pathname === link.href
                    ? 'bg-amber-50 text-amber-600'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/profile" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 text-xs font-bold">
                {username?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className="hidden sm:block">{username}</span>
          </Link>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            退出
          </button>
        </div>
      </div>
    </nav>
  )
}
