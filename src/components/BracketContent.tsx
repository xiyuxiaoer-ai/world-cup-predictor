'use client'

import { useEffect, useState } from 'react'
import { R32_SLOTS, LATER_ROUNDS, getSlotLabel } from '@/lib/bracketSlots'
import BracketMatchCard, { type BracketMatchData } from './BracketMatchCard'

// ── Layout constants ──────────────────────────────────────────────────────────
const VW = 80   // card width
const VH = 45   // card height
const VG = 8    // gap between cards in same round row
const VR = 36   // vertical connector height between rounds
const UNIT = VW + VG  // 88px per slot

// Total width = 8 R32 matches side-by-side
const TOTAL_W = 8 * UNIT - VG  // 696px

// Center X of match at round r (0=R32, 1=R16, 2=QF, 3=SF), position p
function cx(r: number, p: number): number {
  if (r === 0) return p * UNIT + VW / 2
  return (cx(r - 1, p * 2) + cx(r - 1, p * 2 + 1)) / 2
}

// ── Data processing ───────────────────────────────────────────────────────────
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

type Slot = {
  match: BracketMatchData | null
  homeLabel: string; awayLabel: string
  homeTla?: string | null; awayTla?: string | null
  homeConfirmed?: boolean; awayConfirmed?: boolean
}

