'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/', label: '主页' },
  { href: '/history', label: '竞猜记录' },
  { href: '/rules', label: '积分规则' },
  { href: '/members', label: '成员' },
]

export default function Navbar({ username }: { username: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-white">
            <span className="text-xl">⚽</span>
            <span className="hidden sm:block text-sm">世界杯竞猜</span>
          </Link>
          <div className="flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
              {username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="hidden sm:block">{username}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            退出
          </button>
        </div>
      </div>
    </nav>
  )
}
