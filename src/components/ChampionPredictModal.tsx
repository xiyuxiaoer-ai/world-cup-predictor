'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'
import { STAGE_LABELS } from '@/lib/championBonus'

type Team = { name: string; tla: string }

export default function ChampionPredictModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [teams, setTeams] = useState<Team[]>([])
  const [selected, setSelected] = useState('')
  const [currentBonus, setCurrentBonus] = useState(0)
  const [stageLabel, setStageLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/champion-prediction')
      .then(r => r.json())
      .then(data => {
        setTeams(data.teams || [])
        setCurrentBonus(data.currentBonus || 0)
        setStageLabel(data.currentStageLabel || '')
        setLoading(false)
      })
  }, [])

  const selectedTeam = teams.find(t => t.tla === selected)

  async function handleSubmit() {
    if (!selected || !selectedTeam) { setError('请选择一支球队'); return }
    setSubmitting(true); setError('')
    const res = await fetch('/api/champion-prediction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predicted_team: selectedTeam.name, predicted_team_tla: selectedTeam.tla }),
    })
    const data = await res.json()
    if (res.ok) {
      onSuccess()
    } else {
      setError(data.error || '提交失败')
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-sm animate-spring-in">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" className="text-amber-500 dark:text-amber-400">
              <path d="M6 3H4a1.5 1.5 0 0 0-1.5 1.5v1.5A4 4 0 0 0 6 10M18 3h2a1.5 1.5 0 0 1 1.5 1.5V6a4 4 0 0 1-3.5 3.97" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M6 3h12v6a6 6 0 0 1-12 0V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15v4M8.5 21h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">猜世界杯冠军</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100/70 dark:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-white/20 transition-all tap-scale">
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm text-center py-6">加载中...</p>
        ) : (
          <>
            <div className="glass-sm rounded-xl px-4 py-3 mb-4 flex items-center justify-between" style={{ background: 'rgba(255,237,213,0.45)', borderColor: 'rgba(245,158,11,0.30)' }}>
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400">现在猜可得</p>
                <p className="text-xs text-amber-400/70 mt-0.5">{stageLabel}阶段</p>
              </div>
              <p className="text-2xl font-bold text-amber-500">+{currentBonus} 分</p>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block font-medium">选择你认为的冠军</label>
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="">-- 请选择 --</option>
                {teams.map(t => (
                  <option key={t.tla} value={t.tla}>
                    {getTeamDisplay(t.tla, t.name)}
                  </option>
                ))}
              </select>
            </div>

            {selectedTeam && (
              <div className="flex items-center gap-3 glass-sm rounded-xl px-4 py-3 mb-4">
                {getFlagUrl(selectedTeam.tla) && (
                  <img src={getFlagUrl(selectedTeam.tla)!} alt="" className="w-8 h-5 object-cover rounded" />
                )}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {getTeamDisplay(selectedTeam.tla, selectedTeam.name)}
                </span>
              </div>
            )}

            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

            <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-4">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" className="shrink-0 text-amber-500">
                <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="10.5" r="0.7" fill="currentColor"/>
              </svg>
              提交后不可更改，请谨慎选择
            </p>

            <button
              onClick={handleSubmit}
              disabled={submitting || !selected}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
            >
              {submitting ? '提交中...' : `确认猜 ${selectedTeam ? getTeamDisplay(selectedTeam.tla, selectedTeam.name) : '...'} 夺冠`}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
