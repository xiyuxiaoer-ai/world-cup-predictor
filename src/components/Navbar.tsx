'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createPortal } from 'react-dom'
import ThirdPlaceModal from './ThirdPlaceModal'

const KNOCKOUT_START = new Date('2026-07-01T06:00:00')

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
  const [showThirdPlace, setShowThirdPlace] = useState(false)
  const [mounted, setMounted] = useState(false)
  const knockoutStarted = new Date() >= KNOCKOUT_START
  useEffect(() => setMounted(true), [])
  const [navTarget, setNavTarget] = useState<string | null>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
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

  // Measure & animate the sliding pill indicator
  useEffect(() => {
    const measure = () => {
      const container = navRef.current
      if (!container) return
      const active = container.querySelector('[data-active="true"]') as HTMLElement | null
      if (!active) { setPill(null); return }
      const cr = container.getBoundingClientRect()
      const er = active.getBoundingClientRect()
      setPill({ left: er.left - cr.left, width: er.width })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [pathname, navTarget])

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
    <>
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
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center">
        {/* 品牌名 */}
        <Link href="/" className="text-xs font-bold text-gray-900 dark:text-gray-100 shrink-0 tap-scale whitespace-nowrap">
          世界杯竞猜
        </Link>

        {/* 五个功能键：移动端均分，桌面端紧凑靠左 */}
        <div
          ref={navRef}
          className="relative flex-1 sm:flex-none flex items-center justify-evenly sm:justify-start sm:gap-1 px-3 sm:px-0 sm:ml-4"
        >
          {/* iOS 滑动 pill 指示器 — 随激活项弹性移动 */}
          {pill && (
            <span
              aria-hidden
              className="nav-pill-spring absolute inset-y-1 rounded-lg pointer-events-none"
              style={{
                left: pill.left,
                width: pill.width,
                background: 'rgba(59,130,246,0.09)',
                border: '1.5px solid rgba(59,130,246,0.26)',
                boxShadow: '0 0 14px rgba(59,130,246,0.10)',
              }}
            />
          )}

          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              data-active={isActive(link.href) ? 'true' : undefined}
              onClick={() => { if (pathname !== link.href) { setNavigating(true); setNavTarget(link.href) } }}
              className={`relative z-10 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium tap-scale transition-colors duration-200 ${
                isActive(link.href)
                  ? 'text-blue-600 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Chat 图标，和其他四个等距 */}
          <Link
            href="/chat"
            data-active={isActive('/chat') ? 'true' : undefined}
            onClick={() => { if (pathname !== '/chat') { setNavigating(true); setNavTarget('/chat') } }}
            className={`relative z-10 p-1.5 rounded-lg transition-colors duration-200 tap-scale ${
              isActive('/chat')
                ? 'text-blue-600 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none animate-pop-in">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>
        </div>

        {/* 桌面端弹性间隔，把头像推到最右 */}
        <div className="hidden sm:block flex-1" />

        {/* 头像 + 退出 */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/profile" className="flex items-center gap-1.5 tap-scale transition-colors">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-white/50 shadow-sm" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200/60 dark:border-blue-800/30 flex items-center justify-center text-blue-600 text-[10px] font-bold shadow-sm">
                {username?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </Link>
          <button onClick={handleLogout} className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors tap-scale">
            退出
          </button>
        </div>
      </div>

      {/* 子导航：小组第三排名 + 淘汰赛赛程 */}
      <div className="border-t border-black/[0.04] dark:border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 h-8 flex items-center gap-4">
          {!knockoutStarted && (
            <button
              onClick={() => setShowThirdPlace(true)}
              className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors tap-scale"
            >
              小组第三排名
            </button>
          )}
          <Link
            href="/bracket"
            className={`text-[11px] transition-colors tap-scale ${
              pathname === '/bracket'
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            淘汰赛赛程
          </Link>
        </div>
      </div>

    </nav>

    {mounted && showThirdPlace && createPortal(
      <ThirdPlaceModal onClose={() => setShowThirdPlace(false)} />,
      document.body
    )}
    </>
  )
}
