'use client'

import { useEffect, useState } from 'react'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'

const STAGE_LABELS: Record<string, string> = {
  group: '小组赛', round_of_32: '32强', round_of_16: '16强',
  quarter_final: '八强', semi_final: '四强', third_place: '季军赛', final: '决赛',
}

function resultTag(isHome: boolean, homeScore: number, awayScore: number) {
  const won = isHome ? homeScore > awayScore : awayScore > homeScore
  const lost = isHome ? homeScore < awayScore : awayScore < homeScore
  if (won) return <span className="text-xs font-bold text-green-500 w-4 shrink-0">W</span>
  if (lost) return <span className="text-xs font-bold text-red-400 w-4 shrink-0">L</span>
  return <span className="text-xs font-bold text-gray-400 w-4 shrink-0">D</span>
}

export default function TeamHistoryModal({
  tla,
  teamName,
  onClose,
}: {
  tla: string
  teamName: string
  onClose: () => void
}) {
  const [data, setData] = useState<{ wc: any[]; friendly: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const flagUrl = getFlagUrl(tla)
  const displayName = getTeamDisplay(tla, teamName)

  useEffect(() => {
    fetch(`/api/team-history?tla=${tla}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [tla])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            {flagUrl && <img src={flagUrl} alt="" className="w-8 h-6 object-cover rounded" />}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{displayName} 历史战绩</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">加载中...</div>
          ) : (
            <>
              {/* WC 2026 section */}
              <Section title="2026世界杯" matches={data?.wc || []} tla={tla} isWC />
              {/* Friendly section */}
              <Section title="热身赛" matches={data?.friendly || []} tla={tla} isWC={false} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, matches, tla, isWC }: { title: string; matches: any[]; tla: string; isWC: boolean }) {
  return (
    <div>
      <div className="px-5 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      {matches.length === 0 ? (
        <div className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500">暂无记录</div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {matches.map((m: any, idx: number) => {
            const isHome = m.home_tla?.toUpperCase() === tla
            const opponentTla = isHome ? m.away_tla : m.home_tla
            const opponentName = isHome ? m.away_team : m.home_team
            const opponent = getTeamDisplay(opponentTla, opponentName)
            const opponentFlag = getFlagUrl(opponentTla)
            const homeScore = isWC ? m.home_score_90 : m.home_score
            const awayScore = isWC ? m.away_score_90 : m.away_score
            const myScore = isHome ? homeScore : awayScore
            const theirScore = isHome ? awayScore : homeScore
            const dateStr = isWC
              ? new Date(m.kickoff_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
              : new Date(m.match_date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
            const stageLabel = isWC ? STAGE_LABELS[m.stage] || m.stage : m.competition

            return (
              <div key={idx} className="flex items-center gap-2.5 px-5 py-2.5">
                {resultTag(isHome, homeScore, awayScore)}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {opponentFlag && <img src={opponentFlag} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />}
                  <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{opponent}</span>
                </div>
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100 shrink-0">
                  {myScore}–{theirScore}
                </span>
                <div className="text-right shrink-0 w-16">
                  <div className="text-xs text-gray-400 dark:text-gray-500">{dateStr}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{stageLabel}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
