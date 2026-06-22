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
  const [navigating, setNavigating] = useState(false)
  const [navTarget, setNavTarget] = useState<string | null>(null)
  const supabaseRef = useRef(createClient())
  const pathnameRef = useRef(pathname)

  // Keep pathnameRef current so async callbacks can read the latest value
  useEffect(() => { pathnameRef.current = pathname }, [pathname])

  // Eager prefetch all nav routes on mount
  useEffect(() => {
    navLinks.forEach(link => router.prefetch(link.href))
    router.prefetch('/chat')
    router.prefetch('/profile')
  }, [router])

  // When pathname changes, navigation is done — clear loading state
  useEffect(() => {
    setNavigating(false)
    setNavTarget(null)
  }, [pathname])

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
      // If user is on chat page when this resolves, keep badge at 0
      if (mounted) setUnread(pathnameRef.current === '/chat' ? 0 : (d.count ?? 0))
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

  const isActive = (href: string) => navTarget ? navTarget === href : pathname === href

  return (
    <nav className="sticky top-0 z-50 glass-nav">
      {/* 顶部进度条：点击导航后立即出现，页面加载完自动消失 */}
      {navigating && (
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
          <div
            className="h-full bg-amber-400 dark:bg-blue-400 rounded-full"
            style={{ animation: 'nav-progress 1.2s cubic-bezier(0.1,0.6,0.5,1) forwards' }}
          />
        </div>
      )}
      <div className="max-w-6xl mx-auto px-3 h-12 flex items-center justify-between gap-1 overflow-hidden">
        <div className="flex items-center gap-1 shrink-0">
          <Link href="/" className="flex items-center font-bold text-gray-900 dark:text-gray-100 shrink-0 tap-scale mr-0.5">
            <span className="text-xs">世界杯竞猜</span>
          </Link>
          <div className="flex items-center gap-0">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => { if (pathname !== link.href) { setNavigating(true); setNavTarget(link.href) } }}
                className={`relative px-2 py-1 rounded-lg text-xs whitespace-nowrap font-medium tap-scale transition-colors ${
                  isActive(link.href)
                    ? 'text-blue-600 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/60 dark:hover:bg-white/5'
                }`}
                style={isActive(link.href) ? {
                  background: 'rgba(59,130,246,0.08)',
                  border: '1.5px solid rgba(59,130,246,0.32)',
                  boxShadow: '0 0 10px rgba(59,130,246,0.10)',
                } : {}}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-blue-400/70" />
                )}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Chat icon with unread badge */}
          <Link
            href="/chat"
            onClick={() => { if (pathname !== '/chat') { setNavigating(true); setNavTarget('/chat') } }}
            className={`relative p-1 rounded-lg transition-colors tap-scale ${
              isActive('/chat')
                ? 'text-blue-600 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/60 dark:hover:bg-white/5'
            }`}
            style={isActive('/chat') ? {
              background: 'rgba(59,130,246,0.08)',
              border: '1.5px solid rgba(59,130,246,0.32)',
            } : {}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>

          <Link href="/profile" className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors tap-scale">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-white/50 shadow-sm" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-800/30 flex items-center justify-center text-amber-600 text-[10px] font-bold shadow-sm">
                {username?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className="hidden sm:block">{username}</span>
          </Link>
          <button onClick={handleLogout} className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors tap-scale">
            退出
          </button>
        </div>
      </div>
    </nav>
  )
}
