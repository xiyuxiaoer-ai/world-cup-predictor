'use client'

import { useState, useEffect } from 'react'
import type { LeaderboardEntry } from '@/types'

const MEDALS = ['🥇', '🥈', '🥉']

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

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {entries.length === 0 ? (
        <div className="p-4 text-zinc-500 text-sm">暂无积分数据</div>
      ) : (
        <div className="divide-y divide-zinc-800">
          {entries.map((entry, i) => (
            <div key={entry.user_id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 text-center text-sm">
                {i < 3 ? MEDALS[i] : <span className="text-zinc-500">{i + 1}</span>}
              </span>
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                {(entry.display_name || entry.username)?.[0]?.toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-medium truncate">{entry.display_name || entry.username}</span>
              <div className="text-right">
                <div className={`font-bold text-sm ${entry.total_points > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {entry.total_points}分
                </div>
                <div className="text-xs text-zinc-500">{entry.prediction_count}猜</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
