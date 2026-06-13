'use client'

import { useState } from 'react'
import type { Match, Prediction } from '@/types'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'
import { MATCH_VENUES } from '@/lib/venues'
import TeamHistoryModal from './TeamHistoryModal'

const KNOCKOUT_STAGES = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final']
const STAGE_LABELS: Record<string, string> = {
  group: '小组赛', round_of_32: '32强', round_of_16: '16强',
  quarter_final: '八强', semi_final: '四强', third_place: '季军赛', final: '决赛',
}

const inputClass = "w-11 text-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 text-gray-900 dark:text-gray-100 font-bold focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-gray-700 transition-colors"
const selectClass = "w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500 transition-colors"

export default function PredictionCard({
  match, gameIds, prediction, onSubmitted,
}: {
  match: Match; gameIds: string[]; prediction?: Prediction; onSubmitted: (pred: Prediction) => void
}) {
  const [homeScore, setHomeScore] = useState(prediction?.pred_home_score?.toString() ?? '')
  const [awayScore, setAwayScore] = useState(prediction?.pred_away_score?.toString() ?? '')
  const [etWinner, setEtWinner] = useState(prediction?.pred_et_winner ?? '')
  const [penaltyWinner, setPenaltyWinner] = useState(prediction?.pred_penalty_winner ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(!!prediction)
  const [historyTeam, setHistoryTeam] = useState<{ tla: string; name: string } | null>(null)

  const isKnockout = KNOCKOUT_STAGES.includes(match.stage)
  const isDraw = homeScore !== '' && awayScore !== '' && homeScore === awayScore
  const showExtraFields = isKnockout && isDraw
  const showPenalty = showExtraFields && etWinner === 'draw'
  const now = new Date()
  const lockTime = new Date(match.lock_time)
  const minutesLeft = Math.floor((lockTime.getTime() - now.getTime()) / 60000)
  const isUrgent = minutesLeft > 0 && minutesLeft < 120
  const isDouble = ['quarter_final', 'semi_final', 'third_place', 'final'].includes(match.stage)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    const body = {
      match_id: match.id,
      pred_home_score: parseInt(homeScore),
      pred_away_score: parseInt(awayScore),
      pred_et_winner: showExtraFields ? etWinner || null : null,
      pred_penalty_winner: showExtraFields ? penaltyWinner || null : null,
    }
    let lastSuccess = null
    for (const gid of gameIds) {
      const res = await fetch('/api/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, game_id: gid }) })
      if (res.ok) { const data = await res.json(); if (!data.skipped) lastSuccess = data }
    }
    if (lastSuccess) { onSubmitted(lastSuccess); setDone(true) }
    else if (gameIds.length > 0) setDone(true)
    else setError('提交失败')
    setLoading(false)
  }

  const kickoff = new Date(match.kickoff_time)
  const homeFlagUrl = getFlagUrl(match.home_tla)
  const awayFlagUrl = getFlagUrl(match.away_tla)
  const homeName = getTeamDisplay(match.home_tla, match.home_team)
  const awayName = getTeamDisplay(match.away_tla, match.away_team)
  const venue = MATCH_VENUES[match.api_match_id]

  if (done && prediction) {
    return (
      <>
      <div className="bg-white dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-700/40 rounded-2xl p-4 space-y-2 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 min-w-0">
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
              {new Date(match.kickoff_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
              {' '}{new Date(match.kickoff_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              {' · '}{STAGE_LABELS[match.stage]}
            </span>
            {venue && <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">📍 {venue.city} · {venue.stadium}</span>}
          </div>
          <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full font-medium shrink-0 ml-2">✓ 已提交</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <button type="button" onClick={() => setHistoryTeam({ tla: match.home_tla!, name: match.home_team })} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-amber-500 dark:hover:text-amber-400 transition-colors">{homeName}</button>
            {homeFlagUrl && <img src={homeFlagUrl} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
          </div>
          <div className="shrink-0 px-3 text-gray-900 dark:text-gray-100 font-bold text-base">{prediction.pred_home_score} – {prediction.pred_away_score}</div>
          <div className="flex items-center gap-1.5 flex-1 justify-start">
            {awayFlagUrl && <img src={awayFlagUrl} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
            <button type="button" onClick={() => setHistoryTeam({ tla: match.away_tla!, name: match.away_team })} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-amber-500 dark:hover:text-amber-400 transition-colors">{awayName}</button>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">竞猜已锁定，不可修改</p>
      </div>
      {historyTeam && (
        <TeamHistoryModal tla={historyTeam.tla} teamName={historyTeam.name} onClose={() => setHistoryTeam(null)} />
      )}
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 min-w-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
            {kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
            {' '}{kickoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            {' · '}{STAGE_LABELS[match.stage]}
            {match.group_name && ` ${match.group_name.replace('GROUP_', '').replace('_', ' ')}组`}
          </span>
          {venue && <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">📍 {venue.city} · {venue.stadium}</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isDouble && <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded font-semibold">🔥 双倍积分</span>}
          {isUrgent && <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full animate-pulse font-medium">{minutesLeft < 60 ? `${minutesLeft}分钟后锁定` : '即将锁定'}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <button type="button" onClick={() => setHistoryTeam({ tla: match.home_tla!, name: match.home_team })} className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right hover:text-amber-500 dark:hover:text-amber-400 transition-colors">{homeName}</button>
          {homeFlagUrl && <img src={homeFlagUrl} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <input type="number" min="0" max="20" value={homeScore} onChange={e => setHomeScore(e.target.value)} required className={inputClass} />
          <span className="text-gray-400 dark:text-gray-500 font-bold">:</span>
          <input type="number" min="0" max="20" value={awayScore} onChange={e => setAwayScore(e.target.value)} required className={inputClass} />
        </div>
        <div className="flex items-center gap-1.5 flex-1 justify-start">
          {awayFlagUrl && <img src={awayFlagUrl} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
          <button type="button" onClick={() => setHistoryTeam({ tla: match.away_tla!, name: match.away_team })} className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-left hover:text-amber-500 dark:hover:text-amber-400 transition-colors">{awayName}</button>
        </div>
      </div>

      {showExtraFields && (
        <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">90分钟平局时需猜加时赛：</p>
          <div>
            <label className="text-xs text-gray-400 dark:text-gray-500 mb-1 block">加时赛胜者</label>
            <select value={etWinner} onChange={e => { setEtWinner(e.target.value); if (e.target.value !== 'draw') setPenaltyWinner('') }} className={selectClass}>
              <option value="">选择</option>
              <option value={match.home_team}>{homeName}</option>
              <option value={match.away_team}>{awayName}</option>
              <option value="draw">平局（进点球）</option>
            </select>
          </div>
          {showPenalty && (
            <div>
              <label className="text-xs text-gray-400 dark:text-gray-500 mb-1 block">点球胜者</label>
              <select value={penaltyWinner} onChange={e => setPenaltyWinner(e.target.value)} className={selectClass}>
                <option value="">选择</option>
                <option value={match.home_team}>{homeName}</option>
                <option value={match.away_team}>{awayName}</option>
              </select>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm">
        {loading ? '提交中...' : '提交预测'}
      </button>

      {historyTeam && (
        <TeamHistoryModal tla={historyTeam.tla} teamName={historyTeam.name} onClose={() => setHistoryTeam(null)} />
      )}
    </form>
  )
}
