'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { LeaderboardEntry } from '@/types'
import { getTeamDisplay } from '@/lib/flags'
import { createClient } from '@/lib/supabase/client'
import MemberProfileModal from './MemberProfileModal'

const RANK_ROW_STYLES = [
  // 金：暖黄，左边框醒目金色（动效通过 inline animation 加入，避免与 stagger 冲突）
  'bg-gradient-to-r from-amber-300/[0.22] via-amber-200/[0.08] to-transparent dark:from-amber-400/[0.16] dark:via-amber-400/[0.04] border-l-[3px] border-amber-400',
  // 银：冷调蓝灰
  'bg-gradient-to-r from-sky-300/[0.20] via-slate-200/[0.08] to-transparent dark:from-slate-400/[0.20] dark:via-sky-400/[0.06] border-l-[3px] border-slate-400 dark:border-slate-400',
  // 铜：深棕铜色
  'bg-gradient-to-r from-orange-800/[0.14] via-orange-700/[0.05] to-transparent dark:from-orange-900/[0.22] dark:via-orange-800/[0.06] border-l-[3px] border-orange-700/70 dark:border-orange-700',
]

// 金银铜发光动效名（在 stagger 完成后 400ms 启动，避免 CSS animation 属性互相覆盖）
const RANK_GLOW = [
  'gold-pulse 2s ease-in-out',
  'silver-shimmer 2.4s ease-in-out',
  'bronze-glow 2.8s ease-in-out',
]

