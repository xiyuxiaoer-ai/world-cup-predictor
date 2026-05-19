'use client'

import { useState, useEffect } from 'react'
import type { GameWithRole } from '@/types'
import { useSelectedGame } from '@/hooks/useSelectedGame'
import InviteMemberModal from './InviteMemberModal'
import ScrollingBanner from './ScrollingBanner'

export default function MembersContent({ games, currentUserId }: { games: GameWithRole[]; currentUserId: string }) {
  const [selectedGameId, setSelectedGameId] = useSelectedGame(games)
  const [members, setMembers] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const selectedGame = games.find(g => g.id === selectedGameId)
  const isAdmin = selectedGame?.role === 'admin'

  function loadMembers() {
    if (!selectedGameId) return
    setLoading(true)
    Promise.all([
      fetch(`/api/games/${selectedGameId}/members`).then(r => r.json()),
      fetch(`/api/leaderboard?game_id=${selectedGameId}`).then(r => r.json()),
    ]).then(([mem, lb]) => {
      const lbList = Array.isArray(lb) ? lb : []
      const memList = Array.isArray(mem) ? mem : []
      memList.sort((a, b) =>
        new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
      )
      setMembers(memList)
      setLeaderboard(lbList)
      setLoading(false)
    })
  }

  useEffect(() => { loadMembers() }, [selectedGameId])

  async function handleDeleteMember(userId: string, name: string) {
    if (!confirm(`确定要将「${name}」移出此 Game 吗？`)) return
    setDeletingId(userId)
    const res = await fetch(`/api/games/${selectedGameId}/members/${userId}`, { method: 'DELETE' })
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.user_id !== userId))
      fetch(`/api/leaderboard?game_id=${selectedGameId}`)
        .then(r => r.json())
        .then(lb => setLeaderboard(Array.isArray(lb) ? lb : []))
    } else {
      const d = await res.json()
      alert(d.error || '删除失败')
    }
    setDeletingId(null)
  }

  const getPoints = (userId: string) =>
    leaderboard.find(e => e.user_id === userId)?.total_points ?? 0

  const getRank = (userId: string) => {
    const idx = leaderboard.findIndex(e => e.user_id === userId)
    return idx >= 0 ? idx + 1 : null
  }

  const MEDALS = ['🥇', '🥈', '🥉']

  const memberBannerItems = members.length > 0
    ? members.map(m => `👤 ${m.profiles?.display_name || m.profiles?.username || '成员'}`)
    : ['👋 邀请朋友加入', '🎮 一起竞猜', '⚽ World Cup 2026', '🏆 看谁猜得最准']

  if (!selectedGameId) return <p className="text-gray-500">你还没有加入任何 Game</p>

  return (
    <div className="space-y-5">
      <ScrollingBanner items={memberBannerItems} peek={false} />
      <h1 className="text-xl font-bold">成员介绍</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedGameId}
          onChange={e => setSelectedGameId(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-amber-500 shadow-sm"
        >
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button
          onClick={() => setShowInviteModal(true)}
          className="text-sm text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-400 px-3 py-2 rounded-lg transition-colors font-medium"
        >
          + 邀请成员
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">加载中...</p>
      ) : members.length === 0 ? (
        <p className="text-gray-500 text-sm">暂无成员</p>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map(m => {
            const profile = m.profiles
            const userId = m.user_id ?? profile?.id
            const rank = getRank(userId)
            const points = getPoints(userId)
            const initial = (profile?.display_name || profile?.username || '?')[0].toUpperCase()
            const isSelf = userId === currentUserId

            return (
              <div key={userId} className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-4 items-start">
                <div className="relative shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-amber-600 text-xl font-bold">
                      {initial}
                    </div>
                  )}
                  {rank && rank <= 3 && points > 0 && (
                    <span className="absolute -top-1 -right-1 text-base">{MEDALS[rank - 1]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate">{profile?.display_name || profile?.username}</span>
                    <span className={`text-sm font-bold shrink-0 ${points > 0 ? 'text-amber-500' : 'text-gray-500'}`}>
                      {points}分
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">@{profile?.username}</p>
                  {profile?.bio && (
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">{profile.bio}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">{m.role === 'admin' ? '管理员' : '成员'}</p>
                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => handleDeleteMember(userId, profile?.display_name || profile?.username)}
                        disabled={deletingId === userId}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        {deletingId === userId ? '移除中...' : '移除'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {/* tj1.png 透明背景托举人物，微微抖动 */}
        <div className="flex justify-center -mt-4 pointer-events-none">
          <img src="/tj1.png" alt="" className="animate-hold-shake" style={{ width: 400, height: 'auto' }} />
        </div>
        </>
      )}
      {showInviteModal && (
        <InviteMemberModal gameId={selectedGameId} onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  )
}
