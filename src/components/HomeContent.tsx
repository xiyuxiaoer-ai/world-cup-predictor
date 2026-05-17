'use client'

import { useState, useEffect } from 'react'
import type { GameWithRole, Match, Prediction } from '@/types'
import PredictionCard from './PredictionCard'
import Leaderboard from './Leaderboard'
import CreateGameModal from './CreateGameModal'
import InviteMemberModal from './InviteMemberModal'

const STAGE_LABELS: Record<string, string> = {
  group: '小组赛',
  round_of_32: '32强',
  round_of_16: '16强',
  quarter_final: '八强',
  semi_final: '四强',
  third_place: '季军赛',
  final: '决赛',
}

export default function HomeContent({ initialGames }: { initialGames: GameWithRole[] }) {
  const [games, setGames] = useState(initialGames)
  const [selectedGameId, setSelectedGameId] = useState(initialGames[0]?.id ?? '')
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({})
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const selectedGame = games.find(g => g.id === selectedGameId)
  const isAdmin = selectedGame?.role === 'admin'
  const now = new Date()

  useEffect(() => {
    if (!selectedGameId) return
    setLoading(true)
    fetch(`/api/matches?game_id=${selectedGameId}`)
      .then(r => r.json())
      .then(data => {
        setMatches(data.matches || [])
        setPredictions(data.predictions || {})
        setLoading(false)
      })
  }, [selectedGameId])

  function handleGameCreated(game: GameWithRole) {
    setGames(prev => [...prev, game])
    setSelectedGameId(game.id)
    setShowCreateModal(false)
  }

  function handlePredictionSubmitted(matchId: string, pred: Prediction) {
    setPredictions(prev => ({ ...prev, [matchId]: pred }))
  }

  const pendingMatches = matches
    .filter(m => new Date(m.lock_time) > now && m.status === 'scheduled' && !predictions[m.id])
    .slice(0, 5)

  if (!selectedGameId) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">⚽</div>
        <p className="text-zinc-400 mb-6">你还没有加入任何 Game</p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
        >
          创建第一个 Game
        </button>
        {showCreateModal && (
          <CreateGameModal onCreated={handleGameCreated} onClose={() => setShowCreateModal(false)} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Game Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedGameId}
          onChange={e => setSelectedGameId(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        >
          {games.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-2 rounded-lg transition-colors"
        >
          + 创建 Game
        </button>
        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500 px-3 py-2 rounded-lg transition-colors"
          >
            + 邀请成员
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm">加载中...</div>
      ) : (
        <>
          {/* Top: Todo + Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">待竞猜</h2>
              {pendingMatches.length === 0 ? (
                <p className="text-zinc-500 text-sm">暂无待竞猜比赛 🎉</p>
              ) : (
                <div className="space-y-3">
                  {pendingMatches.map(match => (
                    <PredictionCard
                      key={match.id}
                      match={match}
                      gameId={selectedGameId}
                      prediction={predictions[match.id]}
                      onSubmitted={pred => handlePredictionSubmitted(match.id, pred)}
                    />
                  ))}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">积分榜</h2>
              <Leaderboard gameId={selectedGameId} />
            </div>
          </div>

          {/* Full Schedule */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">完整赛程</h2>
            <div className="space-y-2">
              {matches.map(match => {
                const pred = predictions[match.id]
                const isLocked = new Date(match.lock_time) <= now
                const kickoff = new Date(match.kickoff_time)

                return (
                  <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-4">
                    <div className="text-xs text-zinc-500 w-16 shrink-0">
                      <div>{STAGE_LABELS[match.stage]}</div>
                      {match.group_name && (
                        <div>{match.group_name.replace('GROUP_', '').replace('_', ' ')}组</div>
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-right flex-1 truncate">{match.home_team}</span>
                      <div className="text-center shrink-0 w-24">
                        {match.status === 'finished' ? (
                          <span className="font-bold text-emerald-400 text-sm">
                            {match.home_score_90} - {match.away_score_90}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-xs">
                            {kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                            {' '}
                            {kickoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-left flex-1 truncate">{match.away_team}</span>
                    </div>
                    <div className="text-xs text-right w-20 shrink-0">
                      {pred ? (
                        <span className={`font-mono ${pred.points_earned != null ? (pred.points_earned > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-400'}`}>
                          {pred.pred_home_score}-{pred.pred_away_score}
                          {pred.points_earned != null && ` (${pred.points_earned > 0 ? '+' : ''}${pred.points_earned})`}
                        </span>
                      ) : isLocked ? (
                        <span className="text-zinc-600">未猜</span>
                      ) : (
                        <span className="text-zinc-500">待猜</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {showCreateModal && (
        <CreateGameModal onCreated={handleGameCreated} onClose={() => setShowCreateModal(false)} />
      )}
      {showInviteModal && (
        <InviteMemberModal gameId={selectedGameId} onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  )
}
