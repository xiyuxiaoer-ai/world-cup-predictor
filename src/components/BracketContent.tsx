'use client'

import { useEffect, useRef, useState } from 'react'
import { R32_SLOTS, LATER_ROUNDS, LATER_SLOT_BY_ID, getSlotLabel } from '@/lib/bracketSlots'
import BracketColumn, { CARD_H, CONNECTOR_W } from './BracketColumn'
import BracketMatchCard, { type BracketMatchData } from './BracketMatchCard'

const COL_GAP = CONNECTOR_W

const GAP: Record<string, number> = {
  r32: 6,
  r16: 6 + CARD_H + 6,
  qf: 6 + CARD_H + 6 + 6 + CARD_H + 6,
}
const PAIR_GAP: Record<string, number> = {
  r32: 28,
  r16: CARD_H + 6 + 28,
  qf: (CARD_H + 6) * 3 + 28,
}

// 每轮卡片颜色 = 背景色 + 彩色内光CSS类
const R32_COLOR   = 'bracket-card-r32'
const R16_COLOR   = 'bracket-card-r16'
const QF_COLOR    = 'bracket-card-qf'
const SF_COLOR    = 'bracket-card-sf'
const FINAL_COLOR = 'bracket-card-fin'

const ROUND_TABS = [
  { level: 0, label: '32强', activeTab: 'round-tab-active' },
  { level: 1, label: '16强', activeTab: 'round-tab-active' },
  { level: 2, label: '8强', activeTab: 'round-tab-active-qf' },
  { level: 3, label: '半决赛', activeTab: 'round-tab-active-qf' },
  { level: 3, label: '决赛', activeTab: 'round-tab-active-final' },
]

function indexByMatchNum(matches: BracketMatchData[]): Map<number, BracketMatchData> {
  const map = new Map<number, BracketMatchData>()
  for (const m of matches) {
    // R32: api_match_id 精确命中 R32_SLOTS
    const r32slot = R32_SLOTS[m.api_match_id]
    if (r32slot) { map.set(r32slot.matchNum, m); continue }
    // R16+: api_match_id 精确命中 LATER_SLOT_BY_ID（固定映射，不依赖顺序）
    const laterNum = LATER_SLOT_BY_ID[m.api_match_id]
    if (laterNum) map.set(laterNum, m)
  }
  return map
}

function resolveLabel(
  raw: string,
  standings: Record<string, { team: string; tla: string | null; confirmed: boolean }[]>,
): { label: string; tla: string | null; confirmed: boolean } {
  const simple = raw.match(/^([A-L])([12])$/)
  if (simple) {
    const groupKey = `GROUP_${simple[1]}`
    const pos = Number(simple[2]) - 1
    const entry = standings[groupKey]?.[pos]
    if (entry) return { label: entry.team, tla: entry.tla, confirmed: entry.confirmed }
    return { label: `${simple[1]}组第${simple[2]}名`, tla: null, confirmed: false }
  }
  const chinese = raw.match(/^([A-L])组第([12])名$/)
  if (chinese) {
    const groupKey = `GROUP_${chinese[1]}`
    const pos = Number(chinese[2]) - 1
    const entry = standings[groupKey]?.[pos]
    if (entry) return { label: entry.team, tla: entry.tla, confirmed: entry.confirmed }
    return { label: raw, tla: null, confirmed: false }
  }
  return { label: raw, tla: null, confirmed: false }
}

function buildSlots(
  matchNums: number[],
  byMatchNum: Map<number, BracketMatchData>,
  standings: Record<string, { team: string; tla: string | null; confirmed: boolean }[]>,
  isR32 = false,
) {
  return matchNums.map(num => {
    const match = byMatchNum.get(num) ?? null
    let homeLabel = '待定', awayLabel = '待定'
    let homeTla: string | null = null, awayTla: string | null = null
    let homeConfirmed = false, awayConfirmed = false
    if (isR32) {
      const slotEntry = Object.entries(R32_SLOTS).find(([, s]) => s.matchNum === num)
      const apiId = slotEntry ? Number(slotEntry[0]) : null
      if (match?.home_team && match.home_team !== 'TBD') {
        homeLabel = match.home_team; homeTla = match.home_tla ?? null; homeConfirmed = true
      } else {
        homeLabel = apiId ? getSlotLabel(apiId, true) : 'TBD'
      }
      if (match?.away_team && match.away_team !== 'TBD') {
        awayLabel = match.away_team; awayTla = match.away_tla ?? null; awayConfirmed = true
      } else {
        awayLabel = apiId ? getSlotLabel(apiId, false) : 'TBD'
      }
    }
    return { match, homeLabel, awayLabel, homeTla, awayTla, homeConfirmed, awayConfirmed }
  })
}

