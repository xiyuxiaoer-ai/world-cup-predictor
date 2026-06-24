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

function buildSlots(matchNums: number[], byMatchNum: Map<number, BracketMatchData>, isR32 = false) {
  return matchNums.map(num => {
    const match = byMatchNum.get(num) ?? null
    let homeLabel = '待定'
    let awayLabel = '待定'
    if (isR32) {
      const entry = Object.entries(R32_SLOTS).find(([, s]) => s.matchNum === num)
      if (entry) {
        const apiId = Number(entry[0])
        homeLabel = getSlotLabel(apiId, true)
        awayLabel = getSlotLabel(apiId, false)
      }
    }
    return { match, homeLabel, awayLabel }
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
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/bracket-matches')
      .then(r => r.json())
      .then(data => { setMatches(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && scrollRef.current) {
      const el = scrollRef.current
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
    }
  }, [loading])

  if (loading) return <div className="text-gray-400 text-sm p-6">加载中...</div>

  const byNum = indexByMatchNum(matches)

  const upperR32Slots = buildSlots(UPPER_R32, byNum, true)
  const upperR16Slots = buildSlots(UPPER_R16, byNum)
  const upperQFSlots  = buildSlots(UPPER_QF,  byNum)
  const upperSFSlot   = buildSlots(UPPER_SF,  byNum)
  const lowerR32Slots = buildSlots(LOWER_R32, byNum, true)
  const lowerR16Slots = buildSlots(LOWER_R16, byNum)
  const lowerQFSlots  = buildSlots(LOWER_QF,  byNum)
  const lowerSFSlot   = buildSlots(LOWER_SF,  byNum)
  const finalMatch    = byNum.get(FINAL_NUM) ?? null

  return (
    <div className="pb-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">淘汰赛赛程表</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">左右滑动查看完整赛程 · 灰色为待定</p>
      </div>

      <div className="flex gap-3 mb-4 text-[10px] text-gray-500 dark:text-gray-400">
        {[['bg-blue-100 dark:bg-blue-900/30','32强'],['bg-green-100 dark:bg-green-900/30','16强'],
          ['bg-orange-100 dark:bg-orange-900/30','8强'],['bg-purple-100 dark:bg-purple-900/30','半决赛'],
          ['bg-red-100 dark:bg-red-900/30','决赛']].map(([cls, label]) => (
          <span key={label} className={`px-1.5 py-0.5 rounded ${cls}`}>{label}</span>
        ))}
      </div>

      <div ref={scrollRef} className="overflow-x-auto -mx-4 px-4">
        <div className="flex items-center" style={{ minWidth: 'max-content', gap: COL_GAP }}>

          <BracketColumn slots={upperR32Slots} gap={GAP.r32} pairGap={PAIR_GAP.r32} showConnector flip={false} roundColor="bg-blue-50 dark:bg-blue-900/20" />
          <BracketColumn slots={upperR16Slots} gap={GAP.r16} pairGap={PAIR_GAP.r16} showConnector flip={false} roundColor="bg-green-50 dark:bg-green-900/20" />
          <BracketColumn slots={upperQFSlots}  gap={GAP.qf}  pairGap={0}            showConnector flip={false} roundColor="bg-orange-50 dark:bg-orange-900/20" />

          {/* 上半区 SF + 决赛入口线 */}
          <div className="flex items-center" style={{ gap: COL_GAP }}>
            <BracketMatchCard match={upperSFSlot[0]?.match ?? null} homeLabel="待定" awayLabel="待定" roundColor="bg-purple-50 dark:bg-purple-900/20" />
            <div className="shrink-0 flex items-center" style={{ width: CONNECTOR_W, height: CARD_H }}>
              <div className="w-full border-b border-gray-300 dark:border-gray-600" />
            </div>
          </div>

          {/* 决赛 */}
          <div className="flex flex-col items-center" style={{ gap: 8 }}>
            <span className="text-[10px] font-bold text-red-500 tracking-wide">决赛</span>
            <BracketMatchCard match={finalMatch} homeLabel="待定" awayLabel="待定" roundColor="bg-red-50 dark:bg-red-900/20" />
          </div>

          {/* 下半区 SF + 决赛入口线 */}
          <div className="flex items-center flex-row-reverse" style={{ gap: COL_GAP }}>
            <BracketMatchCard match={lowerSFSlot[0]?.match ?? null} homeLabel="待定" awayLabel="待定" roundColor="bg-purple-50 dark:bg-purple-900/20" />
            <div className="shrink-0 flex items-center" style={{ width: CONNECTOR_W, height: CARD_H }}>
              <div className="w-full border-b border-gray-300 dark:border-gray-600" />
            </div>
          </div>

          <BracketColumn slots={lowerQFSlots}  gap={GAP.qf}  pairGap={0}            showConnector flip={true}  roundColor="bg-orange-50 dark:bg-orange-900/20" />
          <BracketColumn slots={lowerR16Slots} gap={GAP.r16} pairGap={PAIR_GAP.r16} showConnector flip={true}  roundColor="bg-green-50 dark:bg-green-900/20" />
          <BracketColumn slots={lowerR32Slots} gap={GAP.r32} pairGap={PAIR_GAP.r32} showConnector={false} flip={true} roundColor="bg-blue-50 dark:bg-blue-900/20" />

        </div>
      </div>
    </div>
  )
}
