'use client'

import { useState, useEffect } from 'react'
import type { GameWithRole } from '@/types'
import { useSelectedGame } from '@/hooks/useSelectedGame'
import InviteMemberModal from './InviteMemberModal'
import TeamHistoryModal from './TeamHistoryModal'
import MemberProfileModal from './MemberProfileModal'
import { getTeamDisplay, getFlagUrl } from '@/lib/flags'
import { STAGE_LABELS } from '@/lib/championBonus'

function MemberMedal({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg,#FFE55C 0%,#F5A623 52%,#D4810A 100%)', boxShadow: '0 1px 4px rgba(245,166,35,0.6), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
      <span className="text-[9px] font-black leading-none" style={{ color: '#7A4600' }}>1</span>
    </div>
  )
  if (rank === 2) return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg,#E8EAF0 0%,#B0BAC8 52%,#8090A0 100%)', boxShadow: '0 1px 4px rgba(128,144,160,0.5), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
      <span className="text-[9px] font-black leading-none" style={{ color: '#3A4A5A' }}>2</span>
    </div>
  )
  if (rank === 3) return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg,#E8A468 0%,#C47838 52%,#9A5C1E 100%)', boxShadow: '0 1px 4px rgba(160,92,30,0.5), inset 0 1px 0 rgba(255,255,255,0.35)' }}>
      <span className="text-[9px] font-black leading-none" style={{ color: '#4A2000' }}>3</span>
    </div>
  )
  return null
}

function IconTrophySm() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 14, height: 14, flexShrink: 0 }}>
      <path d="M6 2h8v6a4 4 0 01-8 0V2z" fill="#FCD34D" stroke="#D97706" strokeWidth="1.2"/>
      <path d="M3.5 4H6M14 4h2.5" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M10 12v3M7.5 15h5" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

const RANK_CARD_STYLES = [
  'bg-gradient-to-br from-amber-400/[0.14] to-transparent dark:from-amber-400/[0.09] border-l-[3px] border-amber-400/80 animate-gold-pulse',
  'bg-gradient-to-br from-slate-300/[0.22] to-transparent dark:from-slate-500/[0.13] border-l-[3px] border-slate-400/70 dark:border-slate-500/70 animate-silver-shimmer',
  'bg-gradient-to-br from-orange-300/[0.15] to-transparent dark:from-amber-700/[0.11] border-l-[3px] border-orange-400/55 dark:border-amber-700/55 animate-bronze-glow',
]

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
  const [profileUser, setProfileUser] = useState<{ profile: any; userId: string } | null>(null)

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
          style={{ boxShadow: '0 0 0 1px rgba(59,130,246,0.25)' }}
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
              <div className={`card-face glass hover-lift rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer ${rank && rank <= 3 && points > 0 ? RANK_CARD_STYLES[rank - 1] : ''}`}>
                {/* 头像：点击打开成员 profile，阻止冒泡避免同时翻牌 */}
                <div
                  className="relative tap-scale cursor-pointer"
                  onClick={e => { e.stopPropagation(); setProfileUser({ profile, userId }) }}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-white/70 shadow-md" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white/60 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {initial}
                    </div>
                  )}
                  {/* 奖牌：右上角 */}
                  {rank && rank <= 3 && points > 0 && (
                    <span className="absolute -top-1 -right-1"><MemberMedal rank={rank} /></span>
                  )}
                  {/* 点击提示光晕 */}
                  <span className="absolute inset-0 rounded-full ring-2 ring-blue-400/0 hover:ring-blue-400/40 transition-all duration-200" />
                </div>
                <div className="text-center w-full">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-semibold truncate">{profile?.display_name || profile?.username}</span>
                    <span className={`text-sm font-bold shrink-0 ${points > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
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
                            <IconTrophySm />{flagUrl && <img src={flagUrl} alt="" className="inline w-4 h-3 object-cover rounded-sm" />}{teamName}
                          </button>
                          <span className={`text-xs font-bold shrink-0 ${cp.is_correct === true ? 'text-amber-600 dark:text-amber-400' : cp.is_correct === false ? 'text-gray-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            +{cp.bonus_points}
                          </span>
                        </div>
                      )
                    }
                    return (
                      <div className="mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.05] w-full flex items-center gap-1">
                        <IconTrophySm /><span className="text-xs text-gray-400 dark:text-gray-500">彩蛋未猜</span>
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
      {profileUser && (
        <MemberProfileModal
          profile={profileUser.profile}
          userId={profileUser.userId}
          rank={getRank(profileUser.userId)}
          points={getPoints(profileUser.userId)}
          champPred={champPreds[profileUser.userId] ?? null}
          currentUserId={currentUserId}
          onClose={() => setProfileUser(null)}
        />
      )}
    </div>
  )
}
