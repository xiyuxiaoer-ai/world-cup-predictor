'use client'

import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'

const RANK_COLORS = [
  { bg: 'linear-gradient(145deg,#FFE55C 0%,#F5A623 52%,#D4810A 100%)', text: '#7A4600' },
  { bg: 'linear-gradient(145deg,#E8EAF0 0%,#B0BAC8 52%,#8090A0 100%)', text: '#3A4A5A' },
  { bg: 'linear-gradient(145deg,#E8A468 0%,#C47838 52%,#9A5C1E 100%)', text: '#4A2000' },
]

function IconMessage() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 16, height: 16 }}>
      <path d="M3 4.5A1.5 1.5 0 014.5 3h11A1.5 1.5 0 0117 4.5v8A1.5 1.5 0 0115.5 14H11l-3 3v-3H4.5A1.5 1.5 0 013 12.5v-8z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

function IconEdit() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 16, height: 16 }}>
      <path d="M13.5 3.5l3 3L7 16H4v-3L13.5 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

export default function MemberProfileModal({
  profile,
  userId,
  rank,
  points,
  champPred,
  currentUserId,
  onClose,
}: {
  profile: any
  userId: string
  rank: number | null
  points: number
  champPred: any | null
  currentUserId: string
  onClose: () => void
}) {
  const router = useRouter()
  const isSelf = userId === currentUserId
  const initial = (profile?.display_name || profile?.username || '?')[0].toUpperCase()
  const rankStyle = rank && rank <= 3 ? RANK_COLORS[rank - 1] : null
  const champTeam = champPred ? getTeamDisplay(champPred.predicted_team_tla, champPred.predicted_team) : null
  const champFlag = champPred ? getFlagUrl(champPred.predicted_team_tla) : null

  function handleDM() {
    router.push(`/chat?dm=${userId}&name=${encodeURIComponent(profile?.display_name || profile?.username || '')}`)
    onClose()
  }

  function handleEditProfile() {
    router.push('/profile')
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="animate-sheet-in w-full sm:w-auto sm:min-w-[360px] sm:max-w-sm glass rounded-t-3xl sm:rounded-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* 拖拽把手（移动端） */}
        <div className="w-10 h-1 rounded-full bg-gray-300/60 dark:bg-gray-600/60 mx-auto mt-3 mb-1 sm:hidden" />

        <div className="px-6 pt-4 pb-6 space-y-5">
          {/* 头像 + 姓名区 */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-24 h-24 rounded-full object-cover shadow-xl"
                  style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 3px rgba(255,255,255,0.7)' }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg,#60A5FA 0%,#3B82F6 50%,#2563EB 100%)',
                    boxShadow: '0 8px 32px rgba(59,130,246,0.35), 0 0 0 3px rgba(255,255,255,0.7)',
                  }}
                >
                  {initial}
                </div>
              )}
              {rankStyle && points > 0 && (
                <div
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                  style={{ background: rankStyle.bg, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                >
                  <span className="text-xs font-black" style={{ color: rankStyle.text }}>{rank}</span>
                </div>
              )}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {profile?.display_name || profile?.username}
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">@{profile?.username}</p>
              {profile?.bio && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* 统计栏 */}
          <div className="flex items-stretch justify-around py-3 rounded-2xl bg-black/[0.035] dark:bg-white/[0.05]">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{points}</span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">积分</span>
            </div>
            {rank && (
              <>
                <div className="w-px bg-black/[0.07] dark:bg-white/[0.07]" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">#{rank}</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">排名</span>
                </div>
              </>
            )}
            {champTeam && (
              <>
                <div className="w-px bg-black/[0.07] dark:bg-white/[0.07]" />
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    {champFlag && (
                      <img src={champFlag} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 max-w-[60px] truncate">{champTeam}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">夺冠猜测</span>
                </div>
              </>
            )}
          </div>

          {/* 操作按钮 */}
          {isSelf ? (
            <button
              onClick={handleEditProfile}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-gold-primary font-semibold text-sm tap-scale"
            >
              <IconEdit />
              编辑我的资料
            </button>
          ) : (
            <button
              onClick={handleDM}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-gold-primary font-semibold text-sm tap-scale"
            >
              <IconMessage />
              发送消息
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
