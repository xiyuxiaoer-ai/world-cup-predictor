'use client'

import { useEffect, useRef, useState } from 'react'
import { R32_SLOTS, LATER_ROUNDS, getSlotLabel } from '@/lib/bracketSlots'
import BracketColumn, { CARD_H, CONNECTOR_W } from './BracketColumn'
import BracketMatchCard, { type BracketMatchData } from './BracketMatchCard'

// ── 布局常量 ──────────────────────────────────
const CARD_W = 130
const COL_GAP = CONNECTOR_W  // 连线区即列间距

// 每轮卡片间距（同一对内）
const GAP: Record<string, number> = {
  r32: 6, r16: 6 + CARD_H + 6, qf: 6 + CARD_H + 6 + 6 + CARD_H + 6, sf: 0,
}
// 每轮对与对之间距离
const PAIR_GAP: Record<string, number> = {
  r32: 32, r16: CARD_H + 6 + 32, qf: (CARD_H + 6) * 3 + 32, sf: 0,
}

// ── 工具：按 matchNum 建索引 ───────────────────
function indexByMatchNum(matches: BracketMatchData[]): Map<number, BracketMatchData> {
  const map = new Map<number, BracketMatchData>()
  // R32: api_match_id → matchNum via R32_SLOTS
  for (const m of matches) {
    const slot = R32_SLOTS[m.api_match_id]
    if (slot) { map.set(slot.matchNum, m); continue }
    // 后续轮：用 LATER_ROUNDS 找 matchNum（按 stage 匹配）
    for (const [num, lr] of Object.entries(LATER_ROUNDS)) {
      if (lr.stage === m.stage) {
        // 同一 stage 可能多场，暂时按 kickoff 顺序 posInRound 对应
        if (!map.has(Number(num))) { map.set(Number(num), m); break }
      }
    }
  }
  return map
}

