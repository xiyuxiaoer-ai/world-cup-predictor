'use client'

import { useState, useEffect } from 'react'
import type { GameWithRole } from '@/types'

export default function MembersContent({ games }: { games: GameWithRole[] }) {
  const [selectedGameId, setSelectedGameId] = useState(games[0]?.id ?? '')
  const [members, setMembers] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedGameId) return
    setLoading(true)
    Promise.all([
      fetch(`/api/games/${selectedGameId}/members`).then(r => r.json()),
      fetch(`/api/leaderboard?game_id=${selectedGameId}`).then(r => r.json()),
    ]).then(([mem, lb]) => {
      setMembers(Array.isArray(mem) ? mem : [])
      setLeaderboard(Array.isArray(lb) ? lb : [])
      setLoading(false)
    })
  }, [selectedGameId])

  const getPoints = (userId: string) =>
    leaderboard.find(e => e.user_id === userId)?.total_points ?? 0

  const getRank = (userId: string) => {
    const idx = leaderboard.findIndex(e => e.user_id === userId)
    return idx >= 0 ? idx + 1 : null
  }

  const MEDALS = ['🥇', '🥈', '🥉']

  if (!selectedGameId) return <p className="text-zinc-500">你还没有加入任何 Game</p>

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">成员介绍</h1>

      <select
        value={selectedGameId}
        onChange={e => setSelectedGameId(e.target.value)}
        className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
      >
        {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>

      {loading ? (
        <p className="text-zinc-500 text-sm">加载中...</p>
      ) : members.length === 0 ? (
        <p className="text-zinc-500 text-sm">暂无成员</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map(m => {
            const profile = m.profiles
            const userId = m.user_id ?? profile?.id
            const rank = getRank(userId)
            const points = getPoints(userId)
            const initial = (profile?.display_name || profile?.username || '?')[0].toUpperCase()

            return (
              <div key={userId} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex gap-4 items-start">
                <div className="relative shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold">
                      {initial}
                    </div>
                  )}
                  {rank && rank <= 3 && (
                    <span className="absolute -top-1 -right-1 text-base">{MEDALS[rank - 1]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate">{profile?.display_name || profile?.username}</span>
                    <span className={`text-sm font-bold shrink-0 ${points > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {points}分
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">@{profile?.username}</p>
                  {profile?.bio && (
                    <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{profile.bio}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-2">{m.role === 'admin' ? '管理员' : '成员'}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
