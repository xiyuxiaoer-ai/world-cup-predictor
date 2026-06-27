'use client'
import { useRef, useEffect, useCallback, useState } from 'react'

const ITEM_H = 44
const SIDE = 2   // items above/below center (5 total visible)

interface Props {
  value: number
  onChange: (v: number) => void
}

export function ScorePicker({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [frac, setFrac] = useState(value)
  const mounted = useRef(false)
  const totalH = ITEM_H * (SIDE * 2 + 1)

  // Set initial scroll position without animation, and sync parent immediately
  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    const el = ref.current
    if (el) el.scrollTop = value * ITEM_H
    setFrac(value)
    onChange(value)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync when parent changes value from outside
  useEffect(() => {
    if (!mounted.current) return
    const el = ref.current
    if (!el) return
    const target = value * ITEM_H
    if (Math.abs(el.scrollTop - target) > 2) {
      el.scrollTo({ top: target, behavior: 'smooth' })
    }
  }, [value])

  const handleScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    const exact = el.scrollTop / ITEM_H
    setFrac(exact)
    onChange(Math.min(9, Math.max(0, Math.round(exact))))
  }, [onChange])

  return (
    <div
      className="relative select-none overflow-hidden rounded-[14px]"
      style={{ width: 72, height: totalH }}
    >
      {/* Selection band — iOS-style neutral tint */}
      <div
        className="absolute left-0 right-0 z-10 pointer-events-none rounded-xl"
        style={{
          top: SIDE * ITEM_H,
          height: ITEM_H,
          background: 'rgba(120,120,128,0.10)',
          borderTop: '0.5px solid rgba(120,120,128,0.22)',
          borderBottom: '0.5px solid rgba(120,120,128,0.22)',
        }}
      />

      {/* Scrollable digits */}
      <div
        ref={ref}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-scroll picker-no-scrollbar"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {/* Top padding */}
        {Array.from({ length: SIDE }, (_, i) => (
          <div key={`t${i}`} style={{ height: ITEM_H }} />
        ))}

        {Array.from({ length: 10 }, (_, d) => {
          const dist = Math.abs(d - frac)
          // Opacity: 1 at center → fades with distance
          const opacity =
            dist < 0.5 ? 1 :
            dist < 1.5 ? 1 - (dist - 0.5) * 0.55 :
            dist < 2.5 ? 0.45 - (dist - 1.5) * 0.3 :
            0.08
          const scale = Math.max(0.78, 1 - Math.min(dist, 2.2) * 0.1)
          const fontSize = dist < 0.5 ? 30 : dist < 1.5 ? 26 : 22

          return (
            <div
              key={d}
              style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
              className="flex items-center justify-center"
            >
              <span
                className="tabular-nums font-bold text-gray-900 dark:text-white"
                style={{
                  fontSize,
                  opacity: Math.max(0.08, opacity),
                  transform: `scale(${scale})`,
                  letterSpacing: '-0.02em',
                }}
              >
                {d}
              </span>
            </div>
          )
        })}

        {/* Bottom padding */}
        {Array.from({ length: SIDE }, (_, i) => (
          <div key={`b${i}`} style={{ height: ITEM_H }} />
        ))}
      </div>

      {/* Top fade — matches modal glass bg */}
      <div
        className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
        style={{
          height: ITEM_H * SIDE,
          background: 'linear-gradient(to bottom, var(--picker-bg-top) 0%, transparent 100%)',
        }}
      />
      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
        style={{
          height: ITEM_H * SIDE,
          background: 'linear-gradient(to top, var(--picker-bg-bot) 0%, transparent 100%)',
        }}
      />
    </div>
  )
}