const UPPER_R32 = [73, 74, 75, 76, 77, 78, 79, 80]
const UPPER_R16 = [89, 90, 93, 94]
const UPPER_QF  = [97, 98]
const UPPER_SF  = [101]
const LOWER_R32 = [81, 82, 83, 84, 85, 86, 87, 88]
const LOWER_R16 = [91, 92, 95, 96]
const LOWER_QF  = [99, 100]
const LOWER_SF  = [102]
const FINAL_NUM = 104

export default function BracketContent() {
  const [matches, setMatches] = useState<BracketMatchData[]>([])
  const [standings, setStandings] = useState<Record<string, { team: string; tla: string | null; confirmed: boolean }[]>>({})
  const [loading, setLoading] = useState(true)
  const [maxRound, setMaxRound] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 根据屏幕宽度自动设定初始展开轮次
  useEffect(() => {
    const w = window.innerWidth
    if (w >= 1280) setMaxRound(2)       // 大屏展开至8强
    else if (w >= 640) setMaxRound(1)   // 平板展开至16强
    // 手机默认仅展示32强
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/bracket-matches').then(r => r.json()),
      fetch('/api/group-standings').then(r => r.json()),
    ]).then(([bracketData, standingsData]) => {
      setMatches(bracketData || [])
      setStandings(standingsData?.standings || {})
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && scrollRef.current) {
      // 内层 `justify-center` 已经把赛程树对齐在和视口等宽的容器正中间——
      // 无论内容溢出多少，溢出都是左右对称的，scrollLeft=0 看到的就是居中窗口。
      // 用 scrollWidth 反推居中位置不对：浏览器不会把"左侧溢出"计入 scrollWidth，
      // 内容越宽这个偏差越明显（32强/16强溢出少所以不明显，8强/半决赛就很明显）。
      scrollRef.current.scrollLeft = 0
    }
  }, [loading, maxRound])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
        <span className="text-xs text-gray-400 dark:text-gray-500">加载赛程...</span>
      </div>
    </div>
  )

  const byNum = indexByMatchNum(matches)
  const upperR32Slots = buildSlots(UPPER_R32, byNum, standings, true)
  const upperR16Slots = buildSlots(UPPER_R16, byNum, standings)
  const upperQFSlots  = buildSlots(UPPER_QF,  byNum, standings)
  const upperSFSlot   = buildSlots(UPPER_SF,  byNum, standings)
  const lowerR32Slots = buildSlots(LOWER_R32, byNum, standings, true)
  const lowerR16Slots = buildSlots(LOWER_R16, byNum, standings)
  const lowerQFSlots  = buildSlots(LOWER_QF,  byNum, standings)
  const lowerSFSlot   = buildSlots(LOWER_SF,  byNum, standings)
  const finalMatch    = byNum.get(FINAL_NUM) ?? null

  const sf1 = upperSFSlot[0]
  const sf2 = lowerSFSlot[0]

  const showR16 = maxRound >= 1
  const showQF  = maxRound >= 2
  const showSF  = maxRound >= 3

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">淘汰赛赛程</h1>
      </div>

      {/* 轮次选择器 */}
      <div className="flex gap-2 mb-5 items-center flex-wrap">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">展开至：</span>
        {ROUND_TABS.map(({ level, label, activeTab }) => {
          const isActive = maxRound >= level
          return (
            <button
              key={label}
              onClick={() => setMaxRound(level)}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium border transition-all duration-200 cursor-pointer tap-scale
                ${isActive
                  ? activeTab
                  : 'bg-white/30 dark:bg-white/[0.04] border-black/[0.06] dark:border-white/10 text-gray-400 dark:text-gray-500 opacity-50 hover:opacity-70'
                }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Bracket */}
      <div ref={scrollRef} className="overflow-x-auto -mx-4 px-4 pb-2">
        {/* 居中包裹：宽度不足时 justify-center 使赛程树居中；超出时 shrink-0 保证完整渲染 */}
        <div className="min-w-full flex justify-center py-2">
        <div className="flex items-center shrink-0" style={{ gap: COL_GAP }}>

          {/* Upper R32 */}
          <BracketColumn
            slots={upperR32Slots} gap={GAP.r32} pairGap={PAIR_GAP.r32}
            showConnector={showR16} flip={false}
            roundColor={R32_COLOR}
          />

          {/* Upper R16 — 从左侧弹入 */}
          {showR16 && (
            <div className="animate-bracket-left">
              <BracketColumn
                slots={upperR16Slots} gap={GAP.r16} pairGap={PAIR_GAP.r16}
                showConnector={showQF} flip={false}
                roundColor={R16_COLOR}
              />
            </div>
          )}

          {/* Upper QF — 从左侧弹入（稍延迟） */}
          {showQF && (
            <div className="animate-bracket-left" style={{ animationDelay: '40ms' }}>
              <BracketColumn
                slots={upperQFSlots} gap={GAP.qf} pairGap={0}
                showConnector={showSF} flip={false}
                roundColor={QF_COLOR}
              />
            </div>
          )}

          {/* SF + Final 区 或 展开按钮 */}
          {showSF ? (
            /* 半决赛+决赛作为整体弹入 */
            <div className="flex items-center animate-bracket-center" style={{ gap: COL_GAP }}>
              {/* Upper SF + connector */}
              <div className="flex items-center" style={{ gap: COL_GAP }}>
                <BracketMatchCard
                  match={sf1?.match ?? null}
                  homeLabel={sf1?.homeLabel ?? '待定'} awayLabel={sf1?.awayLabel ?? '待定'}
                  homeTla={sf1?.homeTla} awayTla={sf1?.awayTla}
                  homeConfirmed={sf1?.homeConfirmed} awayConfirmed={sf1?.awayConfirmed}
                  roundColor={SF_COLOR}
                />
                <div className="shrink-0 flex items-center" style={{ width: CONNECTOR_W, height: CARD_H }}>
                  <div className="w-full border-b border-gray-300/50 dark:border-gray-500/40" />
                </div>
              </div>

              {/* Final — 金色辉光包裹 */}
              <div className="final-focus-frame flex flex-col items-center gap-1.5 px-1 py-2 rounded-2xl animate-final-glow">
                <div className="flex flex-col items-center gap-0">
                  <svg viewBox="0 0 20 20" width="18" height="18" fill="none" className="text-amber-400 drop-shadow-sm">
                    <path d="M10 2l1.2 3.6h3.8l-3.1 2.2 1.2 3.6L10 9.2l-3.1 2.2 1.2-3.6L5 5.6h3.8z" fill="currentColor"/>
                    <path d="M6.5 14.5h7M8 16.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M10 11V14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[8px] font-black tracking-[0.2em] text-amber-500/80 dark:text-amber-400/70">FINAL</span>
                </div>
                <BracketMatchCard
                  match={finalMatch}
                  homeLabel={sf1?.homeLabel ?? '待定'}
                  awayLabel={sf2?.awayLabel ?? '待定'}
                  roundColor={FINAL_COLOR}
                />
              </div>

              {/* Lower SF + connector */}
              <div className="flex items-center flex-row-reverse" style={{ gap: COL_GAP }}>
                <BracketMatchCard
                  match={sf2?.match ?? null}
                  homeLabel={sf2?.homeLabel ?? '待定'} awayLabel={sf2?.awayLabel ?? '待定'}
                  homeTla={sf2?.homeTla} awayTla={sf2?.awayTla}
                  homeConfirmed={sf2?.homeConfirmed} awayConfirmed={sf2?.awayConfirmed}
                  roundColor={SF_COLOR}
                />
                <div className="shrink-0 flex items-center" style={{ width: CONNECTOR_W, height: CARD_H }}>
                  <div className="w-full border-b border-gray-300/50 dark:border-gray-500/40" />
                </div>
              </div>
            </div>
          ) : (
            /* 展开下一轮按钮（呼吸光环） */
            <div className="flex flex-col items-center justify-center px-2" style={{ minHeight: CARD_H * 2 }}>
              <button
                onClick={() => setMaxRound(prev => Math.min(prev + 1, 3))}
                className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl
                  bg-white/50 dark:bg-white/[0.07]
                  hover:bg-white/80 dark:hover:bg-white/[0.12]
                  border border-black/[0.07] dark:border-white/[0.12]
                  backdrop-blur-[10px]
                  text-gray-400 dark:text-gray-500
                  transition-all duration-200 cursor-pointer tap-scale animate-expand-ring"
              >
                <span className="text-[10px] font-semibold tracking-wide">{['16强', '8强', '半决赛'][maxRound] ?? ''}</span>
                <svg viewBox="0 0 6 10" width="10" height="10" fill="none">
                  <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}

          {/* Lower QF — 从右侧弹入（稍延迟） */}
          {showQF && (
            <div className="animate-bracket-right" style={{ animationDelay: '40ms' }}>
              <BracketColumn
                slots={lowerQFSlots} gap={GAP.qf} pairGap={0}
                showConnector={showSF} flip={true}
                roundColor={QF_COLOR}
              />
            </div>
          )}

          {/* Lower R16 — 从右侧弹入 */}
          {showR16 && (
            <div className="animate-bracket-right">
              <BracketColumn
                slots={lowerR16Slots} gap={GAP.r16} pairGap={PAIR_GAP.r16}
                showConnector={showQF} flip={true}
                roundColor={R16_COLOR}
              />
            </div>
          )}

          {/* Lower R32 */}
          <BracketColumn
            slots={lowerR32Slots} gap={GAP.r32} pairGap={PAIR_GAP.r32}
            showConnector={showR16} flip={true}
            roundColor={R32_COLOR}
          />

        </div>
        </div>
      </div>

      <p className="text-[10px] text-gray-400/50 dark:text-gray-600 mt-2 text-center md:hidden">
        左右滑动查看完整赛程
      </p>
    </div>
  )
}
