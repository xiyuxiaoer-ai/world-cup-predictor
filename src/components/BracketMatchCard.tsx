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
  homeConfirmed?: boolean
  awayConfirmed?: boolean
  roundColor?: string
}

function Flag({ tla, faded }: { tla: string | null | undefined; faded?: boolean }) {
  const url = tla ? getFlagUrl(tla) : null
  if (url) return (
    <img src={url} alt="" className={`w-[18px] h-[13px] object-cover rounded-[2px] shrink-0 ${faded ? 'opacity-25' : ''}`} />
  )
  return <span className="w-[18px] h-[13px] shrink-0 rounded-[2px] bg-black/[0.06] dark:bg-white/[0.06]" />
}

function Row({ tla, name, score, winner, loser, unknown }: {
  tla: string | null | undefined
  name: string
  score: number | null
  winner: boolean
  loser: boolean
  unknown: boolean
}) {
  return (
    <div className={`flex items-center gap-[5px] px-[6px] h-[22px] transition-colors ${
      winner ? 'bg-amber-400/[0.13] dark:bg-amber-500/[0.12]' : ''
    }`}>
      <Flag tla={tla} faded={loser} />
      <span className={`flex-1 text-[10px] truncate leading-none min-w-0 transition-colors ${
        unknown ? 'text-gray-400/40 dark:text-gray-600/70' :
        loser ? 'text-gray-400/60 dark:text-gray-500/80 line-through decoration-gray-300/50' :
        winner ? 'font-semibold text-gray-900 dark:text-gray-50' :
        'text-gray-700 dark:text-gray-300'
      }`}>
        {name}
      </span>
      {score !== null && (
        <span className={`text-[11px] font-bold shrink-0 leading-none tabular-nums w-3 text-right ${
          winner ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400/80 dark:text-gray-500'
        }`}>
          {score}
        </span>
      )}
    </div>
  )
}

export default function BracketMatchCard({
  match, homeLabel = '待定', awayLabel = '待定',
  homeTla, awayTla, homeConfirmed, awayConfirmed, roundColor,
}: Props) {
  if (!match) {
    const homeDisplay = homeTla ? (getTeamZh(homeTla) ?? homeLabel) : homeLabel
    const awayDisplay = awayTla ? (getTeamZh(awayTla) ?? awayLabel) : awayLabel
    const homeKnown = !!homeTla
    const awayKnown = !!awayTla
    return (
      <div className={`w-20 rounded-lg overflow-hidden shrink-0
        border border-dashed border-black/[0.08] dark:border-white/[0.09]
        backdrop-blur-[6px]
        ${roundColor ?? 'bg-white/20 dark:bg-white/[0.03]'}`}>
        <div className="flex items-center gap-[5px] px-[6px] h-[22px]">
          <Flag tla={homeTla} />
          <span className={`flex-1 text-[10px] truncate leading-none ${
            homeKnown ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400/50 dark:text-gray-600/60'
          }`}>
            {homeDisplay}
          </span>
          {homeKnown && !homeConfirmed && (
            <span className="text-[9px] text-gray-400/40 shrink-0 leading-none">?</span>
          )}
        </div>
        <div className="h-px bg-black/[0.05] dark:bg-white/[0.05]" />
        <div className="flex items-center gap-[5px] px-[6px] h-[22px]">
          <Flag tla={awayTla} />
          <span className={`flex-1 text-[10px] truncate leading-none ${
            awayKnown ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400/50 dark:text-gray-600/60'
          }`}>
            {awayDisplay}
          </span>
          {awayKnown && !awayConfirmed && (
            <span className="text-[9px] text-gray-400/40 shrink-0 leading-none">?</span>
          )}
        </div>
      </div>
    )
  }

  const finished = match.status === 'FINISHED' || match.status === 'finished'
  const h = match.home_score_90
  const a = match.away_score_90
  const homeWin = finished && h !== null && a !== null && h > a
  const awayWin = finished && h !== null && a !== null && a > h

  const homeTbd = match.home_team === 'TBD' || !match.home_team
  const awayTbd = match.away_team === 'TBD' || !match.away_team
  const homeName = homeTbd
    ? (homeTla ? (getTeamZh(homeTla) ?? homeLabel) : homeLabel)
    : getTeamDisplay(match.home_tla, match.home_team)
  const awayName = awayTbd
    ? (awayTla ? (getTeamZh(awayTla) ?? awayLabel) : awayLabel)
    : getTeamDisplay(match.away_tla, match.away_team)
  const effectiveHomeTla = homeTbd ? homeTla : match.home_tla
  const effectiveAwayTla = awayTbd ? awayTla : match.away_tla

  return (
    <div className={`w-20 rounded-lg overflow-hidden shrink-0
      border border-white/50 dark:border-white/[0.13]
      backdrop-blur-[8px]
      shadow-sm shadow-black/[0.07] dark:shadow-black/30
      ${roundColor ?? 'bg-white/80 dark:bg-gray-800/75'}`}>
      <Row tla={effectiveHomeTla} name={homeName} score={finished ? h : null} winner={homeWin} loser={awayWin} unknown={false} />
      <div className="h-px bg-black/[0.05] dark:bg-white/[0.06]" />
      <Row tla={effectiveAwayTla} name={awayName} score={finished ? a : null} winner={awayWin} loser={homeWin} unknown={false} />
    </div>
  )
}
