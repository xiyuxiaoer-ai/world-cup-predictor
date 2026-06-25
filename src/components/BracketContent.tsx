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
  r32: 32,
  r16: CARD_H + 6 + 32,
  qf: (CARD_H + 6) * 3 + 32,
}

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

// 0=仅32强 1=+16强 2=+8强 3=+半决赛/决赛
const ROUND_TABS = [
  { level: 0, label: '32强',  bg: 'bg-blue-100 dark:bg-blue-900/30',   activeBg: 'bg-blue-400/80 dark:bg-blue-500/60',   text: 'text-blue-900 dark:text-blue-100' },
  { level: 1, label: '16强',  bg: 'bg-green-100 dark:bg-green-900/30', activeBg: 'bg-green-400/80 dark:bg-green-500/60', text: 'text-green-900 dark:text-green-100' },
  { level: 2, label: '8强',   bg: 'bg-orange-100 dark:bg-orange-900/30', activeBg: 'bg-orange-400/80 dark:bg-orange-500/60', text: 'text-orange-900 dark:text-orange-100' },
  { level: 3, label: '半决赛', bg: 'bg-purple-100 dark:bg-purple-900/30', activeBg: 'bg-purple-400/80 dark:bg-purple-500/60', text: 'text-purple-900 dark:text-purple-100' },
  { level: 3, label: '决赛',  bg: 'bg-red-100 dark:bg-red-900/30',     activeBg: 'bg-red-400/80 dark:bg-red-500/60',     text: 'text-red-900 dark:text-red-100' },
]

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

  if (loading) return <div className="text-gray-400 text-sm p-6">加载中...</div>

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

  const showR16 = maxRound >= 1
  const showQF  = maxRound >= 2
  const showSF  = maxRound >= 3

  return (
    <div className="pb-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">淘汰赛赛程表</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">左右滑动查看完整赛程 · 灰色为待定</p>
        <p className="text-[11px] text-amber-600/70 dark:text-amber-400/60 mt-1">
          ⚠ 32强对阵根据当前小组赛积分推算，小组赛结束前仅供参考，最终以官方公布为准
        </p>
      </div>

      {/* 轮次选择器：点击展开到对应轮次 */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-1">展开至：</span>
        {ROUND_TABS.map(({ level, label, bg, activeBg, text }) => {
          const isActive = maxRound >= level && !(level === 3 && label === '决赛' && maxRound < 3)
          return (
            <button
              key={label}
              onClick={() => setMaxRound(level)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer
                ${isActive ? `${activeBg} ${text}` : `${bg} text-gray-500 dark:text-gray-400 opacity-60`}`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div ref={scrollRef} className="overflow-x-auto -mx-4 px-4">
        <div className="flex items-center" style={{ minWidth: 'max-content', gap: COL_GAP }}>

          <BracketColumn
            slots={upperR32Slots} gap={GAP.r32} pairGap={PAIR_GAP.r32}
            showConnector={showR16} flip={false}
            roundColor="bg-blue-50 dark:bg-blue-900/20"
          />

          {showR16 && (
            <BracketColumn
              slots={upperR16Slots} gap={GAP.r16} pairGap={PAIR_GAP.r16}
              showConnector={showQF} flip={false}
              roundColor="bg-green-50 dark:bg-green-900/20"
            />
          )}

          {showQF && (
            <BracketColumn
              slots={upperQFSlots} gap={GAP.qf} pairGap={0}
              showConnector={showSF} flip={false}
              roundColor="bg-orange-50 dark:bg-orange-900/20"
            />
          )}

          {showSF ? (
            <>
              {/* 上半区 SF + 决赛入口线 */}
              <div className="flex items-center" style={{ gap: COL_GAP }}>
                <BracketMatchCard match={upperSFSlot[0]?.match ?? null} homeLabel="待定" awayLabel="待定" roundColor="bg-purple-50 dark:bg-purple-900/20" />
                <div className="shrink-0 flex items-center" style={{ width: CONNECTOR_W, height: CARD_H }}>
                  <div className="w-full border-b border-gray-300 dark:border-gray-600" />
                </div>
              </div>

              {/* 决赛 */}
              <div className="flex flex-col items-center" style={{ gap: 10 }}>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-5 bg-gradient-to-r from-transparent to-amber-400 dark:to-amber-500" />
                    <span className="text-base font-black tracking-[0.25em] bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-sm">
                      决赛
                    </span>
                    <div className="h-px w-5 bg-gradient-to-l from-transparent to-amber-400 dark:to-amber-500" />
                  </div>
                  <span className="text-[9px] tracking-widest text-amber-500/60 dark:text-amber-400/50 font-medium">FINAL</span>
                </div>
                <BracketMatchCard match={finalMatch} homeLabel="待定" awayLabel="待定" roundColor="bg-red-50 dark:bg-red-900/20" />
              </div>

              {/* 下半区 SF + 决赛入口线 */}
              <div className="flex items-center flex-row-reverse" style={{ gap: COL_GAP }}>
                <BracketMatchCard match={lowerSFSlot[0]?.match ?? null} homeLabel="待定" awayLabel="待定" roundColor="bg-purple-50 dark:bg-purple-900/20" />
                <div className="shrink-0 flex items-center" style={{ width: CONNECTOR_W, height: CARD_H }}>
                  <div className="w-full border-b border-gray-300 dark:border-gray-600" />
                </div>
              </div>
            </>
          ) : (
            /* 未展开时，显示一个提示展开下一轮的箭头 */
            <div className="flex flex-col items-center justify-center px-2" style={{ minHeight: CARD_H }}>
              <button
                onClick={() => setMaxRound(prev => Math.min(prev + 1, 3))}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg
                  bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/60
                  border border-dashed border-gray-200 dark:border-gray-700
                  text-gray-400 dark:text-gray-500 transition-colors cursor-pointer"
              >
                <span className="text-[10px]">{['16强','8强','半决赛'][maxRound] ?? ''}</span>
                <span className="text-sm leading-none">›</span>
              </button>
            </div>
          )}

          {showQF && (
            <BracketColumn
              slots={lowerQFSlots} gap={GAP.qf} pairGap={0}
              showConnector={showSF} flip={true}
              roundColor="bg-orange-50 dark:bg-orange-900/20"
            />
          )}

          {showR16 && (
            <BracketColumn
              slots={lowerR16Slots} gap={GAP.r16} pairGap={PAIR_GAP.r16}
              showConnector={showQF} flip={true}
              roundColor="bg-green-50 dark:bg-green-900/20"
            />
          )}

          <BracketColumn
            slots={lowerR32Slots} gap={GAP.r32} pairGap={PAIR_GAP.r32}
            showConnector={showR16} flip={true}
            roundColor="bg-blue-50 dark:bg-blue-900/20"
          />

        </div>
      </div>
    </div>
  )
}
