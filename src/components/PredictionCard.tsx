'use client'

import { useState } from 'react'
import type { Match, Prediction } from '@/types'

const KNOCKOUT_STAGES = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final']

export default function PredictionCard({
  match,
  gameId,
  prediction,
  onSubmitted,
}: {
  match: Match
  gameId: string
  prediction?: Prediction
  onSubmitted: (pred: Prediction) => void
}) {
  const [homeScore, setHomeScore] = useState(prediction?.pred_home_score?.toString() ?? '')
  const [awayScore, setAwayScore] = useState(prediction?.pred_away_score?.toString() ?? '')
  const [etWinner, setEtWinner] = useState(prediction?.pred_et_winner ?? '')
  const [penaltyWinner, setPenaltyWinner] = useState(prediction?.pred_penalty_winner ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const isKnockout = KNOCKOUT_STAGES.includes(match.stage)
  const isDraw = homeScore !== '' && awayScore !== '' && homeScore === awayScore
  const showExtraFields = isKnockout && isDraw

  const now = new Date()
  const lockTime = new Date(match.lock_time)
  const minutesLeft = Math.floor((lockTime.getTime() - now.getTime()) / 60000)
  const isUrgent = minutesLeft > 0 && minutesLeft < 120

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_id: gameId,
        match_id: match.id,
        pred_home_score: parseInt(homeScore),
        pred_away_score: parseInt(awayScore),
        pred_et_winner: showExtraFields ? etWinner || null : null,
        pred_penalty_winner: showExtraFields ? penaltyWinner || null : null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || '提交失败')
    } else {
      onSubmitted(data)
      setDone(true)
    }
    setLoading(false)
  }

  const kickoff = new Date(match.kickoff_time)

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs text-zinc-500">
          {kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
          {' '}
          {kickoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          {match.group_name && ` · ${match.group_name.replace('GROUP_', '').replace('_', ' ')}组`}
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

      <div className="flex items-center gap-3">
        <span className="flex-1 text-right text-sm font-medium truncate">{match.home_team}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number" min="0" max="20"
            value={homeScore}
            onChange={e => setHomeScore(e.target.value)}
            required
            className="w-12 text-center bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <span className="text-zinc-500 font-bold">:</span>
          <input
            type="number" min="0" max="20"
            value={awayScore}
            onChange={e => setAwayScore(e.target.value)}
            required
            className="w-12 text-center bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <span className="flex-1 text-left text-sm font-medium truncate">{match.away_team}</span>
      </div>

      {showExtraFields && (
        <div className="space-y-2 border-t border-zinc-800 pt-3">
          <p className="text-xs text-zinc-400">平局时需猜加时赛和点球：</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">加时赛胜者</label>
              <select
                value={etWinner}
                onChange={e => setEtWinner(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">选择</option>
                <option value={match.home_team}>{match.home_team}</option>
                <option value={match.away_team}>{match.away_team}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">点球胜者</label>
              <select
                value={penaltyWinner}
                onChange={e => setPenaltyWinner(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">选择</option>
                <option value={match.home_team}>{match.home_team}</option>
                <option value={match.away_team}>{match.away_team}</option>
              </select>
            </div>
          </div>
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
