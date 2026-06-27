'use client'
import { useState, useRef } from 'react'
import { ScorePicker } from './ScorePicker'

const SHEET_BG = 'rgba(26,26,28,0.97)'

interface Props {
  initialHome: number
  initialAway: number
  /** true = user had an existing score before opening (edit mode) */
  hadScore: boolean
  onConfirm: (home: number, away: number) => void
  onClose: () => void
}

export function ScorePickerSheet({ initialHome, initialAway, hadScore, onConfirm, onClose }: Props) {
  const [home, setHome] = useState(initialHome)
  const [away, setAway] = useState(initialAway)
  // hasMoved: did the user actually scroll any picker?
  const hasMoved = useRef(false)

  function handleHomeChange(v: number) { setHome(v); hasMoved.current = true }
  function handleAwayChange(v: number) { setAway(v); hasMoved.current = true }

  function handleConfirm() {
    // If user never scrolled AND there was no prior score → treat as cancel
    if (!hasMoved.current && !hadScore) { onClose(); return }
    onConfirm(home, away)
  }

  const canConfirm = hasMoved.current || hadScore

  return (
    <>
      {/* Backdrop — tap to cancel */}
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 animate-sheet-up"
        style={{
          background: SHEET_BG,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '16px 16px 0 0',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          ['--picker-fade' as string]: SHEET_BG,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-2"
          style={{ borderBottom: '0.5px solid rgba(255,255,255,0.10)' }}>
          {/* Cancel — prominent, always safe to tap */}
          <button
            onClick={onClose}
            className="text-sm font-medium"
            style={{ color: '#60A5FA', minWidth: 56, textAlign: 'left' }}
          >
            放弃
          </button>
          <span className="text-sm font-semibold text-white">输入比分</span>
          {/* Confirm — only active after user scrolled or had prior score */}
          <button
            onClick={handleConfirm}
            className="text-sm font-semibold text-right"
            style={{
              color: canConfirm ? '#F59E0B' : 'rgba(255,255,255,0.2)',
              minWidth: 56,
              transition: 'color 0.15s',
            }}
          >
            确认
          </button>
        </div>

        {/* Hint when nothing scrolled yet */}
        {!hadScore && (
          <p className="text-center text-xs pt-2" style={{ color: 'rgba(255,255,255,0.28)', lineHeight: 1 }}>
            上下滑动选择比分
          </p>
        )}

        {/* Two pickers */}
        <div className="flex items-center justify-center gap-5 py-2">
          <ScorePicker value={home} onChange={handleHomeChange} />
          <span className="text-2xl font-light" style={{ color: 'rgba(255,255,255,0.35)' }}>–</span>
          <ScorePicker value={away} onChange={handleAwayChange} />
        </div>
      </div>
    </>
  )
}
