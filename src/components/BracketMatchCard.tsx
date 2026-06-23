import { getFlagUrl, getTeamDisplay } from '@/lib/flags'

export type BracketMatchData = {
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

type Props = {
  match: BracketMatchData | null   // null = 占位（还没打到这轮）
  homeLabel?: string               // TBD 时的槽位标签
  awayLabel?: string
}

function TeamRow({ name, tla, score, isWinner, isLoser, label }: {
  name: string; tla: string | null; score: number | null
  isWinner: boolean; isLoser: boolean; label: string
}) {
  const isTbd = name === 'TBD' || !name
  const flagUrl = !isTbd && tla ? getFlagUrl(tla) : null
  const display = isTbd ? label : getTeamDisplay(tla, name)

  return (
    <div className={`flex items-center gap-1.5 px-2 py-[5px] ${isWinner ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
      {flagUrl
        ? <img src={flagUrl} alt="" className={`w-5 h-3.5 object-cover rounded-sm shrink-0 ${isLoser ? 'opacity-40' : ''}`} />
        : <span className="w-5 h-3.5 shrink-0" />
      }
      <span className={`text-[11px] flex-1 truncate leading-tight
        ${isTbd ? 'text-gray-400 dark:text-gray-500' :
          isLoser ? 'text-gray-400 dark:text-gray-500 line-through' :
          isWinner ? 'font-bold text-gray-900 dark:text-gray-100' :
          'text-gray-700 dark:text-gray-300'}`}>
        {display}
      </span>
      {score !== null && (
        <span className={`text-[11px] font-bold shrink-0 w-3 text-right
          ${isWinner ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
          {score}
        </span>
      )}
    </div>
  )
}

export default function BracketMatchCard({ match, homeLabel = '待定', awayLabel = '待定' }: Props) {
  if (!match) {
    return (
      <div className="w-[130px] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
        <div className="px-2 py-[5px] flex items-center gap-1.5">
          <span className="w-5 h-3.5 shrink-0" />
          <span className="text-[11px] text-gray-300 dark:text-gray-600 truncate">{homeLabel}</span>
        </div>
        <div className="h-px bg-gray-100 dark:bg-gray-800" />
        <div className="px-2 py-[5px] flex items-center gap-1.5">
          <span className="w-5 h-3.5 shrink-0" />
          <span className="text-[11px] text-gray-300 dark:text-gray-600 truncate">{awayLabel}</span>
        </div>
      </div>
    )
  }

  const finished = match.status === 'FINISHED' || match.status === 'finished'
  const h = match.home_score_90
  const a = match.away_score_90
  const homeWin = finished && h !== null && a !== null && h > a
  const awayWin = finished && h !== null && a !== null && a > h

  const dateStr = new Date(match.kickoff_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })

  return (
    <div className="w-[130px] rounded-lg border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shrink-0 bg-white dark:bg-gray-900">
      <div className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 border-b border-black/[0.04] dark:border-white/[0.06]">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">{dateStr}</span>
      </div>
      <TeamRow
        name={match.home_team} tla={match.home_tla}
        score={finished ? h : null}
        isWinner={homeWin} isLoser={awayWin}
        label={homeLabel}
      />
      <div className="h-px bg-gray-100 dark:bg-gray-800" />
      <TeamRow
        name={match.away_team} tla={match.away_tla}
        score={finished ? a : null}
        isWinner={awayWin} isLoser={homeWin}
        label={awayLabel}
      />
    </div>
  )
}
