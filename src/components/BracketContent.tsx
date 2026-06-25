'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [overview, setOverview] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const naturalWRef = useRef(0)

  const outerRef = useRef<HTMLDivElement>(null)
  const bracketRef = useRef<HTMLDivElement>(null)
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
    if (!loading && scrollRef.current && !overview) {
      const el = scrollRef.current
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
    }
  }, [loading, overview])

  const applyZoom = useCallback(() => {
    if (!outerRef.current || naturalWRef.current === 0) return
    const ow = outerRef.current.clientWidth
    setZoomLevel(Math.min(1, ow / naturalWRef.current))
  }, [])

  useEffect(() => {
    if (!overview || loading) { setZoomLevel(1); naturalWRef.current = 0; return }
    // Measure at zoom=1 (initial state), then apply scale
    const t = setTimeout(() => {
      if (!bracketRef.current || !outerRef.current) return
      naturalWRef.current = bracketRef.current.scrollWidth
      applyZoom()
    }, 30)
    window.addEventListener('resize', applyZoom)
    return () => { clearTimeout(t); window.removeEventListener('resize', applyZoom) }
  }, [overview, loading, applyZoom])

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

  const bracketInner = (
    <div
      ref={bracketRef}
      className="flex items-center"
      style={{ minWidth: 'max-content', gap: COL_GAP }}
    >
      <BracketColumn slots={upperR32Slots} gap={GAP.r32} pairGap={PAIR_GAP.r32} showConnector flip={false} />
      <BracketColumn slots={upperR16Slots} gap={GAP.r16} pairGap={PAIR_GAP.r16} showConnector flip={false} />
      <BracketColumn slots={upperQFSlots}  gap={GAP.qf}  pairGap={0}            showConnector flip={false} />

      {/* Upper SF + connector to Final */}
      <div className="flex items-center" style={{ gap: COL_GAP }}>
        <BracketMatchCard
          match={sf1?.match ?? null}
          homeLabel={sf1?.homeLabel ?? '待定'} awayLabel={sf1?.awayLabel ?? '待定'}
          homeTla={sf1?.homeTla} awayTla={sf1?.awayTla}
          homeConfirmed={sf1?.homeConfirmed} awayConfirmed={sf1?.awayConfirmed}
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
        />
      </div>

      {/* Lower SF + connector to Final */}
      <div className="flex items-center flex-row-reverse" style={{ gap: COL_GAP }}>
        <BracketMatchCard
          match={sf2?.match ?? null}
          homeLabel={sf2?.homeLabel ?? '待定'} awayLabel={sf2?.awayLabel ?? '待定'}
          homeTla={sf2?.homeTla} awayTla={sf2?.awayTla}
          homeConfirmed={sf2?.homeConfirmed} awayConfirmed={sf2?.awayConfirmed}
        />
        <div className="shrink-0 flex items-center" style={{ width: CONNECTOR_W, height: CARD_H }}>
          <div className="w-full border-b border-gray-300/50 dark:border-gray-500/40" />
        </div>
      </div>

      <BracketColumn slots={lowerQFSlots}  gap={GAP.qf}  pairGap={0}            showConnector flip />
      <BracketColumn slots={lowerR16Slots}  gap={GAP.r16} pairGap={PAIR_GAP.r16} showConnector flip />
      <BracketColumn slots={lowerR32Slots}  gap={GAP.r32} pairGap={PAIR_GAP.r32} showConnector={false} flip />
    </div>
  )

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">淘汰赛赛程</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            32强 → 16强 → 8强 → 4强 → 决赛
          </p>
        </div>
        <button
          onClick={() => setOverview(v => !v)}
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all tap-scale
            ${overview
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300/50 dark:border-amber-500/30'
              : 'bg-gray-100/80 dark:bg-white/8 text-gray-500 dark:text-gray-400 border border-black/[0.06] dark:border-white/10'}`}
        >
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
            <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            <rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            <rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            <rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
          {overview ? '退出' : '全览'}
        </button>
      </div>

      {/* Bracket */}
      <div ref={outerRef} className={overview ? 'overflow-hidden' : ''}>
        {overview ? (
          <div style={{ zoom: zoomLevel }}>
            {bracketInner}
          </div>
        ) : (
          <div ref={scrollRef} className="overflow-x-auto -mx-4 px-4">
            {bracketInner}
          </div>
        )}
      </div>

      {/* Hint */}
      {!overview && (
        <p className="text-[10px] text-gray-400/60 dark:text-gray-600 mt-2 text-center">
          左右滑动查看完整赛程 · 点击「全览」缩放至全屏
        </p>
      )}
    </div>
  )
}
