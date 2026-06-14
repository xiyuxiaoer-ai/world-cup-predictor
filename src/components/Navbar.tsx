'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
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
  const [unread, setUnread] = useState(0)
  const supabaseRef = useRef(createClient())

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Fetch unread count + subscribe to new messages for live badge
  useEffect(() => {
    let mounted = true

    async function fetchUnread() {
      const res = await fetch('/api/chat/unread')
      const d = await res.json()
      if (mounted) setUnread(d.count ?? 0)
    }

    fetchUnread()
    const pollInterval = setInterval(fetchUnread, 60_000)

    // Realtime: bump badge on any new message
    const supabase = supabaseRef.current
    const channel = supabase
      .channel('navbar-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchUnread()
      })
      .subscribe()

    return () => {
      mounted = false
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [])

  // Clear badge when visiting chat page
  useEffect(() => {
    if (pathname === '/chat') setUnread(0)
  }, [pathname])

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none min-w-0">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100 shrink-0">
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
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Chat icon with unread badge */}
          <Link
            href="/chat"
            className={`relative p-1.5 rounded-lg transition-colors ${
              pathname === '/chat'
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>

          <Link href="/profile" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/30 flex items-center justify-center text-amber-600 text-xs font-bold">
                {username?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className="hidden sm:block">{username}</span>
          </Link>
          <button onClick={handleLogout} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            退出
          </button>
        </div>
      </div>
    </nav>
  )
}
