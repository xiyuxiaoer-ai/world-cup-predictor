'use client'

import { useState, useEffect } from 'react'
import type { GameWithRole } from '@/types'
import { useSelectedGame } from '@/hooks/useSelectedGame'
import InviteMemberModal from './InviteMemberModal'
import TeamHistoryModal from './TeamHistoryModal'
import { getTeamDisplay, getFlagUrl } from '@/lib/flags'
import { STAGE_LABELS } from '@/lib/championBonus'

const CARD_IMAGES = [
  '/cards/1.png', '/cards/2.png', '/cards/3.png', '/cards/4.png',
  '/cards/5.png', '/cards/6.png', '/cards/7.png', '/cards/8.png',
  '/cards/9.png', '/cards/10.png', '/cards/11.png', '/cards/12.png',
]

export default function MembersContent({ games, currentUserId }: { games: GameWithRole[]; currentUserId: string }) {
  const [selectedGameId, setSelectedGameId] = useSelectedGame(games)
  const [members, setMembers] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [cardImages, setCardImages] = useState<Record<string, string>>({})
  const [champPreds, setChampPreds] = useState<Record<string, any>>({})
  const [historyTeam, setHistoryTeam] = useState<{ tla: string; name: string } | null>(null)

  function handleCardFlip(userId: string) {
    setFlippedCards(prev => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
        setCardImages(p => ({
          ...p,
          [userId]: CARD_IMAGES[Math.floor(Math.random() * CARD_IMAGES.length)],
        }))
      }
      return next
    })
  }

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
    // 取所有人的彩蛋预测
    fetch(`/api/champion-prediction/members?game_id=${selectedGameId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map: Record<string, any> = {}
          for (const p of data) map[p.user_id] = p
          setChampPreds(map)
        }
      })
      .catch(() => {})
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


  if (!selectedGameId) return <p className="text-gray-500 dark:text-gray-400">你还没有加入任何 Game</p>

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">成员介绍</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedGameId}
          onChange={e => setSelectedGameId(e.target.value)}
          className="glass rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
        >
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button
          onClick={() => setShowInviteModal(true)}
          className="text-sm text-amber-600 glass px-3 py-2 rounded-lg font-medium glow-amber tap-scale"
          style={{ boxShadow: '0 0 0 1px rgba(245,158,11,0.25)' }}
        >
          + 邀请成员
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">加载中...</p>
      ) : members.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">暂无成员</p>
      ) : (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {members.map((m, memberIdx) => {
            const profile = m.profiles
            const userId = m.user_id ?? profile?.id
            const rank = getRank(userId)
            const points = getPoints(userId)
            const initial = (profile?.display_name || profile?.username || '?')[0].toUpperCase()
            const isSelf = userId === currentUserId

            const isFlipped = flippedCards.has(userId)

            return (
              <div key={userId}
                className="card-flip-container rounded-2xl animate-stagger-in"
                style={{ height: 250, animationDelay: `${memberIdx * 70}ms` }}
                onClick={() => handleCardFlip(userId)}
              >
              <div className={`card-flip-inner ${isFlipped ? 'flipped' : ''}`}>

              {/* 正面：成员信息（竖向排列） */}
              <div className="card-face glass hover-lift rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-800/30 flex items-center justify-center text-amber-600 text-2xl font-bold">
                      {initial}
                    </div>
                  )}
                  {/* 奖牌：右上角 */}
                  {rank && rank <= 3 && points > 0 && (
                    <span className="absolute -top-1 -right-1 text-base leading-none">{MEDALS[rank - 1]}</span>
                  )}
                  {/* 管理员王冠：左上角 */}
                  {m.role === 'admin' && (
                    <span className="absolute -top-1 -left-1 text-base leading-none">👑</span>
                  )}
                </div>
                <div className="text-center w-full">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-semibold truncate">{profile?.display_name || profile?.username}</span>
                    <span className={`text-sm font-bold shrink-0 ${points > 0 ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {points}分
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{profile?.username}</p>
                  {profile?.bio && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{profile.bio}</p>
                  )}
                  {(() => {
                    const cp = champPreds[userId]
                    if (cp) {
                      const teamName = getTeamDisplay(cp.predicted_team_tla, cp.predicted_team)
                      const flagUrl = getFlagUrl(cp.predicted_team_tla)
                      return (
                        <div className="mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.05] w-full flex items-center justify-between gap-1">
                          <button
                            className="text-xs text-gray-600 dark:text-gray-300 truncate flex items-center gap-1 hover:text-amber-500 transition-colors"
                            onClick={e => { e.stopPropagation(); setHistoryTeam({ tla: cp.predicted_team_tla, name: cp.predicted_team }) }}
                          >
                            🏆{flagUrl && <img src={flagUrl} alt="" className="inline w-4 h-3 object-cover rounded-sm" />}{teamName}
                          </button>
                          <span className={`text-xs font-bold shrink-0 ${cp.is_correct === true ? 'text-amber-500' : cp.is_correct === false ? 'text-gray-400' : 'text-amber-400'}`}>
                            +{cp.bonus_points}
                          </span>
                        </div>
                      )
                    }
                    return (
                      <div className="mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.05] w-full flex items-center gap-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500">🏆 彩蛋未猜</span>
                      </div>
                    )
                  })()}
                  <div className="flex items-center justify-end mt-1">
                    {isAdmin && !isSelf && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteMember(userId, profile?.display_name || profile?.username) }}
                        disabled={deletingId === userId}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        {deletingId === userId ? '移除中...' : '移除'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="card-face card-face-back glass rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                {cardImages[userId] && (
                  <img src={cardImages[userId]} alt="" className="w-full h-full object-contain" />
                )}
              </div>
            </div>
            </div>
            )
          })}
        </div>
        {/* tj1.png 透明背景托举人物，微微抖动 */}
        <div className="flex justify-center -mt-4 pointer-events-none">
          <img src="/tj1.png" alt="" className="animate-hold-shake" style={{ width: 600, height: 'auto' }} />
        </div>
        </>
      )}
      {showInviteModal && (
        <InviteMemberModal gameId={selectedGameId} onClose={() => setShowInviteModal(false)} />
      )}
      {historyTeam && (
        <TeamHistoryModal tla={historyTeam.tla} teamName={historyTeam.name} onClose={() => setHistoryTeam(null)} />
      )}
    </div>
  )
}
