'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { Match, Prediction } from '@/types'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'
import { MATCH_VENUES } from '@/lib/venues'
import TeamHistoryModal from './TeamHistoryModal'
import TeamName from './TeamName'

const StadiumMapModal = dynamic(() => import('./StadiumMapModal'), { ssr: false })

const KNOCKOUT_STAGES = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final']
const STAGE_LABELS: Record<string, string> = {
  group: '小组赛', round_of_32: '32强', round_of_16: '16强',
  quarter_final: '八强', semi_final: '四强', third_place: '季军赛', final: '决赛',
}

function IconPin() {
  return (
    <svg viewBox="0 0 10 13" fill="none" style={{ width: 9, height: 11, flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', marginBottom: 1 }}>
      <path d="M5 0.5C2.79 0.5 1 2.29 1 4.5C1 7.75 5 12.5 5 12.5C5 12.5 9 7.75 9 4.5C9 2.29 7.21 0.5 5 0.5Z" fill="currentColor" opacity="0.85"/>
      <circle cx="5" cy="4.5" r="1.5" fill="white" opacity="0.88"/>
    </svg>
  )
}

const inputClass = "w-11 text-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 text-gray-900 dark:text-gray-100 font-bold focus:outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-gray-700 transition-colors"
const selectClass = "w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-400 transition-colors"

export default function PredictionCard({
  match, gameIds, prediction, onSubmitted, onGroupClick,
}: {
  match: Match; gameIds: string[]; prediction?: Prediction; onSubmitted: (pred: Prediction) => void; onGroupClick?: () => void
}) {
  const [homeScore, setHomeScore] = useState(prediction?.pred_home_score?.toString() ?? '')
  const [awayScore, setAwayScore] = useState(prediction?.pred_away_score?.toString() ?? '')
  const [etWinner, setEtWinner] = useState(prediction?.pred_et_winner ?? '')
  const [penaltyWinner, setPenaltyWinner] = useState(prediction?.pred_penalty_winner ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(!!prediction)
  const [historyTeam, setHistoryTeam] = useState<{ tla: string; name: string } | null>(null)
  const [showMap, setShowMap] = useState(false)

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
  const isNearUnpredicted = !prediction && (kickoff.getTime() - now.getTime()) <= 2 * 24 * 60 * 60 * 1000
  const homeFlagUrl = getFlagUrl(match.home_tla)
  const awayFlagUrl = getFlagUrl(match.away_tla)
  const homeName = getTeamDisplay(match.home_tla, match.home_team)
  const awayName = getTeamDisplay(match.away_tla, match.away_team)
  const venue = MATCH_VENUES[match.api_match_id]

  if (done && prediction) {
    return (
      <>
      <div className="glass border-2 border-amber-300/40 dark:border-amber-600/30 rounded-2xl p-4 space-y-2" style={{ boxShadow: '0 0 0 1px rgba(245,158,11,0.08), 0 8px 32px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.65)' }}>
        <div className="flex justify-between items-start">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 min-w-0">
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
              {new Date(match.kickoff_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
              {' '}{new Date(match.kickoff_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              <button type="button" onClick={onGroupClick} className="underline decoration-dotted hover:text-amber-500 transition-colors">
                {STAGE_LABELS[match.stage]}{match.group_name && ` ${match.group_name.replace('GROUP_', '').replace('_', ' ')}组`}
              </button>
            </span>
            {venue && <button type="button" onClick={() => setShowMap(true)} className="text-xs text-gray-400 dark:text-gray-500 shrink-0 hover:text-amber-500 transition-colors"><IconPin /> {venue.city} · {venue.stadium}</button>}
          </div>
          <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full font-medium shrink-0 ml-2">✓ 已提交</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <button type="button" onClick={() => setHistoryTeam({ tla: match.home_tla!, name: match.home_team })} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"><TeamName tla={match.home_tla} zh={homeName} /></button>
            {homeFlagUrl && <img src={homeFlagUrl} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
          </div>
          <div className="shrink-0 px-3 text-gray-900 dark:text-gray-100 font-bold text-base">{prediction.pred_home_score} – {prediction.pred_away_score}</div>
          <div className="flex items-center gap-1.5 flex-1 justify-start">
            {awayFlagUrl && <img src={awayFlagUrl} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
            <button type="button" onClick={() => setHistoryTeam({ tla: match.away_tla!, name: match.away_team })} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"><TeamName tla={match.away_tla} zh={awayName} /></button>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">竞猜已锁定，不可修改</p>
      </div>
      {historyTeam && (
        <TeamHistoryModal tla={historyTeam.tla} teamName={historyTeam.name} onClose={() => setHistoryTeam(null)} />
      )}
      {showMap && venue && (
        <StadiumMapModal
          homeTla={match.home_tla!}
          awayTla={match.away_tla!}
          homeTeam={homeName}
          awayTeam={awayName}
          venue={venue}
          onClose={() => setShowMap(false)}
        />
      )}
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass hover-lift rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-start gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 min-w-0">
          <span className={`text-xs shrink-0 ${isNearUnpredicted ? 'text-red-500 animate-pulse font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
            {kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
            {' '}{kickoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            {' · '}
            <button type="button" onClick={onGroupClick} className="underline decoration-dotted hover:text-amber-500 transition-colors">
              {STAGE_LABELS[match.stage]}{match.group_name && ` ${match.group_name.replace('GROUP_', '').replace('_', ' ')}组`}
            </button>
          </span>
          {venue && <button type="button" onClick={() => setShowMap(true)} className="text-xs text-gray-400 dark:text-gray-500 shrink-0 hover:text-amber-500 transition-colors"><IconPin /> {venue.city} · {venue.stadium}</button>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isDouble && <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded font-semibold">双倍 ×2</span>}
          {isUrgent && <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full animate-pulse font-medium">{minutesLeft < 60 ? `${minutesLeft}分钟后锁定` : '即将锁定'}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <button type="button" onClick={() => setHistoryTeam({ tla: match.home_tla!, name: match.home_team })} className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right hover:text-amber-500 dark:hover:text-amber-400 transition-colors"><TeamName tla={match.home_tla} zh={homeName} /></button>
          {homeFlagUrl && <img src={homeFlagUrl} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <input type="number" min="0" max="20" value={homeScore} onChange={e => setHomeScore(e.target.value)} required className={inputClass} />
          <span className="text-gray-400 dark:text-gray-500 font-bold">:</span>
          <input type="number" min="0" max="20" value={awayScore} onChange={e => setAwayScore(e.target.value)} required className={inputClass} />
        </div>
        <div className="flex items-center gap-1.5 flex-1 justify-start">
          {awayFlagUrl && <img src={awayFlagUrl} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
          <button type="button" onClick={() => setHistoryTeam({ tla: match.away_tla!, name: match.away_team })} className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-left hover:text-amber-500 dark:hover:text-amber-400 transition-colors"><TeamName tla={match.away_tla} zh={awayName} /></button>
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
        className="w-full text-sm font-bold py-3 rounded-xl btn-gold-primary">
        {loading ? '提交中...' : '提交预测'}
      </button>

      {historyTeam && (
        <TeamHistoryModal tla={historyTeam.tla} teamName={historyTeam.name} onClose={() => setHistoryTeam(null)} />
      )}
      {showMap && venue && (
        <StadiumMapModal
          homeTla={match.home_tla!}
          awayTla={match.away_tla!}
          homeTeam={homeName}
          awayTeam={awayName}
          venue={venue}
          onClose={() => setShowMap(false)}
        />
      )}
    </form>
  )
}
