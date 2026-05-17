'use client'

import { useState, useEffect } from 'react'
import type { GameWithRole } from '@/types'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'

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

  if (!selectedGameId) return <p className="text-zinc-500">你还没有加入任何 Game</p>

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">竞猜记录</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={selectedGameId}
          onChange={e => setSelectedGameId(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
        >
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="flex gap-1">
          {(['all', 'finished', 'upcoming'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === f ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>
              {f === 'all' ? '全部' : f === 'finished' ? '已结束' : '待开赛'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">加载中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm">暂无记录</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(pred => {
            const match = pred.matches
            const isFinished = match?.status === 'finished'
            const kickoff = new Date(match?.kickoff_time)
            const group = match?.group_name ? `· ${match.group_name.replace('GROUP_', '').replace('_', ' ')}组` : ''

            return (
              <div key={pred.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{STAGE_LABELS[match?.stage]} {group}</span>
                  <span>{kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} {kickoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <span className="text-sm font-medium">{getTeamDisplay(match?.home_tla, match?.home_team)}</span>
                    {getFlagUrl(match?.home_tla) && <img src={getFlagUrl(match?.home_tla)!} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
                  </div>
                  <div className="text-center w-16 shrink-0">
                    {isFinished
                      ? <span className="text-white font-bold text-sm">{match.home_score_90}–{match.away_score_90}</span>
                      : <span className="text-zinc-600 text-xs">vs</span>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 justify-start">
                    {getFlagUrl(match?.away_tla) && <img src={getFlagUrl(match?.away_tla)!} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" />}
                    <span className="text-sm font-medium">{getTeamDisplay(match?.away_tla, match?.away_team)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm border-t border-zinc-800 pt-2">
                  <span className="text-zinc-400">我猜：<span className="text-white font-mono">{pred.pred_home_score}–{pred.pred_away_score}</span></span>
                  {pred.points_earned != null ? (
                    <span className={`font-bold ${pred.points_earned > 0 ? 'text-emerald-400' : pred.points_earned < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                      {pred.points_earned > 0 ? `+${pred.points_earned}` : pred.points_earned}分
                    </span>
                  ) : isFinished ? (
                    <span className="text-zinc-500 text-xs">待结算</span>
                  ) : (
                    <span className="text-zinc-600 text-xs">未开赛</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
