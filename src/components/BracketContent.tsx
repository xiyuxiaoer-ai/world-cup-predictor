'use client'

import { useEffect, useState } from 'react'
import { BRACKET_SLOTS, getSlotLabel } from '@/lib/bracketSlots'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'

type BracketMatch = {
  id: string
  api_match_id: number
  stage: string
  home_team: string
  away_team: string
  home_tla: string | null
  away_tla: string | null
  home_score_90: number | null
  away_score_90: number | null
  status: string
  kickoff_time: string
}

function TeamRow({ name, tla, score, isWinner, isTbd, slotLabel }: {
  name: string; tla: string | null; score: number | null
  isWinner: boolean; isTbd: boolean; slotLabel: string
}) {
  const flagUrl = tla ? getFlagUrl(tla) : null
  const display = isTbd ? slotLabel : getTeamDisplay(tla, name)
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 ${isWinner ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
      {flagUrl && !isTbd
        ? <img src={flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
        : <span className="w-5 h-3.5 shrink-0 flex items-center justify-center text-[10px] text-gray-300 dark:text-gray-600">?</span>
      }
      <span className={`text-xs flex-1 truncate ${isTbd ? 'text-gray-400 dark:text-gray-500' : isWinner ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
        {display}
      </span>
      {score !== null && (
        <span className={`text-xs font-bold shrink-0 ml-1 ${isWinner ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
          {score}
        </span>
      )}
    </div>
  )
}

function MatchCard({ match }: { match: BracketMatch }) {
  const slot = BRACKET_SLOTS[match.api_match_id]
  const homeTbd = match.home_team === 'TBD' || !match.home_team
  const awayTbd = match.away_team === 'TBD' || !match.away_team
  const finished = match.status === 'finished'
  const homeWin = finished && match.home_score_90 !== null && match.away_score_90 !== null && match.home_score_90 > match.away_score_90
  const awayWin = finished && match.home_score_90 !== null && match.away_score_90 !== null && match.away_score_90 > match.home_score_90
  const kickoff = new Date(match.kickoff_time)
  const dateStr = kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })

  return (
    <div className="glass rounded-lg overflow-hidden border border-black/[0.04] dark:border-white/[0.06] w-[148px] shrink-0">
      <div className="px-2 py-0.5 bg-black/[0.03] dark:bg-white/[0.04] border-b border-black/[0.04] dark:border-white/[0.06]">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">{dateStr}</span>
      </div>
      <TeamRow
        name={match.home_team} tla={match.home_tla}
        score={finished ? match.home_score_90 : null}
        isWinner={homeWin} isTbd={homeTbd}
        slotLabel={slot ? getSlotLabel(match.api_match_id, true) : '待定'}
      />
      <div className="h-px bg-black/[0.04] dark:bg-white/[0.04]" />
      <TeamRow
        name={match.away_team} tla={match.away_tla}
        score={finished ? match.away_score_90 : null}
        isWinner={awayWin} isTbd={awayTbd}
        slotLabel={slot ? getSlotLabel(match.api_match_id, false) : '待定'}
      />
    </div>
  )
}

function HalfBracket({ title, matches }: { title: string; matches: BracketMatch[] }) {
  // 按 bracketPos 排序
  const sorted = [...matches].sort((a, b) => {
    const sa = BRACKET_SLOTS[a.api_match_id]?.bracketPos ?? 99
    const sb = BRACKET_SLOTS[b.api_match_id]?.bracketPos ?? 99
    return sa - sb
  })

  // 分成 4 对（每对 2 场进 1 场 R16）
  const pairs: [BracketMatch, BracketMatch | undefined][] = []
  for (let i = 0; i < sorted.length; i += 2) {
    pairs.push([sorted[i], sorted[i + 1]])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="block w-[3px] h-4 rounded-full bg-amber-400" />
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">{title}</h2>
      </div>
      <div className="space-y-2">
        {pairs.map(([m1, m2], i) => (
          <div key={i} className="flex gap-2 items-start">
            <MatchCard match={m1} />
            {m2 && <MatchCard match={m2} />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BracketContent() {
  const [matches, setMatches] = useState<BracketMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bracket-matches')
      .then(r => r.json())
      .then(data => { setMatches(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 text-sm p-6">加载中...</div>

  const upper = matches.filter(m => BRACKET_SLOTS[m.api_match_id]?.half === 'upper')
  const lower = matches.filter(m => BRACKET_SLOTS[m.api_match_id]?.half === 'lower')

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">32强赛程表</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500">队名灰色为待确定，小组赛结束后自动更新</p>
      </div>
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="space-y-8 min-w-0">
          <HalfBracket title="上半区" matches={upper} />
          <HalfBracket title="下半区" matches={lower} />
        </div>
      </div>
    </div>
  )
}
