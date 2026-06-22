'use client'

import { useState, useEffect } from 'react'
import GroupModal from './GroupModal'
import type { GameWithRole, Match, Prediction } from '@/types'
import { useSelectedGame } from '@/hooks/useSelectedGame'
import { getFlagUrl, getTeamDisplay, getTeamJa } from '@/lib/flags'
import PredictionCard from './PredictionCard'
import TeamName from './TeamName'
import Leaderboard from './Leaderboard'
import CreateGameModal from './CreateGameModal'
import JoinGameModal from './JoinGameModal'
import TeamHistoryModal from './TeamHistoryModal'
import ChampionEggModal from './ChampionEggModal'
import ChampionPredictModal from './ChampionPredictModal'
import { calculateChampionBonus } from '@/lib/championBonus'

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
  const [confirmDeleteGame, setConfirmDeleteGame] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [leaderboardKey, setLeaderboardKey] = useState(0)
  const [historyTeam, setHistoryTeam] = useState<{ tla: string; name: string } | null>(null)
  const [groupModal, setGroupModal] = useState<{ stage: string; group_name: string | null; label: string } | null>(null)
  const [showEggModal, setShowEggModal] = useState(false)
  const [showPredictModal, setShowPredictModal] = useState(false)
  const [eggBonus, setEggBonus] = useState(0)

  const selectedGame = games.find(g => g.id === selectedGameId)
  const isAdmin = selectedGame?.role === 'admin'
  const now = new Date()

  useEffect(() => {
    // 检查是否已猜过，未猜且本次 session 未关闭过则弹出
    if (sessionStorage.getItem('egg_dismissed')) return
    fetch('/api/champion-prediction')
      .then(r => r.json())
      .then(data => {
        if (!data.prediction && !data.isLocked) {
          setEggBonus(data.currentBonus || calculateChampionBonus())
          setShowEggModal(true)
        }
      })
      .catch(() => {})
  }, [])

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
    setConfirmDeleteGame(false)
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

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    const res = await fetch('/api/sync-matches', { method: 'POST' })
    if (res.ok) {
      setSyncMsg('已更新')
      await fetch(`/api/matches?game_id=${selectedGameId}`)
        .then(r => r.json())
        .then(d => { setMatches(d.matches || []); setPredictions(d.predictions || {}) })
      setLeaderboardKey(k => k + 1)
    } else {
      setSyncMsg('更新失败')
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(''), 3000)
  }

  function handlePredictionSubmitted(matchId: string, pred: Prediction) {
    setPredictions(prev => ({ ...prev, [matchId]: pred }))
  }

  const [finishedExpanded, setFinishedExpanded] = useState(false)
  const [showGameActions, setShowGameActions] = useState(false)

  const pendingMatches = matches
    .filter(m => new Date(m.lock_time) > now && m.status === 'scheduled' && !predictions[m.id])
    .slice(0, 3)

  const displayMatches = matches

  function renderMatch(match: Match, idx = 0) {
    const pred = predictions[match.id]
    const isLocked = new Date(match.lock_time) <= now
    const kickoff = new Date(match.kickoff_time)
    const homeTla = getTeamDisplay((match as any).home_tla, match.home_team)
    const awayTla = getTeamDisplay((match as any).away_tla, match.away_team)
    const homeFlagUrl = getFlagUrl((match as any).home_tla)
    const awayFlagUrl = getFlagUrl((match as any).away_tla)
    const homeJa = getTeamJa((match as any).home_tla)
    const awayJa = getTeamJa((match as any).away_tla)
    const group = match.group_name ? match.group_name.replace('GROUP_', '').replace('_', ' ') + '组' : ''

    return (
      <div key={match.id}
        className="glass hover-lift rounded-xl px-3 py-3 space-y-2 animate-stagger-in"
        style={{ animationDelay: `${idx * 55}ms` }}
      >
        <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500">
          <button
            type="button"
            onClick={() => setGroupModal({
              stage: match.stage,
              group_name: match.group_name ?? null,
              label: `${STAGE_LABELS[match.stage]}${group ? ' ' + group : ''}`,
            })}
            className="underline decoration-dotted hover:text-amber-500 transition-colors"
          >
            {STAGE_LABELS[match.stage]}{group ? ` · ${group}` : ''}
          </button>
          <span>
            {match.status === 'finished'
              ? '已结束'
              : `${kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} ${kickoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
            }
          </span>
        </div>
        <div className="relative flex items-center">
          <div className="w-1/2 flex flex-col pr-10">
            <div className="flex items-center gap-1.5">
              {homeFlagUrl && <img src={homeFlagUrl} alt={homeTla} className="w-6 h-4 object-cover rounded-sm shrink-0" />}
              <button type="button" onClick={() => setHistoryTeam({ tla: (match as any).home_tla, name: match.home_team })} className="text-sm font-bold tracking-wide hover:text-amber-500 transition-colors">{homeTla}</button>
            </div>
            {homeJa && <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 pl-[30px]">{homeJa}</span>}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 text-center top-1/2 -translate-y-1/2">
            {match.status === 'finished' ? (
              <div>
                <div className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {match.home_score_90} – {match.away_score_90}
                </div>
                {match.home_score_et != null && match.home_score_pen == null && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 leading-tight mt-0.5">延 {match.home_score_et} – {match.away_score_et}</div>
                )}
                {match.home_score_pen != null && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 leading-tight mt-0.5">点球 {match.home_score_pen} – {match.away_score_pen}</div>
                )}
              </div>
            ) : (
              <span className="text-gray-300 dark:text-gray-600 text-sm font-bold">vs</span>
            )}
          </div>
          <div className="w-1/2 flex flex-col pl-10 items-end">
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setHistoryTeam({ tla: (match as any).away_tla, name: match.away_team })} className="text-sm font-bold tracking-wide hover:text-amber-500 transition-colors">{awayTla}</button>
              {awayFlagUrl && <img src={awayFlagUrl} alt={awayTla} className="w-6 h-4 object-cover rounded-sm shrink-0" />}
            </div>
            {awayJa && <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 pr-[30px]">{awayJa}</span>}
          </div>
        </div>
        <div className="text-xs border-t border-black/[0.06] dark:border-white/10 pt-2">
          {pred ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                我猜：<span className="text-gray-700 dark:text-gray-200 font-mono">{pred.pred_home_score}–{pred.pred_away_score}</span>
                {pred.pred_et_winner && pred.pred_et_winner !== 'draw' && (
                  <> · 延:<span className="text-zinc-300">{pred.pred_et_winner}</span></>
                )}
                {pred.pred_et_winner === 'draw' && pred.pred_penalty_winner && (
                  <> · 点球:<span className="text-zinc-300">{pred.pred_penalty_winner}</span></>
                )}
              </span>
              {pred.points_earned != null ? (
                <span className={`shrink-0 ${pred.points_earned > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : pred.points_earned < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                  {pred.points_earned > 0 ? `+${pred.points_earned}分` : pred.points_earned < 0 ? `${pred.points_earned}分` : '0分'}
                </span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 shrink-0">待结算</span>
              )}
            </div>
          ) : isLocked ? (
            <span className="text-gray-400 dark:text-gray-500">未猜</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">待猜</span>
          )}
        </div>
      </div>
    )
  }

  if (!selectedGameId) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">⚽</div>
        <p className="text-zinc-400 mb-6">你还没有加入任何 Game</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm glow-amber tap-scale"
          >
            创建 Game
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="glass px-6 py-2.5 rounded-lg font-semibold text-gray-600 dark:text-gray-300 hover-lift tap-scale"
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
        <div className="flex items-center gap-1.5">
          <select
            value={selectedGameId}
            onChange={e => setSelectedGameId(e.target.value)}
            className="glass rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all"
          >
            {games.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          {/* 竖排三点：Chrome ⋮ 风格，与 select 同行 */}
          <button
            onClick={() => setShowGameActions(p => !p)}
            title="管理 Game"
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all tap-scale ${
              showGameActions
                ? 'bg-black/10 dark:bg-white/[0.12] text-gray-700 dark:text-gray-200'
                : 'text-gray-400 dark:text-gray-500 hover:bg-black/[0.07] dark:hover:bg-white/[0.08] hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <svg viewBox="0 0 4 18" width="4" height="18" fill="currentColor">
              <circle cx="2" cy="2" r="1.6"/>
              <circle cx="2" cy="9" r="1.6"/>
              <circle cx="2" cy="16" r="1.6"/>
            </svg>
          </button>
        </div>
        {/* 展开的操作按钮 */}
        <div className="flex items-center gap-2 flex-wrap">
          {showGameActions && (
            <>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent hover:bg-white/40 dark:hover:bg-white/[0.06] border border-gray-300/60 dark:border-white/[0.12] hover:border-gray-400/70 dark:hover:border-white/20 px-3 py-1.5 rounded-lg transition-all tap-scale"
              >
                + 创建
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent hover:bg-white/40 dark:hover:bg-white/[0.06] border border-gray-300/60 dark:border-white/[0.12] hover:border-gray-400/70 dark:hover:border-white/20 px-3 py-1.5 rounded-lg transition-all tap-scale"
              >
                + 加入
              </button>
              <button
                onClick={copyGameCode}
                title="复制 Game 码邀请朋友"
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent hover:bg-white/40 dark:hover:bg-white/[0.06] border border-gray-300/60 dark:border-white/[0.12] hover:border-gray-400/70 dark:hover:border-white/20 px-3 py-1.5 rounded-lg font-mono transition-all tap-scale"
              >
                {copied ? '✓ 已复制' : `码: ${selectedGameId.slice(0, 8)}`}
              </button>
            </>
          )}
          {isAdmin && !confirmDeleteGame && (
            <button
              onClick={() => setConfirmDeleteGame(true)}
              disabled={deletingGame}
              className="text-xs text-red-500/50 hover:text-red-500 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {deletingGame ? '删除中...' : '删除 Game'}
            </button>
          )}
          {isAdmin && confirmDeleteGame && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-500">确定删除「{selectedGame?.name}」？</span>
              <button onClick={handleDeleteGame} className="text-xs text-red-500 border border-red-400/50 px-2 py-1 rounded-lg">确定</button>
              <button onClick={() => setConfirmDeleteGame(false)} className="text-xs text-zinc-400 border border-zinc-700 px-2 py-1 rounded-lg">取消</button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 dark:text-gray-500 text-sm">加载中...</div>
      ) : (
        <>
          {/* Top: Todo + Leaderboard */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="block w-[3px] h-4 rounded-full bg-amber-400" />
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">待竞猜</h2>
              </div>
              {pendingMatches.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm">暂无待竞猜比赛 🎉</p>
              ) : (
                <div className="space-y-3">
                  {pendingMatches.map(match => (
                    <PredictionCard
                      key={match.id}
                      match={match}
                      gameIds={games.map(g => g.id)}
                      prediction={predictions[match.id]}
                      onSubmitted={pred => handlePredictionSubmitted(match.id, pred)}
                      onGroupClick={() => setGroupModal({
                        stage: match.stage,
                        group_name: match.group_name ?? null,
                        label: `${STAGE_LABELS[match.stage]}${match.group_name ? ' ' + match.group_name.replace('GROUP_', '').replace('_', ' ') + '组' : ''}`,
                      })}
                    />
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="block w-[3px] h-4 rounded-full bg-amber-400" />
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">积分榜</h2>
              </div>
              <Leaderboard key={leaderboardKey} gameId={selectedGameId} />
            </div>
          </div>

          {/* Full Schedule */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="block w-[3px] h-4 rounded-full bg-amber-400" />
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">赛程安排</h2>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
              >
                <span className={syncing ? 'animate-spin inline-block' : ''}>↻</span>
                <span>{syncing ? '更新中...' : '手动更新'}</span>
              </button>
              {syncMsg && <span className="text-xs text-amber-500">{syncMsg}</span>}
            </div>
            <div className="space-y-2">
              {displayMatches.length === 0 && (
                <p className="text-zinc-500 text-sm">暂无赛程</p>
              )}
              {/* 已结束比赛 - 折叠区 */}
              {(() => {
                const finished = displayMatches.filter(m => m.status === 'finished')
                const upcoming = displayMatches.filter(m => m.status !== 'finished')
                return (
                  <>
                    {finished.length > 0 && (
                      <div>
                        <button
                          onClick={() => setFinishedExpanded(p => !p)}
                          className="w-full flex items-center gap-2 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <svg viewBox="0 0 6 10" width="6" height="10" fill="currentColor" className={`transition-transform duration-200 shrink-0 ${finishedExpanded ? 'rotate-90' : ''}`}><path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                          <span>已结束 {finished.length} 场</span>
                          <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        </button>
                        {finishedExpanded && (
                          <div className="space-y-2 mt-1">
                            {finished.map((match, i) => renderMatch(match, i))}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      {upcoming.map((match, i) => renderMatch(match, i))}
                    </div>
                  </>
                )
              })()}
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
      {historyTeam && (
        <TeamHistoryModal tla={historyTeam.tla} teamName={historyTeam.name} onClose={() => setHistoryTeam(null)} />
      )}

      {groupModal && (
        <GroupModal
          label={groupModal.label}
          matches={matches
            .filter(m => groupModal.group_name ? (m as any).group_name === groupModal.group_name : m.stage === groupModal.stage)
            .sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime())
            .map(m => ({
              ...(m as any),
              userPrediction: predictions[m.id]
                ? { pred_home_score: predictions[m.id].pred_home_score, pred_away_score: predictions[m.id].pred_away_score }
                : null
            }))}
          gameIds={games.map(g => g.id)}
          onClose={() => setGroupModal(null)}
          onPredictionSaved={() => {
            fetch(`/api/matches?game_id=${selectedGameId}`)
              .then(r => r.json())
              .then(d => { setMatches(d.matches || []); setPredictions(d.predictions || {}) })
          }}
        />
      )}
      {showEggModal && (
        <ChampionEggModal
          currentBonus={eggBonus}
          onPredict={() => { setShowEggModal(false); setShowPredictModal(true) }}
          onDismiss={() => { setShowEggModal(false); sessionStorage.setItem('egg_dismissed', '1') }}
        />
      )}
      {showPredictModal && (
        <ChampionPredictModal
          onClose={() => setShowPredictModal(false)}
          onSuccess={() => { setShowPredictModal(false); sessionStorage.setItem('egg_dismissed', '1') }}
        />
      )}
    </div>
  )
}