// ── 构建某半区某轮的 SlotItem 列表 ────────────
function buildSlots(
  matchNums: number[],
  byMatchNum: Map<number, BracketMatchData>,
  isR32 = false,
) {
  return matchNums.map(num => {
    const match = byMatchNum.get(num) ?? null
    let homeLabel = '待定'
    let awayLabel = '待定'
    if (isR32) {
      // 找到对应 api_match_id
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

// ── 赛制结构（match numbers）────────────────
// 上半区
const UPPER_R32  = [73, 75, 74, 77, 81, 82, 83, 84]
const UPPER_R16  = [89, 90, 93, 94]
const UPPER_QF   = [97, 98]
const UPPER_SF   = [101]
// 下半区（从截图右侧，从上到下：76,78,79,80,85,87,86,88）
const LOWER_R32  = [76, 78, 79, 80, 85, 87, 86, 88]
const LOWER_R16  = [91, 92, 95, 96]
const LOWER_QF   = [99, 100]
const LOWER_SF   = [102]

const FINAL_NUM  = 104

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

  // 滚动到中央（决赛）
  useEffect(() => {
    if (!loading && scrollRef.current) {
      const el = scrollRef.current
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
    }
  }, [loading])

  if (loading) return <div className="text-gray-400 text-sm p-6">加载中...</div>

  const byNum = indexByMatchNum(matches)

  const upperR32Slots  = buildSlots(UPPER_R32, byNum, true)
  const upperR16Slots  = buildSlots(UPPER_R16, byNum)
  const upperQFSlots   = buildSlots(UPPER_QF,  byNum)
  const upperSFSlot    = buildSlots(UPPER_SF,  byNum)

  const lowerR32Slots  = buildSlots(LOWER_R32, byNum, true)
  const lowerR16Slots  = buildSlots(LOWER_R16, byNum)
  const lowerQFSlots   = buildSlots(LOWER_QF,  byNum)
  const lowerSFSlot    = buildSlots(LOWER_SF,  byNum)

  const finalMatch = byNum.get(FINAL_NUM) ?? null

  // 上半区总高（8张 R32 卡片 + 间距）
  const upperH = 4 * CARD_H * 2 + 3 * GAP.r32 + 3 * PAIR_GAP.r32

  return (
    <div className="pb-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">淘汰赛赛程表</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">左右滑动查看完整赛程 · 灰色为待定</p>
      </div>

      {/* 图例 */}
      <div className="flex gap-3 mb-4 text-[10px] text-gray-500 dark:text-gray-400">
        {[['bg-blue-100 dark:bg-blue-900/30','32强'],['bg-green-100 dark:bg-green-900/30','16强'],
          ['bg-orange-100 dark:bg-orange-900/30','8强'],['bg-purple-100 dark:bg-purple-900/30','半决赛'],
          ['bg-red-100 dark:bg-red-900/30','决赛']].map(([cls, label]) => (
          <span key={label} className={`px-1.5 py-0.5 rounded ${cls}`}>{label}</span>
        ))}
      </div>

      <div ref={scrollRef} className="overflow-x-auto -mx-4 px-4">
        <div className="flex items-center" style={{ minWidth: 'max-content', gap: COL_GAP }}>

          {/* ── 上半区 R32 ── */}
          <BracketColumn
            slots={upperR32Slots} gap={GAP.r32} pairGap={PAIR_GAP.r32}
            showConnector flip={false}
          />

          {/* ── 上半区 R16 ── */}
          <BracketColumn
            slots={upperR16Slots} gap={GAP.r16} pairGap={PAIR_GAP.r16}
            showConnector flip={false}
          />

          {/* ── 上半区 QF ── */}
          <BracketColumn
            slots={upperQFSlots} gap={GAP.qf} pairGap={0}
            showConnector flip={false}
          />

          {/* ── 上半区 SF + 决赛入口线 ── */}
          <div className="flex items-center" style={{ gap: COL_GAP }}>
            <BracketMatchCard
              match={upperSFSlot[0]?.match ?? null}
              homeLabel="97胜者" awayLabel="98胜者"
            />
            <div className="shrink-0" style={{ width: CONNECTOR_W, height: CARD_H }}>
              <div className="h-1/2 border-b border-r border-gray-300 dark:border-gray-600 rounded-br" style={{ width: '100%' }} />
            </div>
          </div>

          {/* ── 决赛 ── */}
          <div className="flex flex-col items-center" style={{ gap: 8 }}>
            <span className="text-[10px] font-bold text-red-500 tracking-wide">决赛</span>
            <BracketMatchCard
              match={finalMatch}
              homeLabel="101胜者" awayLabel="102胜者"
            />
          </div>

          {/* ── 下半区 SF + 决赛入口线 ── */}
          <div className="flex items-center flex-row-reverse" style={{ gap: COL_GAP }}>
            <BracketMatchCard
              match={lowerSFSlot[0]?.match ?? null}
              homeLabel="99胜者" awayLabel="100胜者"
            />
            <div className="shrink-0" style={{ width: CONNECTOR_W, height: CARD_H }}>
              <div className="h-1/2 border-b border-l border-gray-300 dark:border-gray-600 rounded-bl" style={{ width: '100%' }} />
            </div>
          </div>

          {/* ── 下半区 QF ── */}
          <BracketColumn
            slots={lowerQFSlots} gap={GAP.qf} pairGap={0}
            showConnector flip={true}
          />

          {/* ── 下半区 R16 ── */}
          <BracketColumn
            slots={lowerR16Slots} gap={GAP.r16} pairGap={PAIR_GAP.r16}
            showConnector flip={true}
          />

          {/* ── 下半区 R32 ── */}
          <BracketColumn
            slots={lowerR32Slots} gap={GAP.r32} pairGap={PAIR_GAP.r32}
            showConnector={false} flip={true}
          />

        </div>
      </div>
    </div>
  )
}
