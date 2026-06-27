'use client'
import { useRef, useEffect } from 'react'

const ITEM_H = 44
const SIDE = 2

interface Props {
  value: number
  onChange: (v: number) => void
}

export function ScorePicker({ value, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([])
  const onChangeRef = useRef(onChange)
  const rafRef = useRef(0)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastValue = useRef(value)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // Pure DOM style update — zero React involvement during scroll
  function applyStyles(frac: number) {
    spanRefs.current.forEach((span, d) => {
      if (!span) return
      const dist = Math.abs(d - frac)
      const opacity =
        dist < 0.5 ? 1 :
        dist < 1.5 ? 1 - (dist - 0.5) * 0.58 :
        dist < 2.5 ? 0.42 - (dist - 1.5) * 0.28 :
        0.08
      // Only animate transform + opacity — both GPU-composited, zero layout cost
      const scale =
        dist < 0.5 ? 1 :
        dist < 1.5 ? 1 - (dist - 0.5) * 0.2 :
        Math.max(0.6, 0.8 - (dist - 1.5) * 0.2)
      span.style.opacity = String(Math.max(0.08, opacity))
      span.style.transform = `scale(${scale.toFixed(3)})`
    })
  }

  // Mount: set position instantly + wire up passive scroll listener
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    el.scrollTop = value * ITEM_H
    applyStyles(value)
    lastValue.current = value

    const onScroll = () => {
      // RAF ensures we run once per frame max
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const frac = el.scrollTop / ITEM_H
        applyStyles(frac)

        // Notify parent only after scrolling stops
        if (stopTimer.current) clearTimeout(stopTimer.current)
        stopTimer.current = setTimeout(() => {
          const snapped = Math.min(9, Math.max(0, Math.round(el.scrollTop / ITEM_H)))
          if (snapped !== lastValue.current) {
            lastValue.current = snapped
            onChangeRef.current(snapped)
          }
        }, 80)
      })
    }

    // passive: true is critical — lets the browser scroll without waiting for JS
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
      if (stopTimer.current) clearTimeout(stopTimer.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync when parent changes value (e.g. sheet reopens with existing score)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const target = value * ITEM_H
    if (Math.abs(el.scrollTop - target) > 2) {
      el.scrollTo({ top: target, behavior: 'smooth' })
    }
    applyStyles(value)
    lastValue.current = value
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalH = ITEM_H * (SIDE * 2 + 1)

  return (
    <div
      className="relative select-none overflow-hidden rounded-[14px]"
      style={{ width: 80, height: totalH }}
    >
      {/* Selection band */}
      <div
        className="absolute left-0 right-0 z-10 pointer-events-none"
        style={{
          top: SIDE * ITEM_H,
          height: ITEM_H,
          background: 'rgba(255,255,255,0.08)',
          borderTop: '0.5px solid rgba(255,255,255,0.20)',
          borderBottom: '0.5px solid rgba(255,255,255,0.20)',
        }}
      />

      {/* Scroll container — scroll-snap handles native momentum, no JS snap logic */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-scroll picker-no-scrollbar"
        style={{
          scrollSnapType: 'y mandatory',
          // Promote to GPU layer so scroll composites without main-thread involvement
          willChange: 'scroll-position',
        }}
      >
        {Array.from({ length: SIDE }, (_, i) => <div key={`t${i}`} style={{ height: ITEM_H }} />)}

        {Array.from({ length: 10 }, (_, d) => (
          <div
            key={d}
            style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
            className="flex items-center justify-center"
          >
            <span
              ref={el => { spanRefs.current[d] = el }}
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: 'white',
                letterSpacing: '-0.02em',
                display: 'block',
                // Let browser composite these on GPU without layout recalc
                willChange: 'transform, opacity',
                // Initial visual state — applyStyles() will set correctly after mount
                opacity: d === value ? 1 : 0.3,
                transform: d === value ? 'scale(1)' : 'scale(0.8)',
              }}
            >
              {d}
            </span>
          </div>
        ))}

        {Array.from({ length: SIDE }, (_, i) => <div key={`b${i}`} style={{ height: ITEM_H }} />)}
      </div>

      {/* Fade overlays — colour inherited from --picker-fade on parent */}
      <div
        className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
        style={{ height: ITEM_H * SIDE, background: 'linear-gradient(to bottom, var(--picker-fade) 0%, transparent 100%)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
        style={{ height: ITEM_H * SIDE, background: 'linear-gradient(to top, var(--picker-fade) 0%, transparent 100%)' }}
      />
    </div>
  )
}
