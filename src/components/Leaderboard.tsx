'use client'

import { useState, useEffect } from 'react'
import type { LeaderboardEntry } from '@/types'
import { getTeamDisplay } from '@/lib/flags'

const MEDALS = ['🥇', '🥈', '🥉']
const RANK_STYLES = [
  'bg-amber-50 dark:bg-amber-900/20 border-amber-300 animate-gold-pulse',
  'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600',
  'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/30',
]

const STAGE_LABELS: Record<string, string> = {
  group: '小组赛', round_of_32: '32强', round_of_16: '16强',
  quarter_final: '八强', semi_final: '四强', third_place: '季军赛', final: '决赛',
}

export default function Leaderboard({ gameId }: { gameId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null)
  const [breakdown, setBreakdown] = useState<any[]>([])
  const [bdLoading, setBdLoading] = useState(false)

  useEffect(() => {
    if (!gameId) return
    setLoading(true)
    fetch(`/api/leaderboard?game_id=${gameId}`)
      .then(r => r.json())
      .then(data => { setEntries(data || []); setLoading(false) })
  }, [gameId])

  function openBreakdown(entry: LeaderboardEntry) {
    setSelected(entry)
    setBreakdown([])
    setBdLoading(true)
    fetch(`/api/leaderboard/breakdown?game_id=${gameId}&user_id=${entry.user_id}`)
      .then(r => r.json())
      .then(data => { setBreakdown(Array.isArray(data) ? data : []); setBdLoading(false) })
  }

  if (loading) return <div className="text-gray-400 dark:text-gray-500 text-sm p-4">加载中...</div>

  const sorted = [...entries].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    return (a.display_name || a.username).localeCompare(b.display_name || b.username)
  })

  const getRank = (idx: number): number => {
    if (idx === 0) return 1
    return sorted[idx].total_points === sorted[idx - 1].total_points ? getRank(idx - 1) : idx + 1
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        {sorted.length === 0 ? (
          <div className="p-4 text-gray-400 dark:text-gray-500 text-sm">暂无积分数据</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map((entry, i) => {
              const rank = getRank(i)
              const hasPoints = entry.total_points > 0
              const isTop3 = rank <= 3
              const rankStyle = isTop3 && hasPoints ? RANK_STYLES[rank - 1] : 'border-transparent'

              return (
                <button
                  key={entry.user_id}
                  onClick={() => openBreakdown(entry)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-l-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-left ${rankStyle}`}
                >
                  <span className="w-6 text-center shrink-0">
                    {isTop3 && hasPoints
                      ? <span className="text-base">{MEDALS[rank - 1]}</span>
                      : <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">{rank}</span>}
                  </span>
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className={`w-7 h-7 rounded-full object-cover shrink-0 border-2 ${rank === 1 && hasPoints ? 'border-amber-400' : 'border-gray-200 dark:border-gray-700'}`} />
                  ) : (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rank === 1 && hasPoints ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 text-amber-700' : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                      {(entry.display_name || entry.username)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className={`flex-1 text-sm font-medium truncate ${rank === 1 && hasPoints ? 'text-amber-700' : 'text-gray-900 dark:text-gray-100'}`}>
                    {entry.display_name || entry.username}
                  </span>
                  <div className="text-right shrink-0">
                    <div className={`font-bold text-sm ${rank === 1 && hasPoints ? 'text-amber-500' : entry.total_points > 0 ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {entry.total_points}分
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {entry.prediction_count}猜
                      {entry.pending_count > 0 && (
                        <span className={`ml-1 font-medium ${entry.pending_count > 5 ? 'text-green-500' : entry.pending_count > 3 ? 'text-yellow-500' : 'text-red-500'}`}>
                          · {entry.pending_count}待开
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Breakdown Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                {selected.avatar_url ? (
                  <img src={selected.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-amber-300" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-bold text-amber-700">
                    {(selected.display_name || selected.username)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {selected.display_name || selected.username}
                  </div>
                  <div className="text-xs text-amber-500 font-bold">共 {selected.total_points} 分</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {bdLoading ? (
                <div className="p-6 text-center text-gray-400 text-sm">加载中...</div>
              ) : breakdown.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">暂无积分记录</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {breakdown.map((item: any, idx: number) => {
                    const m = item.match
                    if (!m) return null
                    const homeName = getTeamDisplay(m.home_tla, m.home_team)
                    const awayName = getTeamDisplay(m.away_tla, m.away_team)
                    const points = item.points_earned
                    const groupLabel = m.group_name ? ` ${m.group_name.replace('GROUP_', '').replace('_', ' ')}组` : ''
                    return (
                      <div key={idx} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {homeName} vs {awayName}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-2">
                            <span>{STAGE_LABELS[m.stage]}{groupLabel}</span>
                            {m.home_score_90 != null && (
                              <span className="text-gray-500 dark:text-gray-400 font-mono">
                                结果 {m.home_score_90}–{m.away_score_90} · 猜 {item.pred_home_score}–{item.pred_away_score}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`text-sm font-bold shrink-0 ${points > 0 ? 'text-amber-500' : points < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {points > 0 ? `+${points}` : points}分
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