function buildSlots(
  matchNums: number[],
  byMatchNum: Map<number, BracketMatchData>,
  standings: Record<string, { team: string; tla: string | null; confirmed: boolean }[]>,
  isR32 = false,
): Slot[] {
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

// ── Bracket sub-components ────────────────────────────────────────────────────

function RoundRow({ round, slots }: { round: number; slots: Slot[] }) {
  return (
    <div className="relative shrink-0" style={{ width: TOTAL_W, height: VH }}>
      {slots.map((s, i) => (
        <div key={i} className="absolute top-0" style={{ left: cx(round, i) - VW / 2 }}>
          <BracketMatchCard
            match={s.match}
            homeLabel={s.homeLabel} awayLabel={s.awayLabel}
            homeTla={s.homeTla} awayTla={s.awayTla}
            homeConfirmed={s.homeConfirmed} awayConfirmed={s.awayConfirmed}
          />
        </div>
      ))}
    </div>
  )
}

// Converging connector: parentCount cards → parentCount/2 cards (e.g. R32→R16)
function ConvergeRow({ parentRound, parentCount }: { parentRound: number; parentCount: number }) {
  const segs: string[] = []
  for (let j = 0; j < parentCount / 2; j++) {
    const xl = cx(parentRound, j * 2)
    const xr = cx(parentRound, j * 2 + 1)
    const xm = cx(parentRound + 1, j)
    const ym = VR / 2
    // Two stems going down + horizontal bar + center drop
    segs.push(`M${xl} 0V${ym}H${xr}V0 M${xm} ${ym}V${VR}`)
  }
  return (
    <svg width={TOTAL_W} height={VR} className="shrink-0 overflow-visible text-gray-300/70 dark:text-gray-600/50">
      <path d={segs.join(' ')} fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

// Expanding connector: parentCount cards → parentCount*2 cards (e.g. lower SF→QF)
function ExpandRow({ parentRound, childRound, parentCount }: {
  parentRound: number; childRound: number; parentCount: number
}) {
  const segs: string[] = []
  for (let j = 0; j < parentCount; j++) {
    const xp = cx(parentRound, j)
    const xl = cx(childRound, j * 2)
    const xr = cx(childRound, j * 2 + 1)
    const ym = VR / 2
    // One stem going down, splitting into two branches
    segs.push(`M${xp} 0V${ym}H${xl}V${VR} M${xp} ${ym}H${xr}V${VR}`)
  }
  return (
    <svg width={TOTAL_W} height={VR} className="shrink-0 overflow-visible text-gray-300/70 dark:text-gray-600/50">
      <path d={segs.join(' ')} fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

// Straight vertical connector (SF ↔ Final)
function StraightRow({ xPos }: { xPos: number }) {
  return (
    <svg width={TOTAL_W} height={VR} className="shrink-0 overflow-visible text-gray-300/70 dark:text-gray-600/50">
      <line x1={xPos} y1={0} x2={xPos} y2={VR} stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

function RoundLabel({ label }: { label: string }) {
  return (
    <div className="shrink-0 flex items-center gap-1.5 mb-1 mt-1" style={{ width: TOTAL_W }}>
      <span className="block w-[2px] h-3 rounded-full bg-gray-300/80 dark:bg-gray-600/60" />
      <span className="text-[9px] font-semibold text-gray-400/80 dark:text-gray-500 tracking-widest uppercase">{label}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BracketContent() {
  const [matches, setMatches] = useState<BracketMatchData[]>([])
  const [standings, setStandings] = useState<Record<string, { team: string; tla: string | null; confirmed: boolean }[]>>({})
  const [loading, setLoading] = useState(true)

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
  const sfX = cx(3, 0)  // center x of SF/Final column = 348

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">淘汰赛赛程</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">32强 → 16强 → 8强 → 4强 → 决赛</p>
        <p className="flex items-center gap-1 text-[11px] text-amber-600/80 dark:text-amber-400/60 mt-1.5">
          <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M7 6.5v3.5M7 4.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          32强名单根据目前小组赛结果预测，以实际赛果为准
        </p>
      </div>

      {/* Bracket — vertical layout, horizontal scroll if screen too narrow */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex flex-col" style={{ minWidth: TOTAL_W }}>

          {/* ── Upper bracket: R32 → SF ── */}
          <RoundLabel label="32强" />
          <RoundRow round={0} slots={upperR32Slots} />
          <ConvergeRow parentRound={0} parentCount={8} />

          <RoundLabel label="16强" />
          <RoundRow round={1} slots={upperR16Slots} />
          <ConvergeRow parentRound={1} parentCount={4} />

          <RoundLabel label="8强" />
          <RoundRow round={2} slots={upperQFSlots} />
          <ConvergeRow parentRound={2} parentCount={2} />

          <RoundLabel label="半决赛" />
          <RoundRow round={3} slots={upperSFSlot} />
          <StraightRow xPos={sfX} />

          {/* ── Final ── */}
          <div className="shrink-0 flex items-center gap-1.5 mb-1 mt-1" style={{ width: TOTAL_W }}>
            <span className="block w-[2px] h-3 rounded-full bg-amber-400/80" />
            <svg viewBox="0 0 20 20" width="12" height="12" fill="none" className="text-amber-400">
              <path d="M10 2l1.2 3.6h3.8l-3.1 2.2 1.2 3.6L10 9.2l-3.1 2.2 1.2-3.6L5 5.6h3.8z" fill="currentColor"/>
              <path d="M6.5 14.5h7M8 16.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M10 11V14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span className="text-[9px] font-bold text-amber-500/80 tracking-widest uppercase">决赛</span>
          </div>
          <div className="relative shrink-0" style={{ width: TOTAL_W, height: VH }}>
            <div className="absolute top-0" style={{ left: sfX - VW / 2 }}>
              <BracketMatchCard
                match={finalMatch}
                homeLabel={sf1?.homeLabel ?? '待定'}
                awayLabel={sf2?.awayLabel ?? '待定'}
              />
            </div>
          </div>
          <StraightRow xPos={sfX} />

          {/* ── Lower bracket: SF → R32 ── */}
          <RoundLabel label="半决赛" />
          <RoundRow round={3} slots={lowerSFSlot} />
          <ExpandRow parentRound={3} childRound={2} parentCount={1} />

          <RoundLabel label="8强" />
          <RoundRow round={2} slots={lowerQFSlots} />
          <ExpandRow parentRound={2} childRound={1} parentCount={2} />

          <RoundLabel label="16强" />
          <RoundRow round={1} slots={lowerR16Slots} />
          <ExpandRow parentRound={1} childRound={0} parentCount={4} />

          <RoundLabel label="32强" />
          <RoundRow round={0} slots={lowerR32Slots} />

        </div>
      </div>
    </div>
  )
}
