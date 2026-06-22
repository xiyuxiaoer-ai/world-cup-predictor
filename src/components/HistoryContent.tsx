'use client'

import { useState, useEffect } from 'react'
import type { GameWithRole } from '@/types'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'
import TeamHistoryModal from './TeamHistoryModal'

const STAGE_LABELS: Record<string, string> = {
  group: '小组赛', round_of_32: '32强', round_of_16: '16强',
  quarter_final: '八强', semi_final: '四强', third_place: '季军赛', final: '决赛',
}

type Filter = 'all' | 'finished' | 'upcoming'

export default function HistoryContent({ games }: { games: GameWithRole[] }) {
  const [selectedGameId, setSelectedGameId] = useState(games[0]?.id ?? '')
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [historyTeam, setHistoryTeam] = useState<{ tla: string; name: string } | null>(null)

  useEffect(() => {
    if (!selectedGameId) return
    setLoading(true)
    fetch(`/api/predictions?game_id=${selectedGameId}`)
      .then(r => r.json())
      .then(data => { setPredictions(Array.isArray(data) ? data : []); setLoading(false) })
  }, [selectedGameId])

  const filtered = predictions
    .filter(p => {
      if (filter === 'finished') return p.matches?.status === 'finished'
      if (filter === 'upcoming') return p.matches?.status !== 'finished'
      return true
    })
    .sort((a, b) => new Date(b.matches?.kickoff_time).getTime() - new Date(a.matches?.kickoff_time).getTime())

  if (!selectedGameId) return <p className="text-gray-500 dark:text-gray-400">你还没有加入任何 Game</p>

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">竞猜记录</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={selectedGameId}
          onChange={e => setSelectedGameId(e.target.value)}
          className="glass rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
        >
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="flex gap-1">
          {(['all', 'finished', 'upcoming'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all tap-scale ${
                filter === f
                  ? 'bg-amber-500 text-gray-900 shadow-sm'
                  : 'glass text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              style={filter === f ? { boxShadow: '0 0 12px rgba(245,158,11,0.3)' } : {}}
            >
              {f === 'all' ? '全部' : f === 'finished' ? '已结束' : '待开赛'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">加载中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">暂无记录</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((pred, idx) => {
            const match = pred.matches
            const isFinished = match?.status === 'finished'
            const kickoff = new Date(match?.kickoff_time)
            const group = match?.group_name ? `· ${match.group_name.replace('GROUP_', '').replace('_', ' ')}组` : ''

            return (
              <div key={pred.id}
                className="glass hover-lift rounded-xl p-4 space-y-3 animate-stagger-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{STAGE_LABELS[match?.stage]} {group}</span>
                  <span>{kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} {kickoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <button
                      className="text-sm font-medium hover:text-amber-500 transition-colors"
                      onClick={() => setHistoryTeam({ tla: match?.home_tla, name: match?.home_team })}
                    >{getTeamDisplay(match?.home_tla, match?.home_team)}</button>
                    {getFlagUrl(match?.home_tla) && <img src={getFlagUrl(match?.home_tla)!} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
                  </div>
                  <div className="text-center w-16 shrink-0">
                    {isFinished
                      ? <span className="text-gray-900 dark:text-gray-100 font-bold text-sm">{match.home_score_90}–{match.away_score_90}</span>
                      : <span className="text-zinc-600 text-xs">vs</span>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 justify-start">
                    {getFlagUrl(match?.away_tla) && <img src={getFlagUrl(match?.away_tla)!} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
                    <button
                      className="text-sm font-medium hover:text-amber-500 transition-colors"
                      onClick={() => setHistoryTeam({ tla: match?.away_tla, name: match?.away_team })}
                    >{getTeamDisplay(match?.away_tla, match?.away_team)}</button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm border-t border-black/[0.05] dark:border-white/[0.05] pt-2">
                  <span className="text-gray-400 dark:text-gray-500">我猜：<span className="text-gray-900 dark:text-gray-100 font-mono">{pred.pred_home_score}–{pred.pred_away_score}</span></span>
                  {pred.points_earned != null ? (
                    <span className={`font-bold ${pred.points_earned > 0 ? 'text-amber-500' : pred.points_earned < 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {pred.points_earned > 0 ? `+${pred.points_earned}` : pred.points_earned}分
                    </span>
                  ) : isFinished ? (
                    <span className="text-gray-500 dark:text-gray-400 text-xs">待结算</span>
                  ) : (
                    <span className="text-zinc-600 text-xs">未开赛</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {historyTeam && (
        <TeamHistoryModal tla={historyTeam.tla} teamName={historyTeam.name} onClose={() => setHistoryTeam(null)} />
      )}
    </div>
  )
}
