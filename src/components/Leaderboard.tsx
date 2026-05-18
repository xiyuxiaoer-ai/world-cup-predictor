'use client'

import { useState, useEffect } from 'react'
import type { LeaderboardEntry } from '@/types'

const MEDALS = ['🥇', '🥈', '🥉']
const RANK_STYLES = [
  'bg-yellow-500/10 border-yellow-500/30 animate-gold-pulse',
  'bg-zinc-500/15 border-zinc-400/25',
  'bg-amber-900/5 border-amber-800/10',
]

export default function Leaderboard({ gameId }: { gameId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gameId) return
    setLoading(true)
    fetch(`/api/leaderboard?game_id=${gameId}`)
      .then(r => r.json())
      .then(data => { setEntries(data || []); setLoading(false) })
  }, [gameId])

  if (loading) return <div className="text-zinc-500 text-sm p-4">加载中...</div>

  // 积分降序，同分按名字升序
  const sorted = [...entries].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    return (a.display_name || a.username).localeCompare(b.display_name || b.username)
  })

  // 计算真实排名（同分同名次）
  const getRank = (idx: number): number => {
    if (idx === 0) return 1
    return sorted[idx].total_points === sorted[idx - 1].total_points
      ? getRank(idx - 1)
      : idx + 1
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {sorted.length === 0 ? (
        <div className="p-4 text-zinc-500 text-sm">暂无积分数据</div>
      ) : (
        <div className="divide-y divide-zinc-800">
          {sorted.map((entry, i) => {
            const rank = getRank(i)
            const isTop3 = rank <= 3
            const hasPoints = entry.total_points > 0
            const rankStyle = isTop3 ? RANK_STYLES[rank - 1] : 'border-transparent'

            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 px-4 py-3 border-l-2 transition-colors ${rankStyle}`}
              >
                <span className="w-6 text-center">
                  {isTop3 && hasPoints
                    ? <span className="text-base">{MEDALS[rank - 1]}</span>
                    : <span className="text-zinc-500 text-sm">{rank}</span>}
                </span>
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt="" className={`w-7 h-7 rounded-full object-cover shrink-0 border ${rank === 1 && hasPoints ? 'border-yellow-500/40' : 'border-zinc-600'}`} />
                ) : (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    rank === 1 && hasPoints
                      ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400'
                      : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  }`}>
                    {(entry.display_name || entry.username)?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className={`flex-1 text-sm font-medium truncate ${rank === 1 && hasPoints ? 'text-yellow-100' : ''}`}>
                  {entry.display_name || entry.username}
                </span>
                <div className="text-right">
                  <div className={`font-bold text-sm ${
                    rank === 1 && hasPoints ? 'text-yellow-400' : entry.total_points > 0 ? 'text-emerald-400' : 'text-zinc-400'
                  }`}>
                    {entry.total_points}分
                  </div>
                  <div className="text-xs text-zinc-500">{entry.prediction_count}猜</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
