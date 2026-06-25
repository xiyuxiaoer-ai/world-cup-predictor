'use client'

import { useEffect, useRef, useState } from 'react'
import { R32_SLOTS, LATER_ROUNDS, getSlotLabel } from '@/lib/bracketSlots'
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

const R32_COLOR   = 'bg-blue-200/40 dark:bg-blue-800/20'
const R16_COLOR   = 'bg-teal-200/40 dark:bg-teal-800/20'
const QF_COLOR    = 'bg-amber-200/40 dark:bg-amber-800/20'
const SF_COLOR    = 'bg-violet-200/40 dark:bg-violet-800/20'
const FINAL_COLOR = 'bg-amber-100/60 dark:bg-amber-700/25'

const ROUND_TABS = [
  { level: 0, label: '32强',   activeTab: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-400/40 dark:border-blue-400/30' },
  { level: 1, label: '16强',   activeTab: 'bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-400/40 dark:border-teal-400/30' },
  { level: 2, label: '8强',    activeTab: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-400/40 dark:border-amber-400/30' },
  { level: 3, label: '半决赛',  activeTab: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-400/40 dark:border-violet-400/30' },
  { level: 3, label: '决赛',   activeTab: 'bg-amber-400/10 text-amber-700 dark:text-amber-300 border-amber-400/40 dark:border-amber-400/30' },
]

function indexByMatchNum(matches: BracketMatchData[]): Map<number, BracketMatchData> {
  const map = new Map<number, BracketMatchData>()
  for (const m of matches) {
    const slot = R32_SLOTS[m.api_match_id]
    if (slot) { map.set(slot.matchNum, m); continue }
    for (const [num, lr] of Object.entries(LATER_ROUNDS)) {
      if (lr.stage === m.stage && !map.has(Number(num))) {
        map.set(Number(num), m); break
      }
    }
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
      const entry = Object.entries(R32_SLOTS).find(([, s]) => s.matchNum === num)
      if (entry) {
        const apiId = Number(entry[0])
        const h = resolveLabel(getSlotLabel(apiId, true), standings)
        const a = resolveLabel(getSlotLabel(apiId, false), standings)
        homeLabel = h.label; homeTla = h.tla; homeConfirmed = h.confirmed
        awayLabel = a.label; awayTla = a.tla; awayConfirmed = a.confirmed
      }
    }
    return { match, homeLabel, awayLabel, homeTla, awayTla, homeConfirmed, awayConfirmed }
  })
}

const UPPER_R32 = [73, 75, 74, 77, 81, 82, 83, 84]
const UPPER_R16 = [89, 90, 93, 94]
const UPPER_QF  = [97, 98]
const UPPER_SF  = [101]
const LOWER_R32 = [76, 78, 79, 80, 85, 87, 86, 88]
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
      const el = scrollRef.current
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
    }
  }, [loading, maxRound])

  if (loading) return (
    <div className="flex items-center justify-center py-16">
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
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">淘汰赛赛程</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          32强 → 16强 → 8强 → 4强 → 决赛
        </p>
        <p className="flex items-center gap-1 text-[11px] text-amber-600/80 dark:text-amber-400/60 mt-1.5">
          <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M7 6.5v3.5M7 4.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          32强名单根据目前小组赛结果预测，以实际赛果为准
        </p>
      </div>

      {/* 轮次选择器 */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-1">展开至：</span>
        {ROUND_TABS.map(({ level, label, activeTab }) => {
          const isActive = maxRound >= level
          return (
            <button
              key={label}
              onClick={() => setMaxRound(level)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer tap-scale
                ${isActive
                  ? activeTab
                  : 'bg-white/30 dark:bg-white/[0.04] border-black/[0.06] dark:border-white/10 text-gray-400 dark:text-gray-500 opacity-50'
                }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Bracket */}
      <div ref={scrollRef} className="overflow-x-auto -mx-4 px-4">
        <div className="flex items-center" style={{ minWidth: 'max-content', gap: COL_GAP }}>

          <BracketColumn
            slots={upperR32Slots} gap={GAP.r32} pairGap={PAIR_GAP.r32}
            showConnector={showR16} flip={false}
            roundColor={R32_COLOR}
          />

          {showR16 && (
            <BracketColumn
              slots={upperR16Slots} gap={GAP.r16} pairGap={PAIR_GAP.r16}
              showConnector={showQF} flip={false}
              roundColor={R16_COLOR}
            />
          )}

          {showQF && (
            <BracketColumn
              slots={upperQFSlots} gap={GAP.qf} pairGap={0}
              showConnector={showSF} flip={false}
              roundColor={QF_COLOR}
            />
          )}

          {showSF ? (
            <>
              {/* Upper SF + connector to Final */}
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

              {/* Final */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex flex-col items-center gap-0">
                  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" className="text-amber-400 drop-shadow-sm">
                    <path d="M10 2l1.2 3.6h3.8l-3.1 2.2 1.2 3.6L10 9.2l-3.1 2.2 1.2-3.6L5 5.6h3.8z" fill="currentColor"/>
                    <path d="M6.5 14.5h7M8 16.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M10 11V14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[8px] font-black tracking-[0.18em] text-amber-500/80 dark:text-amber-400/70">FINAL</span>
                </div>
                <BracketMatchCard
                  match={finalMatch}
                  homeLabel={sf1?.homeLabel ?? '待定'}
                  awayLabel={sf2?.awayLabel ?? '待定'}
                  roundColor={FINAL_COLOR}
                />
              </div>

              {/* Lower SF + connector to Final */}
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
            </>
          ) : (
            /* 展开下一轮按钮 */
            <div className="flex flex-col items-center justify-center px-2" style={{ minHeight: CARD_H * 2 }}>
              <button
                onClick={() => setMaxRound(prev => Math.min(prev + 1, 3))}
                className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl
                  bg-white/40 dark:bg-white/[0.06]
                  hover:bg-white/70 dark:hover:bg-white/[0.10]
                  border border-dashed border-black/10 dark:border-white/15
                  backdrop-blur-[8px]
                  text-gray-400 dark:text-gray-500
                  transition-all cursor-pointer tap-scale"
              >
                <span className="text-[10px] font-medium">{['16强', '8强', '半决赛'][maxRound] ?? ''}</span>
                <svg viewBox="0 0 6 10" width="10" height="10" fill="none">
                  <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}

          {showQF && (
            <BracketColumn
              slots={lowerQFSlots} gap={GAP.qf} pairGap={0}
              showConnector={showSF} flip={true}
              roundColor={QF_COLOR}
            />
          )}

          {showR16 && (
            <BracketColumn
              slots={lowerR16Slots} gap={GAP.r16} pairGap={PAIR_GAP.r16}
              showConnector={showQF} flip={true}
              roundColor={R16_COLOR}
            />
          )}

          <BracketColumn
            slots={lowerR32Slots} gap={GAP.r32} pairGap={PAIR_GAP.r32}
            showConnector={showR16} flip={true}
            roundColor={R32_COLOR}
          />

        </div>
      </div>

      <p className="text-[10px] text-gray-400/60 dark:text-gray-600 mt-2 text-center">
        左右滑动查看完整赛程
      </p>
    </div>
  )
}
