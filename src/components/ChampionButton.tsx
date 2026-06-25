'use client'

import { useState, useEffect } from 'react'
import { getTeamDisplay } from '@/lib/flags'
import ChampionPredictModal from './ChampionPredictModal'
import { STAGE_LABELS } from '@/lib/championBonus'

export default function ChampionButton() {
  const [prediction, setPrediction] = useState<any>(null)
  const [currentBonus, setCurrentBonus] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch('/api/champion-prediction')
      .then(r => r.json())
      .then(data => {
        setPrediction(data.prediction)
        setCurrentBonus(data.currentBonus)
        setIsLocked(data.isLocked)
        setLoading(false)
      })
  }, [])

  if (loading) return null

  if (prediction) {
    const teamName = getTeamDisplay(prediction.predicted_team_tla, prediction.predicted_team)
    const stageLabel = STAGE_LABELS[prediction.stage_at_prediction] || prediction.stage_at_prediction
    const date = new Date(prediction.predicted_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
    return (
      <div className="mt-4 pt-4 border-t border-amber-100 dark:border-amber-800/30">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-gray-700 dark:text-gray-200">
            <span className="mr-1 inline-flex items-center gap-1">
              <svg viewBox="0 0 12 12" width="11" height="11" fill="none" className="text-amber-500"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              已猜：
            </span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">{teamName}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{date} · {stageLabel}阶段</span>
          </div>
          <span className="text-sm font-bold text-amber-500 shrink-0">+{prediction.bonus_points} 分</span>
        </div>
        {prediction.is_correct === true && (
          <p className="flex items-center gap-1 text-xs text-amber-500 mt-1 font-medium">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
              <path d="M8 1v2.5M8 12.5V15M1 8h2.5M12.5 8H15M3 3l1.8 1.8M11.2 11.2L13 13M13 3l-1.8 1.8M4.8 11.2L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="8" cy="8" r="2.5" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            猜中了！积分已到账
          </p>
        )}
        {prediction.is_correct === false && (
          <p className="text-xs text-gray-400 mt-1">未猜中，继续加油</p>
        )}
      </div>
    )
  }

  if (isLocked) {
    return (
      <div className="mt-4 pt-4 border-t border-amber-100 dark:border-amber-800/30">
        <p className="text-xs text-gray-400 dark:text-gray-500">彩蛋已锁定，半决赛后不可再猜</p>
      </div>
    )
  }

  return (
    <>
      <div className="mt-4 pt-4 border-t border-amber-100 dark:border-amber-800/30">
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <span className="flex items-center justify-center gap-2">
            马上猜冠军，可得 +{currentBonus} 分
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        </button>
      </div>
      {showModal && (
        <ChampionPredictModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); window.location.reload() }}
        />
      )}
    </>
  )
}
