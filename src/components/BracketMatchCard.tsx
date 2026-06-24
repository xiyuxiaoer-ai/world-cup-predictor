import { getFlagUrl, getTeamDisplay, getTeamZh } from '@/lib/flags'

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
  match: BracketMatchData | null
  homeLabel?: string
  awayLabel?: string
  homeTla?: string | null
  awayTla?: string | null
  roundColor?: string
}

function TeamRow({ name, tla, slotTla, score, isWinner, isLoser, label }: {
  name: string; tla: string | null; slotTla?: string | null; score: number | null
  isWinner: boolean; isLoser: boolean; label: string
}) {
  const isTbd = name === 'TBD' || !name
  // 当 DB 里是 TBD 但积分榜已知时，用 slotTla 显示国旗和中文名
  const effectiveTla = isTbd ? (slotTla ?? null) : tla
  const flagUrl = effectiveTla ? getFlagUrl(effectiveTla) : null
  const display = isTbd
    ? (slotTla ? (getTeamZh(slotTla) ?? label) : label)
    : getTeamDisplay(tla, name)

  return (
    <div className={`flex items-center gap-1.5 px-2 py-[5px] ${isWinner ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
      {flagUrl
        ? <img src={flagUrl} alt="" className={`w-5 h-3.5 object-cover rounded-sm shrink-0 ${isLoser ? 'opacity-40' : ''}`} />
        : <span className="w-5 h-3.5 shrink-0" />
      }
      <span className={`text-[11px] flex-1 truncate leading-tight
        ${isTbd && !slotTla ? 'text-gray-400 dark:text-gray-500' :
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

function LabelRow({ label, tla }: { label: string; tla?: string | null }) {
  const flagUrl = tla ? getFlagUrl(tla) : null
  const display = tla ? (getTeamZh(tla) ?? label) : label
  const isKnown = !!tla
  return (
    <div className="px-2 py-[5px] flex items-center gap-1.5">
      {flagUrl
        ? <img src={flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
        : <span className="w-5 h-3.5 shrink-0" />
      }
      <span className={`text-[11px] truncate leading-tight ${isKnown ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}>
        {display}
      </span>
    </div>
  )
}

export default function BracketMatchCard({ match, homeLabel = '待定', awayLabel = '待定', homeTla, awayTla, roundColor = '' }: Props) {
  if (!match) {
    return (
      <div className={`w-[130px] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 overflow-hidden shrink-0 ${roundColor}`}>
        <LabelRow label={homeLabel} tla={homeTla} />
        <div className="h-px bg-gray-100 dark:bg-gray-800" />
        <LabelRow label={awayLabel} tla={awayTla} />
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
    <div className={`w-[130px] rounded-lg border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shrink-0 ${roundColor || 'bg-white dark:bg-gray-900'}`}>
      <div className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 border-b border-black/[0.04] dark:border-white/[0.06]">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">{dateStr}</span>
      </div>
      <TeamRow
        name={match.home_team} tla={match.home_tla} slotTla={homeTla}
        score={finished ? h : null}
        isWinner={homeWin} isLoser={awayWin}
        label={homeLabel}
      />
      <div className="h-px bg-gray-100 dark:bg-gray-800" />
      <TeamRow
        name={match.away_team} tla={match.away_tla} slotTla={awayTla}
        score={finished ? a : null}
        isWinner={awayWin} isLoser={homeWin}
        label={awayLabel}
      />
    </div>
  )
}
