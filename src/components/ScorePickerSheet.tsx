'use client'
import { useState, useRef, useEffect } from 'react'
import { ScorePicker } from './ScorePicker'

/* ─── 亮/暗两套配色 ─── */
const LIGHT = {
  bg:        'rgba(247, 248, 252, 0.94)',
  blur:      'blur(40px) saturate(200%)',
  border:    '0.5px solid rgba(0,0,0,0.09)',
  handle:    'rgba(0,0,0,0.13)',
  divider:   '0.5px solid rgba(0,0,0,0.07)',
  text:      '#111827',
  cancel:    '#2563EB',
  confirmOn: '#B45309',
  confirmOff:'rgba(0,0,0,0.18)',
  dash:      'rgba(0,0,0,0.22)',
  hint:      'rgba(0,0,0,0.34)',
}
const DARK = {
  bg:        'rgba(13, 16, 28, 0.95)',
  blur:      'blur(40px) saturate(180%)',
  border:    '0.5px solid rgba(255,255,255,0.10)',
  handle:    'rgba(255,255,255,0.18)',
  divider:   '0.5px solid rgba(255,255,255,0.10)',
  text:      'rgba(249,250,251,0.95)',
  cancel:    '#60A5FA',
  confirmOn: '#F59E0B',
  confirmOff:'rgba(255,255,255,0.18)',
  dash:      'rgba(255,255,255,0.30)',
  hint:      'rgba(255,255,255,0.30)',
}

interface Props {
  initialHome: number
  initialAway: number
  hadScore: boolean
  onConfirm: (home: number, away: number) => void
  onClose: () => void
}

export function ScorePickerSheet({ initialHome, initialAway, hadScore, onConfirm, onClose }: Props) {
  const [home, setHome] = useState(initialHome)
  const [away, setAway] = useState(initialAway)
  const [isDark, setIsDark] = useState(false)
  const hasMoved = useRef(false)

  /* Detect and track color scheme */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const c = isDark ? DARK : LIGHT

  function handleHomeChange(v: number) { setHome(v); hasMoved.current = true }
  function handleAwayChange(v: number) { setAway(v); hasMoved.current = true }

  function handleConfirm() {
    if (!hasMoved.current && !hadScore) { onClose(); return }
    onConfirm(home, away)
  }

  const canConfirm = hasMoved.current || hadScore

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: isDark ? 'rgba(0,0,0,0.50)' : 'rgba(0,0,0,0.30)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
      <div
        className="pointer-events-auto w-full mx-5 max-w-xs animate-spring-in"
        style={{
          background: c.bg,
          backdropFilter: c.blur,
          WebkitBackdropFilter: c.blur,
          border: c.border,
          borderRadius: '20px',
          paddingBottom: 16,
          color: c.text,
          /* picker fade matches sheet bg so gradient blends perfectly */
          ['--picker-fade' as string]: c.bg,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: c.handle }} />
        </div>

        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-5 py-2.5"
          style={{ borderBottom: c.divider }}
        >
          <button
            onClick={onClose}
            className="text-sm font-medium"
            style={{ color: c.cancel, minWidth: 56, textAlign: 'left' }}
          >
            放弃
          </button>
          <span className="text-sm font-semibold" style={{ color: c.text }}>
            输入比分
          </span>
          <button
            onClick={handleConfirm}
            className="text-sm font-semibold text-right"
            style={{
              color: canConfirm ? c.confirmOn : c.confirmOff,
              minWidth: 56,
              transition: 'color 0.15s',
            }}
          >
            确认
          </button>
        </div>

        {/* Hint */}
        {!hadScore && (
          <p className="text-center text-xs pt-2.5" style={{ color: c.hint, lineHeight: 1 }}>
            上下滑动选择比分
          </p>
        )}

        {/* Two pickers */}
        <div className="flex items-center justify-center gap-5 py-2">
          <ScorePicker value={home} onChange={handleHomeChange} />
          <span className="text-2xl font-light" style={{ color: c.dash }}>–</span>
          <ScorePicker value={away} onChange={handleAwayChange} />
        </div>
      </div>
      </div>
    </>
  )
}
