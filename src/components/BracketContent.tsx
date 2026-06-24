'use client'

import { useEffect, useRef, useState } from 'react'
import { SingleEliminationBracket, Match, SVGViewer, createTheme } from '@g-loot/react-tournament-brackets'
import type { MatchType } from '@g-loot/react-tournament-brackets'
import type { BracketMatchData } from './BracketMatchCard'
import { R32_SLOTS, LATER_ROUNDS, getSlotLabel } from '@/lib/bracketSlots'

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

const ROUND_NUM: Record<string, string> = { r32: '1', r16: '2', qf: '3', sf: '4', final: '5' }
const ROUND_LABELS = ['32强', '16强', '8强', '半决赛', '决赛']

function buildLibraryMatches(matches: BracketMatchData[]): MatchType[] {
  const byNum = indexByMatchNum(matches)
  const result: MatchType[] = []

  for (const [apiIdStr, slot] of Object.entries(R32_SLOTS)) {
    const apiId = Number(apiIdStr)
    const match = byNum.get(slot.matchNum)
    const finished = match?.status === 'FINISHED' || match?.status === 'finished'
    const h = match?.home_score_90 ?? null
    const a = match?.away_score_90 ?? null
    result.push({
      id: slot.matchNum,
      nextMatchId: slot.feedsInto,
      tournamentRoundText: ROUND_NUM.r32,
      startTime: match?.kickoff_time ?? '',
      state: finished ? 'SCORE_DONE' : 'SCHEDULED',
      participants: [
        {
          id: `${slot.matchNum}_h`,
          name: match && match.home_team !== 'TBD' ? match.home_team : getSlotLabel(apiId, true),
          isWinner: finished && h !== null && a !== null && h > a,
          resultText: finished && h !== null ? String(h) : null,
          status: finished ? 'PLAYED' : null,
        },
        {
          id: `${slot.matchNum}_a`,
          name: match && match.away_team !== 'TBD' ? match.away_team : getSlotLabel(apiId, false),
          isWinner: finished && h !== null && a !== null && a > h,
          resultText: finished && a !== null ? String(a) : null,
          status: finished ? 'PLAYED' : null,
        },
      ],
    })
  }

  for (const [matchNumStr, slot] of Object.entries(LATER_ROUNDS)) {
    const matchNum = Number(matchNumStr)
    const match = byNum.get(matchNum)
    const finished = match?.status === 'FINISHED' || match?.status === 'finished'
    const h = match?.home_score_90 ?? null
    const a = match?.away_score_90 ?? null
    result.push({
      id: matchNum,
      nextMatchId: slot.feedsInto ?? null,
      tournamentRoundText: ROUND_NUM[slot.round],
      startTime: match?.kickoff_time ?? '',
      state: match ? (finished ? 'SCORE_DONE' : 'SCHEDULED') : 'NO_PARTY',
      participants: [
        {
          id: `${matchNum}_h`,
          name: match && match.home_team !== 'TBD' ? match.home_team : '待定',
          isWinner: finished && h !== null && a !== null && h > a,
          resultText: finished && h !== null ? String(h) : null,
          status: match ? (finished ? 'PLAYED' : null) : 'NO_PARTY',
        },
        {
          id: `${matchNum}_a`,
          name: match && match.away_team !== 'TBD' ? match.away_team : '待定',
          isWinner: finished && h !== null && a !== null && a > h,
          resultText: finished && a !== null ? String(a) : null,
          status: match ? (finished ? 'PLAYED' : null) : 'NO_PARTY',
        },
      ],
    })
  }

  return result
}

const theme = createTheme({
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  transitionTimingFunction: 'ease-in-out',
  disabledColor: '#9ca3af',
  roundHeaders: { background: '#f3f4f6' },
  matchBackground: { wonColor: '#fefce8', lostColor: '#f9fafb' },
  border: { color: '#e5e7eb', highlightedColor: '#f59e0b' },
  textColor: { highlighted: '#d97706', main: '#374151', dark: '#111827', disabled: '#9ca3af' },
  score: {
    text: { highlightedWonColor: '#d97706', highlightedLostColor: '#9ca3af' },
    background: { wonColor: '#fef9c3', lostColor: '#e5e7eb' },
  },
  canvasBackground: 'transparent',
})

export default function BracketContent() {
  const [matches, setMatches] = useState<BracketMatchData[]>([])
  const [loading, setLoading] = useState(true)
  const [width, setWidth] = useState(360)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/bracket-matches')
      .then(r => r.json())
      .then(data => { setMatches(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(containerRef.current)
    setWidth(containerRef.current.clientWidth)
    return () => ro.disconnect()
  }, [])

  if (loading) return <div className="text-gray-400 text-sm p-6">加载中...</div>

  const libraryMatches = buildLibraryMatches(matches)

  return (
    <div className="pb-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">淘汰赛赛程表</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">可左右拖拽 · 滚轮缩放</p>
      </div>

      <div ref={containerRef} className="w-full rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <SingleEliminationBracket
          matches={libraryMatches}
          matchComponent={Match}
          theme={theme}
          options={{
            style: {
              roundHeader: {
                isShown: true,
                roundTextGenerator: (n) => ROUND_LABELS[n - 1] ?? `第${n}轮`,
              },
              connectorColor: '#d1d5db',
              connectorColorHighlight: '#f59e0b',
            },
          }}
          svgWrapper={({ children, ...props }) => (
            <SVGViewer width={width} height={600} {...props}>
              {children}
            </SVGViewer>
          )}
        />
      </div>
    </div>
  )
}
