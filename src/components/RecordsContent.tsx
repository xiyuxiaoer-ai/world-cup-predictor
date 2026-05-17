'use client'

import { useState, useEffect } from 'react'
import type { GameWithRole } from '@/types'
import { useSelectedGame } from '@/hooks/useSelectedGame'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'

const STAGE_LABELS: Record<string, string> = {
  group: '小组赛', round_of_32: '32强', round_of_16: '16强',
  quarter_final: '八强', semi_final: '四强', third_place: '季军赛', final: '决赛',
}

type Filter = 'all' | 'finished' | 'upcoming'

export default function RecordsContent({ games }: { games: GameWithRole[] }) {
  const [selectedGameId, setSelectedGameId] = useSelectedGame(games)
  const [matches, setMatches] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    if (!selectedGameId) return
    setLoading(true)
    fetch(`/api/records?game_id=${selectedGameId}`)
      .then(r => r.json())
      .then(data => {
        setMatches(data.matches || [])
        setMembers(data.members || [])
        setLoading(false)
      })
  }, [selectedGameId])

  const filtered = matches.filter(m => {
    if (filter === 'finished') return m.status === 'finished'
    if (filter === 'upcoming') return m.status !== 'finished'
    return true
  })

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    const res = await fetch('/api/sync-matches', { method: 'POST' })
    if (res.ok) {
      setSyncMsg('已更新')
      if (selectedGameId) {
        fetch(`/api/records?game_id=${selectedGameId}`)
          .then(r => r.json())
          .then(data => { setMatches(data.matches || []); setMembers(data.members || []) })
      }
    } else {
      setSyncMsg('更新失败')
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(''), 3000)
  }

  if (!selectedGameId) return <p className="text-zinc-500">你还没有加入任何 Game</p>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">竞猜记录</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors"
          >
            <span className={syncing ? 'animate-spin inline-block' : ''}>↻</span>
            <span>{syncing ? '更新中...' : '手动更新'}</span>
          </button>
          {syncMsg && <span className="text-xs text-emerald-400">{syncMsg}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={selectedGameId}
          onChange={e => setSelectedGameId(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
        >
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="flex gap-1">
          {(['upcoming', 'all'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === f ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>
              {f === 'all' ? '全部' : '待开赛'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">加载中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm">暂无比赛</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(match => {
            const kickoff = new Date(match.kickoff_time)
            const group = match.group_name
              ? `· ${match.group_name.replace('GROUP_', '').replace('_', ' ')}组`
              : ''
            const isFinished = match.status === 'finished'
            const homeFlagUrl = getFlagUrl(match.home_tla)
            const awayFlagUrl = getFlagUrl(match.away_tla)
            const homeName = getTeamDisplay(match.home_tla, match.home_team)
            const awayName = getTeamDisplay(match.away_tla, match.away_team)
            const hasPredicted = !!match.user_prediction
            const predictions: any[] = match.predictions || []

            return (
              <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {/* Match Header */}
                <div className="px-4 py-3 space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{STAGE_LABELS[match.stage]} {group}</span>
                    <span>
                      {kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      {' '}
                      {kickoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <span className="text-sm font-bold">{homeName}</span>
                      {homeFlagUrl && <img src={homeFlagUrl} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
                    </div>
                    <div className="text-center shrink-0 px-2">
                      {isFinished ? (
                        <div>
                          <div className="text-base font-bold text-white leading-tight">{match.home_score_90} – {match.away_score_90}</div>
                          {match.home_score_et != null && match.home_score_pen == null && (
                            <div className="text-xs text-zinc-400 leading-tight mt-0.5">延 {match.home_score_et} – {match.away_score_et}</div>
                          )}
                          {match.home_score_pen != null && (
                            <div className="text-xs text-zinc-400 leading-tight mt-0.5">点球 {match.home_score_pen} – {match.away_score_pen}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-sm">vs</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 justify-start">
                      {awayFlagUrl && <img src={awayFlagUrl} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
                      <span className="text-sm font-bold">{awayName}</span>
                    </div>
                  </div>
                </div>

                {/* Predictions Table */}
                {hasPredicted ? (
                  <div className="border-t border-zinc-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-zinc-500 bg-zinc-800/50">
                          <th className="text-left px-4 py-2 font-medium">成员</th>
                          <th className="text-center px-3 py-2 font-medium">竞猜</th>
                          <th className="text-right px-4 py-2 font-medium">积分</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {predictions.map(pred => {
                          const profile = pred.profiles
                          const name = profile?.display_name || profile?.username || '未知'
                          const initial = name[0].toUpperCase()
                          const predHome = pred.pred_home_score
                          const predAway = pred.pred_away_score
                          const points = pred.points_earned

                          let resultIcon = null
                          if (isFinished && points != null) {
                            resultIcon = points > 0 ? '✓' : '✗'
                          }

                          return (
                            <tr key={pred.id} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                                      {initial}
                                    </div>
                                  )}
                                  <span className="truncate max-w-[80px]">{name}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center text-white">
                                <span className="font-mono">{predHome}–{predAway}</span>
                                {pred.pred_et_winner && pred.pred_et_winner !== 'draw' && (
                                  <span className="text-zinc-400 text-xs"> · 延:{pred.pred_et_winner}</span>
                                )}
                                {pred.pred_et_winner === 'draw' && pred.pred_penalty_winner && (
                                  <span className="text-zinc-400 text-xs"> · 点球:{pred.pred_penalty_winner}</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold">
                                {points != null ? (
                                  <span className={points > 0 ? 'text-emerald-400' : points < 0 ? 'text-red-400' : 'text-zinc-500'}>
                                    {points > 0 ? `+${points}` : points}
                                  </span>
                                ) : (
                                  <span className="text-zinc-600 font-normal text-xs">待结算</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border-t border-zinc-800 px-4 py-3 flex items-center gap-2 text-xs text-zinc-500">
                    <span>🔒</span>
                    <span>请先提交竞猜，才能查看其他成员的预测</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