function Medal({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg,#FFE566 0%,#F5A800 50%,#C87800 100%)', boxShadow: '0 2px 8px rgba(245,168,0,0.80), inset 0 1px 0 rgba(255,255,255,0.60), 0 0 0 1px rgba(200,120,0,0.30)' }}>
      <span className="text-[10px] font-black leading-none" style={{ color: '#6B3A00' }}>1</span>
    </div>
  )
  if (rank === 2) return (
    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg,#F0F6FF 0%,#A8BECE 50%,#6888A0 100%)', boxShadow: '0 2px 8px rgba(100,136,170,0.70), inset 0 1px 0 rgba(255,255,255,0.80), 0 0 0 1px rgba(80,110,140,0.25)' }}>
      <span className="text-[10px] font-black leading-none" style={{ color: '#2A3E52' }}>2</span>
    </div>
  )
  if (rank === 3) return (
    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg,#C8845A 0%,#9A5520 50%,#6E3408 100%)', boxShadow: '0 2px 8px rgba(154,85,32,0.70), inset 0 1px 0 rgba(255,200,160,0.45), 0 0 0 1px rgba(100,50,10,0.30)' }}>
      <span className="text-[10px] font-black leading-none" style={{ color: '#FFD8B0' }}>3</span>
    </div>
  )
  return null
}

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
  const [profileEntry, setProfileEntry] = useState<LeaderboardEntry | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id)
    })
  }, [])

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

  if (loading) return (
    <div className="glass-strong rounded-xl overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.04] dark:border-white/[0.04] animate-stagger-in"
          style={{ animationDelay: `${i * 55}ms` }}>
          <div className="skeleton-pulse w-6 h-6 rounded-full shrink-0" />
          <div className="skeleton-pulse w-7 h-7 rounded-full shrink-0" />
          <div className="skeleton-pulse h-3.5 flex-1 rounded-full" />
          <div className="skeleton-pulse h-3.5 w-14 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  )

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
      <div className="glass-strong rounded-xl overflow-hidden animate-spring-in">
        {sorted.length === 0 ? (
          <div className="p-4 text-gray-400 dark:text-gray-500 text-sm">暂无积分数据</div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {sorted.map((entry, i) => {
              const rank = getRank(i)
              const hasPoints = entry.total_points > 0
              const isTop3 = rank <= 3 && hasPoints
              const rowStyle = isTop3 ? RANK_ROW_STYLES[rank - 1] : 'border-l-[3px] border-transparent'

              const staggerDelay = 60 + i * 38
              // Combine stagger + glow in one inline animation so they don't override each other via CSS cascade
              const rowAnimation = isTop3 && hasPoints
                ? `stagger-in 0.34s cubic-bezier(0.16,1,0.3,1) ${staggerDelay}ms both, ${RANK_GLOW[rank - 1]} ${staggerDelay + 400}ms infinite`
                : `stagger-in 0.34s cubic-bezier(0.16,1,0.3,1) ${staggerDelay}ms both`

              return (
                <button
                  key={entry.user_id}
                  onClick={() => openBreakdown(entry)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/40 dark:hover:bg-white/5 cursor-pointer text-left ${rowStyle}`}
                  style={{ animation: rowAnimation }}
                >
                  <span className="w-6 text-center shrink-0">
                    {isTop3
                      ? <Medal rank={rank} />
                      : <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">{rank}</span>}
                  </span>
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className={`w-7 h-7 rounded-full object-cover shrink-0 border-2 ${
                      rank === 1 && hasPoints ? 'border-amber-400' :
                      rank === 2 && hasPoints ? 'border-slate-400' :
                      rank === 3 && hasPoints ? 'border-orange-700/60' :
                      'border-gray-200 dark:border-gray-700'
                    }`} />
                  ) : (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      rank === 1 && hasPoints ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 text-amber-700' :
                      rank === 2 && hasPoints ? 'bg-sky-100 dark:bg-slate-700/50 border-2 border-slate-400 text-slate-600 dark:text-slate-300' :
                      rank === 3 && hasPoints ? 'bg-orange-100 dark:bg-orange-900/20 border-2 border-orange-700/50 text-orange-800 dark:text-orange-400' :
                      'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {(entry.display_name || entry.username)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className={`flex-1 text-sm font-medium truncate ${
                    rank === 1 && hasPoints ? 'text-amber-700 dark:text-amber-400' :
                    rank === 2 && hasPoints ? 'text-slate-600 dark:text-slate-300' :
                    rank === 3 && hasPoints ? 'text-orange-800 dark:text-orange-500' :
                    'text-gray-900 dark:text-gray-100'
                  }`}>
                    {entry.display_name || entry.username}
                  </span>
                  <div className="text-right shrink-0">
                    <div className={`font-bold text-sm ${entry.total_points > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {entry.total_points}分
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {entry.prediction_count}猜
                      {entry.pending_count > 0 && (
                        <span className={`ml-1 font-medium ${entry.pending_count > 10 ? 'text-green-500' : entry.pending_count > 5 ? 'text-orange-400 dark:text-orange-300' : 'text-red-500 dark:text-red-400'}`}>
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
      {selected && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md glass-strong rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-spring-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.05] dark:border-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <div
                  className="tap-scale cursor-pointer shrink-0"
                  onClick={e => { e.stopPropagation(); setProfileEntry(selected) }}
                >
                  {selected.avatar_url ? (
                    <img src={selected.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-amber-300 hover:ring-2 hover:ring-blue-400/40 transition-all" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-bold text-amber-700 hover:ring-2 hover:ring-blue-400/40 transition-all">
                      {(selected.display_name || selected.username)?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {selected.display_name || selected.username}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">共 {selected.total_points} 分</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100/70 dark:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-white/20 transition-all tap-scale">
                <svg viewBox="0 0 14 14" width="12" height="12" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {bdLoading ? (
                <div className="p-6 text-center text-gray-400 text-sm">加载中...</div>
              ) : breakdown.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">暂无积分记录</div>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {breakdown.map((item: any, idx: number) => {
                    const m = item.match
                    if (!m) return null
                    const homeName = getTeamDisplay(m.home_tla, m.home_team)
                    const awayName = getTeamDisplay(m.away_tla, m.away_team)
                    const points = item.points_earned
                    const groupLabel = m.group_name ? ` ${m.group_name.replace('GROUP_', '').replace('_', ' ')}组` : ''
                    return (
                      <div key={idx} className="flex items-center gap-3 px-5 py-3 animate-stagger-in"
                        style={{ animationDelay: `${idx * 30}ms` }}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {homeName} vs {awayName}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>{STAGE_LABELS[m.stage]}{groupLabel}</span>
                            {m.kickoff_time && (
                              <span>{new Date(m.kickoff_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</span>
                            )}
                            {m.home_score_90 != null && (
                              <span className="text-gray-500 dark:text-gray-400 font-mono">
                                结果 {m.home_score_90}–{m.away_score_90} · 猜 {item.pred_home_score}–{item.pred_away_score}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`text-sm font-bold shrink-0 ${points > 0 ? 'text-amber-600 dark:text-amber-400' : points < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {points > 0 ? `+${points}` : points}分
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {profileEntry && (
        <MemberProfileModal
          profile={{
            display_name: profileEntry.display_name,
            username: profileEntry.username,
            avatar_url: profileEntry.avatar_url,
            bio: null,
          }}
          userId={profileEntry.user_id}
          rank={sorted.findIndex(e => e.user_id === profileEntry.user_id) + 1 || null}
          points={profileEntry.total_points}
          champPred={null}
          currentUserId={currentUserId ?? ''}
          onClose={() => setProfileEntry(null)}
        />
      )}
    </>
  )
}
