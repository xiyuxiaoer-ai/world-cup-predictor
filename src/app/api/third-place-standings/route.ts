import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('matches')
    .select('group_name, home_team, away_team, home_tla, away_tla, home_score_90, away_score_90, status')
    .eq('stage', 'group')

  if (!data) return NextResponse.json([])

  type Stats = { team: string; tla: string | null; pts: number; gf: number; ga: number; played: number }
  const groups: Record<string, { stats: Map<string, Stats>; unfinished: typeof data }> = {}

  for (const m of data) {
    if (!m.group_name) continue
    const g = m.group_name as string
    if (!groups[g]) groups[g] = { stats: new Map(), unfinished: [] }

    const { stats } = groups[g]
    if (!stats.has(m.home_team)) stats.set(m.home_team, { team: m.home_team, tla: m.home_tla, pts: 0, gf: 0, ga: 0, played: 0 })
    if (!stats.has(m.away_team)) stats.set(m.away_team, { team: m.away_team, tla: m.away_tla, pts: 0, gf: 0, ga: 0, played: 0 })

    if (m.status !== 'finished') {
      groups[g].unfinished.push(m)
      continue
    }
    const h = m.home_score_90 as number | null
    const a = m.away_score_90 as number | null
    if (h === null || a === null) continue

    const home = stats.get(m.home_team)!
    const away = stats.get(m.away_team)!
    home.gf += h; home.ga += a; home.played++
    away.gf += a; away.ga += h; away.played++
    if (h > a) home.pts += 3
    else if (h === a) { home.pts += 1; away.pts += 1 }
    else away.pts += 3
  }

  const result: {
    group: string
    team: string; tla: string | null
    pts: number; gf: number; ga: number; gd: number
    played: number; remaining: number
    vsTeam: string | null; vsTla: string | null
    fourth: { team: string; tla: string | null; pts: number; gf: number; ga: number; gd: number; vsTeam: string | null; vsTla: string | null } | null
  }[] = []

  for (const [groupName, { stats, unfinished }] of Object.entries(groups)) {
    const sorted = [...stats.values()]
      .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
    if (sorted.length < 3) continue

    const third = sorted[2]
    const fourth = sorted[3] ?? null
    const remaining = 3 - third.played

    // 找第3名的剩余对手
    const thirdMatch = unfinished.find(m => m.home_team === third.team || m.away_team === third.team)
    const vsTeam = thirdMatch
      ? (thirdMatch.home_team === third.team ? thirdMatch.away_team : thirdMatch.home_team)
      : null
    const vsTla = thirdMatch
      ? (thirdMatch.home_team === third.team ? thirdMatch.away_tla : thirdMatch.home_tla)
      : null

    // 第4名：只有在剩余场次 > 0 且理论上能追上时才返回
    let fourthData = null
    if (fourth && remaining > 0 && fourth.pts + 3 >= third.pts) {
      const fourthMatch = unfinished.find(m => m.home_team === fourth.team || m.away_team === fourth.team)
      fourthData = {
        team: fourth.team,
        tla: fourth.tla,
        pts: fourth.pts,
        gf: fourth.gf,
        ga: fourth.ga,
        gd: fourth.gf - fourth.ga,
        vsTeam: fourthMatch
          ? (fourthMatch.home_team === fourth.team ? fourthMatch.away_team : fourthMatch.home_team)
          : null,
        vsTla: fourthMatch
          ? (fourthMatch.home_team === fourth.team ? fourthMatch.away_tla : fourthMatch.home_tla)
          : null,
      }
    }

    result.push({
      group: groupName.replace('GROUP_', ''),
      team: third.team, tla: third.tla,
      pts: third.pts, gf: third.gf, ga: third.ga, gd: third.gf - third.ga,
      played: third.played, remaining,
      vsTeam, vsTla,
      fourth: fourthData,
    })
  }

  result.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
  return NextResponse.json(result)
}
