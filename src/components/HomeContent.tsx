'use client'

import { useState, useEffect } from 'react'
import type { GameWithRole, Match, Prediction } from '@/types'
import { useSelectedGame } from '@/hooks/useSelectedGame'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'
import PredictionCard from './PredictionCard'
import Leaderboard from './Leaderboard'
import CreateGameModal from './CreateGameModal'
import JoinGameModal from './JoinGameModal'

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
  const [selectedGameId, setSelectedGameId] = useSelectedGame(games)
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({})
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deletingGame, setDeletingGame] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

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

  function handleGameJoined(game: GameWithRole) {
    setGames(prev => [...prev, game])
    setSelectedGameId(game.id)
    setShowJoinModal(false)
  }

  function copyGameCode() {
    navigator.clipboard.writeText(selectedGameId.slice(0, 8))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDeleteGame() {
    if (!confirm(`确定要删除「${selectedGame?.name}」吗？所有成员和竞猜记录将一并删除，此操作不可恢复。`)) return
    setDeletingGame(true)
    const res = await fetch(`/api/games/${selectedGameId}`, { method: 'DELETE' })
    if (res.ok) {
      const remaining = games.filter(g => g.id !== selectedGameId)
      setGames(remaining)
      setSelectedGameId(remaining[0]?.id ?? '')
    } else {
      const d = await res.json()
      alert(d.error || '删除失败')
    }
    setDeletingGame(false)
  }

  async function handleCalcOnly() {
    setSyncing(true)
    setSyncMsg('')
    const res = await fetch('/api/scores/calculate', { method: 'POST' })
    const data = await res.json()
    setSyncMsg(res.ok ? `积分已计算 (${data.updated}条)` : '计算失败')
    setSyncing(false)
    if (selectedGameId) {
      fetch(`/api/matches?game_id=${selectedGameId}`)
        .then(r => r.json())
        .then(d => { setMatches(d.matches || []); setPredictions(d.predictions || {}) })
    }
    setTimeout(() => setSyncMsg(''), 3000)
  }

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    const res = await fetch('/api/sync-matches', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setSyncMsg('已更新')
      await fetch(`/api/matches?game_id=${selectedGameId}`)
        .then(r => r.json())
        .then(d => { setMatches(d.matches || []); setPredictions(d.predictions || {}) })
    } else {
      setSyncMsg('更新失败')
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(''), 3000)
  }

  function handlePredictionSubmitted(matchId: string, pred: Prediction) {
    setPredictions(prev => ({ ...prev, [matchId]: pred }))
  }

  const [showAllMatches, setShowAllMatches] = useState(false)

  const pendingMatches = matches
    .filter(m => new Date(m.lock_time) > now && m.status === 'scheduled' && !predictions[m.id])
    .slice(0, 3)

  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const displayMatches = showAllMatches
    ? matches
    : matches.filter(m => {
        const t = new Date(m.kickoff_time)
        return t >= oneWeekAgo && t <= oneWeekLater
      })

  if (!selectedGameId) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">⚽</div>
        <p className="text-zinc-400 mb-6">你还没有加入任何 Game</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
          >
            创建 Game
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-6 py-2.5 rounded-lg font-semibold transition-colors"
          >
            加入已有 Game
          </button>
        </div>
        {showCreateModal && <CreateGameModal onCreated={handleGameCreated} onClose={() => setShowCreateModal(false)} />}
        {showJoinModal && <JoinGameModal onJoined={handleGameJoined} onClose={() => setShowJoinModal(false)} />}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Game Selector */}
      <div className="space-y-2">
        <select
          value={selectedGameId}
          onChange={e => setSelectedGameId(e.target.value)}
          className="w-full sm:w-auto bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        >
          {games.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            + 创建
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            + 加入
          </button>
          <button
            onClick={copyGameCode}
            title="复制 Game 码邀请朋友"
            className="text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors font-mono"
          >
            {copied ? '已复制 ✓' : `码: ${selectedGameId.slice(0, 8)}`}
          </button>
          {isAdmin && (
            <button
              onClick={handleDeleteGame}
              disabled={deletingGame}
              className="text-xs text-red-400/50 hover:text-red-400 border border-red-400/20 hover:border-red-400/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {deletingGame ? '删除中...' : '删除 Game'}
            </button>
          )}
        </div>
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
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">2026世界杯赛程安排</h2>
              <button
                onClick={() => setShowAllMatches(prev => !prev)}
                className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-2 py-1 rounded-lg transition-colors"
              >
                {showAllMatches ? '只看近期' : '全部比赛'}
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors"
              >
                <span className={syncing ? 'animate-spin inline-block' : ''}>↻</span>
                <span>{syncing ? '更新中...' : '手动更新'}</span>
              </button>
              <button
                onClick={handleCalcOnly}
                disabled={syncing}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors"
              >
                ★ 计算积分
              </button>
              {syncMsg && <span className="text-xs text-emerald-400">{syncMsg}</span>}
            </div>
            <div className="space-y-2">
              {displayMatches.length === 0 && (
                <p className="text-zinc-500 text-sm">本周暂无比赛，<button onClick={() => setShowAllMatches(true)} className="text-emerald-400 underline">查看全部赛程</button></p>
              )}
              {displayMatches.map(match => {
                const pred = predictions[match.id]
                const isLocked = new Date(match.lock_time) <= now
                const kickoff = new Date(match.kickoff_time)
                const homeTla = getTeamDisplay((match as any).home_tla, match.home_team)
                const awayTla = getTeamDisplay((match as any).away_tla, match.away_team)
                const homeFlagUrl = getFlagUrl((match as any).home_tla)
                const awayFlagUrl = getFlagUrl((match as any).away_tla)
                const group = match.group_name ? match.group_name.replace('GROUP_', '').replace('_', ' ') + '组' : ''

                return (
                  <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 space-y-2 hover:border-zinc-700 transition-colors">
                    {/* Row 1: meta */}
                    <div className="flex justify-between items-center text-xs text-zinc-500">
                      <span>{STAGE_LABELS[match.stage]}{group ? ` · ${group}` : ''}</span>
                      <span>
                        {match.status === 'finished'
                          ? '已结束'
                          : `${kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} ${kickoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
                        }
                      </span>
                    </div>

                    {/* Row 2: teams + score */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        {homeFlagUrl && <img src={homeFlagUrl} alt={homeTla} className="w-6 h-4 object-cover rounded-sm shrink-0" />}
                        <span className="text-sm font-bold tracking-wide">{homeTla}</span>
                      </div>
                      <div className="text-center shrink-0 px-2">
                        {match.status === 'finished' ? (
                          <div>
                            <div className="text-base font-bold text-white leading-tight">
                              {match.home_score_90} – {match.away_score_90}
                            </div>
                            {match.home_score_et != null && match.home_score_pen == null && (
                              <div className="text-xs text-zinc-400 leading-tight mt-0.5">延 {match.home_score_et} – {match.away_score_et}</div>
                            )}
                            {match.home_score_pen != null && (
                              <div className="text-xs text-zinc-400 leading-tight mt-0.5">点球 {match.home_score_pen} – {match.away_score_pen}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-sm font-bold">vs</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 justify-end">
                        <span className="text-sm font-bold tracking-wide">{awayTla}</span>
                        {awayFlagUrl && <img src={awayFlagUrl} alt={awayTla} className="w-6 h-4 object-cover rounded-sm shrink-0" />}
                      </div>
                    </div>

                    {/* Row 3: prediction */}
                    <div className="text-xs border-t border-zinc-800 pt-2">
                      {pred ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-zinc-500 space-y-0.5">
                            <div>我猜：<span className="text-zinc-300 font-mono">{pred.pred_home_score}–{pred.pred_away_score}</span></div>
                            {pred.pred_et_winner && pred.pred_et_winner !== 'draw' && (
                              <div>延时：<span className="text-zinc-300">{pred.pred_et_winner}</span></div>
                            )}
                            {pred.pred_et_winner === 'draw' && pred.pred_penalty_winner && (
                              <div>点球：<span className="text-zinc-300">{pred.pred_penalty_winner}</span></div>
                            )}
                            {pred.pred_et_winner && pred.pred_et_winner !== 'draw' && !pred.pred_penalty_winner && null}
                          </div>
                          {pred.points_earned != null ? (
                            <span className={`shrink-0 ${pred.points_earned > 0 ? 'text-emerald-400 font-semibold' : pred.points_earned < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                              {pred.points_earned > 0 ? `+${pred.points_earned}分` : pred.points_earned < 0 ? `${pred.points_earned}分` : '0分'}
                            </span>
                          ) : (
                            <span className="text-zinc-600 shrink-0">待结算</span>
                          )}
                        </div>
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
      {showJoinModal && (
        <JoinGameModal onJoined={handleGameJoined} onClose={() => setShowJoinModal(false)} />
      )}
    </div>
  )
}
