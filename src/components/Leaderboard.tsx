'use client'

import { useState, useEffect } from 'react'
import type { LeaderboardEntry } from '@/types'

const MEDALS = ['🥇', '🥈', '🥉']
const RANK_STYLES = [
  'bg-amber-50 border-amber-300 animate-gold-pulse',
  'bg-gray-50 border-gray-300',
  'bg-orange-50/50 border-orange-200',
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

  if (loading) return <div className="text-gray-400 text-sm p-4">加载中...</div>

  const sorted = [...entries].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    return (a.display_name || a.username).localeCompare(b.display_name || b.username)
  })

  const getRank = (idx: number): number => {
    if (idx === 0) return 1
    return sorted[idx].total_points === sorted[idx - 1].total_points ? getRank(idx - 1) : idx + 1
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {sorted.length === 0 ? (
        <div className="p-4 text-gray-400 text-sm">暂无积分数据</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sorted.map((entry, i) => {
            const rank = getRank(i)
            const hasPoints = entry.total_points > 0
            const isTop3 = rank <= 3
            const rankStyle = isTop3 && hasPoints ? RANK_STYLES[rank - 1] : 'border-transparent'

            return (
              <div key={entry.user_id} className={`flex items-center gap-3 px-4 py-3 border-l-2 transition-all hover:bg-gray-50 ${rankStyle}`}>
                <span className="w-6 text-center">
                  {isTop3 && hasPoints
                    ? <span className="text-base">{MEDALS[rank - 1]}</span>
                    : <span className="text-gray-400 text-sm font-medium">{rank}</span>}
                </span>
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt="" className={`w-7 h-7 rounded-full object-cover shrink-0 border-2 ${rank === 1 && hasPoints ? 'border-amber-400' : 'border-gray-200'}`} />
                ) : (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rank === 1 && hasPoints ? 'bg-amber-100 border-2 border-amber-300 text-amber-700' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
                    {(entry.display_name || entry.username)?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className={`flex-1 text-sm font-medium truncate ${rank === 1 && hasPoints ? 'text-amber-700' : 'text-gray-900'}`}>
                  {entry.display_name || entry.username}
                </span>
                <div className="text-right">
                  <div className={`font-bold text-sm ${rank === 1 && hasPoints ? 'text-amber-500' : entry.total_points > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {entry.total_points}分
                  </div>
                  <div className="text-xs text-gray-400">{entry.prediction_count}猜</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
