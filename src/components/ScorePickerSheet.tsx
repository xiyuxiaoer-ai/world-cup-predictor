'use client'
import { useState } from 'react'
import { ScorePicker } from './ScorePicker'

const SHEET_BG = 'rgba(26,26,28,0.97)'

interface Props {
  initialHome: number
  initialAway: number
  onConfirm: (home: number, away: number) => void
  onClose: () => void
}

export function ScorePickerSheet({ initialHome, initialAway, onConfirm, onClose }: Props) {
  const [home, setHome] = useState(initialHome)
  const [away, setAway] = useState(initialAway)

  return (
    <>
      {/* Backdrop */}
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
          // Override picker fade vars to match this dark sheet background
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
          <button onClick={onClose}
            className="text-sm font-normal"
            style={{ color: 'rgba(255,255,255,0.45)', minWidth: 44 }}>
            取消
          </button>
          <span className="text-sm font-semibold text-white">输入比分</span>
          <button onClick={() => onConfirm(home, away)}
            className="text-sm font-semibold text-right"
            style={{ color: '#F59E0B', minWidth: 44 }}>
            确认
          </button>
        </div>

        {/* Two pickers */}
        <div className="flex items-center justify-center gap-5 py-2">
          <ScorePicker value={home} onChange={setHome} />
          <span className="text-2xl font-light" style={{ color: 'rgba(255,255,255,0.35)' }}>–</span>
          <ScorePicker value={away} onChange={setAway} />
        </div>
      </div>
    </>
  )
}
