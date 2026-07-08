'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SESSION_KEY = 'wc_splash_seen'

type Phase = 'entering' | 'visible' | 'leaving'

export default function SplashIntro() {
  const [shouldRender, setShouldRender] = useState(false)
  const [phase, setPhase] = useState<Phase>('entering')
  const timersRef = useRef<number[]>([])
  const rafRef = useRef<number[]>([])
  const doneRef = useRef(false)
  const reducedMotionRef = useRef(false)

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(id => window.clearTimeout(id))
    timersRef.current = []
    rafRef.current.forEach(id => cancelAnimationFrame(id))
    rafRef.current = []
  }, [])

  const skip = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    clearAllTimers()
    setPhase('leaving')
    const leaveMs = reducedMotionRef.current ? 150 : 450
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
    const holdMs = reducedMotionRef.current ? 600 : 1800

    setShouldRender(true)

    // 双 rAF：先让浏览器画出 opacity:0 的初始帧，下一帧再切到 visible，
    // 这样 CSS transition 才会真正播放淡入，而不是直接跳到最终状态
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setPhase('visible'))
      rafRef.current.push(raf2)
    })
    rafRef.current.push(raf1)

    const holdTimer = window.setTimeout(skip, holdMs)
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

  const phaseClass =
    phase === 'visible'
      ? 'opacity-100 scale-100'
      : phase === 'leaving'
        ? 'opacity-0 scale-[1.02]'
        : 'opacity-0 scale-[0.98]'
  const durationClass = phase === 'leaving' ? 'duration-[450ms]' : 'duration-[250ms]'

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#050608] cursor-pointer select-none transition-[opacity,transform] ease-out ${durationClass} ${phaseClass}`}
      onClick={skip}
      role="presentation"
      aria-hidden="true"
    >
      <img
        src="/splash/worldcup-flashback-desktop.png"
        alt=""
        draggable={false}
        className="hidden sm:block max-w-full max-h-full object-contain"
      />
      <img
        src="/splash/worldcup-flashback-mobile.png"
        alt=""
        draggable={false}
        className="block sm:hidden max-w-full max-h-full object-contain"
      />
      <span className="absolute bottom-4 right-4 text-white/50 text-[11px] tracking-wide pointer-events-none">
        点击跳过
      </span>
    </div>
  )
}
