'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SESSION_KEY = 'wc_splash_seen'

// 时间线：黑场 -> 海报淡入+开始缓慢放大(呼吸感持续到停留结束) -> 停留 -> 退场(只做整体淡出)
const BLACKOUT_MS = 170
const ENTER_MS = 430
const LEAVE_MS = 450
const TOTAL_MS = 2800 // 黑场+淡入+停留+退场，控制在 2.9s 以内
const HOLD_MS = TOTAL_MS - BLACKOUT_MS - ENTER_MS - LEAVE_MS

const RM_BLACKOUT_MS = 100
const RM_ENTER_MS = 150
const RM_HOLD_MS = 500
const RM_LEAVE_MS = 150

type Phase = 'blackout' | 'reveal' | 'leaving'

export default function SplashIntro() {
  const [shouldRender, setShouldRender] = useState(false)
  const [phase, setPhase] = useState<Phase>('blackout')
  const timersRef = useRef<number[]>([])
  const doneRef = useRef(false)
  const reducedMotionRef = useRef(false)

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(id => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  const skip = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    clearAllTimers()
    setPhase('leaving')
    const leaveMs = reducedMotionRef.current ? RM_LEAVE_MS : LEAVE_MS
    const id = window.setTimeout(() => setShouldRender(false), leaveMs)
    timersRef.current.push(id)
  }, [clearAllTimers])

  // 首次挂载：判断这个会话里是否已经看过 splash
  useEffect(() => {
    let seen = true
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
      // 隐私模式等场景 sessionStorage 不可用时，直接跳过 splash，不阻塞页面
      seen = true
    }
    if (seen) return

    try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}

    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const blackoutMs = reducedMotionRef.current ? RM_BLACKOUT_MS : BLACKOUT_MS
    const enterMs = reducedMotionRef.current ? RM_ENTER_MS : ENTER_MS
    const holdMs = reducedMotionRef.current ? RM_HOLD_MS : HOLD_MS

    setShouldRender(true)

    // 先纯黑场停留一小段时间，再让海报开始淡入 + 缓慢放大
    const revealTimer = window.setTimeout(() => setPhase('reveal'), blackoutMs)
    timersRef.current.push(revealTimer)

    const holdTimer = window.setTimeout(skip, blackoutMs + enterMs + holdMs)
    timersRef.current.push(holdTimer)

    return () => clearAllTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 展示期间锁定滚动 + 监听 ESC 跳过
  useEffect(() => {
    if (!shouldRender) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shouldRender, skip])

  if (!shouldRender) return null

  const reduced = reducedMotionRef.current
  const enterMs = reduced ? RM_ENTER_MS : ENTER_MS
  const holdMs = reduced ? RM_HOLD_MS : HOLD_MS
  const leaveMs = reduced ? RM_LEAVE_MS : LEAVE_MS

  // 海报：opacity 只在黑场->显示时切一次（420~450ms），scale 从黑场结束那一刻
  // 起步，用一个覆盖"淡入+停留"全程的过渡时长缓慢走到 1.02，退场阶段不再触发它变化
  const posterOpacity = phase === 'blackout' ? 'opacity-0' : 'opacity-100'
  const posterScale = reduced ? '' : phase === 'blackout' ? 'scale-100' : 'scale-[1.02]'
  const posterTransition = reduced
    ? `opacity ${enterMs}ms ease-out`
    : `opacity ${enterMs}ms ease-out, transform ${enterMs + holdMs}ms ease-out`

  const overlayOpacity = phase === 'leaving' ? 'opacity-0' : 'opacity-100'
  // 用行内 style 控制 transition-duration：Tailwind 的 JIT 只能识别源码里字面出现的
  // class 字符串，`duration-[${leaveMs}ms]` 这种插值拼出来的类名不会被生成对应 CSS。
  const overlayTransition = phase === 'leaving' ? `opacity ${leaveMs}ms ease-out` : 'none'

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#050608] cursor-pointer select-none ${overlayOpacity}`}
      style={{ transition: overlayTransition }}
      onClick={skip}
      role="presentation"
      aria-hidden="true"
    >
      <img
        src="/splash/worldcup-flashback-desktop.png"
        alt=""
        draggable={false}
        style={{ transition: posterTransition }}
        className={`hidden sm:block max-w-full max-h-full object-contain will-change-transform ${posterOpacity} ${posterScale}`}
      />
      <img
        src="/splash/worldcup-flashback-mobile.png"
        alt=""
        draggable={false}
        style={{ transition: posterTransition }}
        className={`block sm:hidden max-w-full max-h-full object-contain will-change-transform ${posterOpacity} ${posterScale}`}
      />
      <span className="absolute bottom-4 right-4 text-white/50 text-[11px] tracking-wide pointer-events-none">
        点击跳过
      </span>
    </div>
  )
}
