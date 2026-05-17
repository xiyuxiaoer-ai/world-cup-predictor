'use client'

import { useState } from 'react'
import type { Match, Prediction } from '@/types'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'

const KNOCKOUT_STAGES = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final']

const STAGE_LABELS: Record<string, string> = {
  group: '小组赛', round_of_32: '32强', round_of_16: '16强',
  quarter_final: '八强', semi_final: '四强', third_place: '季军赛', final: '决赛',
}

export default function PredictionCard({
  match,
  gameIds,
  prediction,
  onSubmitted,
}: {
  match: Match
  gameIds: string[]
  prediction?: Prediction
  onSubmitted: (pred: Prediction) => void
}) {
  const [homeScore, setHomeScore] = useState(prediction?.pred_home_score?.toString() ?? '')
  const [awayScore, setAwayScore] = useState(prediction?.pred_away_score?.toString() ?? '')
  const [etWinner, setEtWinner] = useState(prediction?.pred_et_winner ?? '')
  const [penaltyWinner, setPenaltyWinner] = useState(prediction?.pred_penalty_winner ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(!!prediction)

  const isKnockout = KNOCKOUT_STAGES.includes(match.stage)
  const isDraw = homeScore !== '' && awayScore !== '' && homeScore === awayScore
  const showExtraFields = isKnockout && isDraw
  const showPenalty = showExtraFields && etWinner === 'draw'

  const now = new Date()
  const lockTime = new Date(match.lock_time)
  const minutesLeft = Math.floor((lockTime.getTime() - now.getTime()) / 60000)
  const isUrgent = minutesLeft > 0 && minutesLeft < 120

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const body = {
      match_id: match.id,
      pred_home_score: parseInt(homeScore),
      pred_away_score: parseInt(awayScore),
      pred_et_winner: showExtraFields ? etWinner || null : null,
      pred_penalty_winner: showExtraFields ? penaltyWinner || null : null,
    }

    let lastSuccess = null
    let successCount = 0
    for (const gid of gameIds) {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, game_id: gid }),
      })
      if (res.ok) {
        const data = await res.json()
        lastSuccess = data
        successCount++
      }
    }

    if (lastSuccess) {
      onSubmitted(lastSuccess)
      setDone(true)
      if (gameIds.length > 1) setError('')
    } else {
      setError('提交失败')
    }
    setLoading(false)
  }

  const kickoff = new Date(match.kickoff_time)

  if (done && prediction) {
    return (
      <div className="bg-zinc-900 border border-emerald-500/20 rounded-xl p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-500">
            {new Date(match.kickoff_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
            {' '}{new Date(match.kickoff_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            {match.group_name && ` · ${match.group_name.replace('GROUP_', '').replace('_', ' ')}组`}
          </span>
          <span className="text-xs text-emerald-400">✓ 已提交</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <span className="text-sm font-medium">{getTeamDisplay(match.home_tla, match.home_team)}</span>
            {getFlagUrl(match.home_tla) && <img src={getFlagUrl(match.home_tla)!} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
          </div>
          <div className="shrink-0 px-3 text-white font-bold text-base">
            {prediction.pred_home_score} – {prediction.pred_away_score}
          </div>
          <div className="flex items-center gap-1.5 flex-1 justify-start">
            {getFlagUrl(match.away_tla) && <img src={getFlagUrl(match.away_tla)!} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
            <span className="text-sm font-medium">{getTeamDisplay(match.away_tla, match.away_team)}</span>
          </div>
        </div>
        <p className="text-xs text-zinc-600 text-center">竞猜已锁定，不可修改</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs text-zinc-500">
          {kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
          {' '}
          {kickoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          {' · '}
          {STAGE_LABELS[match.stage]}
          {match.group_name && ` ${match.group_name.replace('GROUP_', '').replace('_', ' ')}组`}
          {['quarter_final', 'semi_final', 'third_place', 'final'].includes(match.stage) && (
            <span className="ml-2 text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-xs font-semibold">🔥 双倍积分，把握机会！</span>
          )}
        </span>
        {isUrgent && (
          <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full animate-pulse">
            {minutesLeft < 60 ? `${minutesLeft}分钟后锁定` : '即将锁定'}
          </span>
        )}
        {done && (
          <span className="text-xs text-emerald-400">✓ 已提交</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <span className="text-sm font-medium text-right">{getTeamDisplay(match.home_tla, match.home_team)}</span>
          {getFlagUrl(match.home_tla) && (
            <img src={getFlagUrl(match.home_tla)!} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number" min="0" max="20"
            value={homeScore}
            onChange={e => setHomeScore(e.target.value)}
            required
            className="w-11 text-center bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <span className="text-zinc-500 font-bold">:</span>
          <input
            type="number" min="0" max="20"
            value={awayScore}
            onChange={e => setAwayScore(e.target.value)}
            required
            className="w-11 text-center bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-1 justify-start">
          {getFlagUrl(match.away_tla) && (
            <img src={getFlagUrl(match.away_tla)!} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />
          )}
          <span className="text-sm font-medium text-left">{getTeamDisplay(match.away_tla, match.away_team)}</span>
        </div>
      </div>

      {showExtraFields && (
        <div className="space-y-2 border-t border-zinc-800 pt-3">
          <p className="text-xs text-zinc-400">90分钟平局时需猜加时赛：</p>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">加时赛胜者</label>
            <select
              value={etWinner}
              onChange={e => { setEtWinner(e.target.value); if (e.target.value !== 'draw') setPenaltyWinner('') }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">选择</option>
              <option value={match.home_team}>{getTeamDisplay(match.home_tla, match.home_team)}</option>
              <option value={match.away_team}>{getTeamDisplay(match.away_tla, match.away_team)}</option>
              <option value="draw">平局（进点球）</option>
            </select>
          </div>
          {showPenalty && (
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">点球胜者</label>
              <select
                value={penaltyWinner}
                onChange={e => setPenaltyWinner(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">选择</option>
                <option value={match.home_team}>{getTeamDisplay(match.home_tla, match.home_team)}</option>
                <option value={match.away_team}>{getTeamDisplay(match.away_tla, match.away_team)}</option>
              </select>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
      >
        {loading ? '提交中...' : prediction ? '更新预测' : '提交预测'}
      </button>
    </form>
  )
}
