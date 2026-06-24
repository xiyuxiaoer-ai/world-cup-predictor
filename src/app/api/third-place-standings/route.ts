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

  const groups: Record<string, Map<string, Stats>> = {}

  for (const m of data) {
    if (!m.group_name) continue
    const g = m.group_name as string
    if (!groups[g]) groups[g] = new Map()
    const gMap = groups[g]

    if (!gMap.has(m.home_team)) gMap.set(m.home_team, { team: m.home_team, tla: m.home_tla, pts: 0, gf: 0, ga: 0, played: 0 })
    if (!gMap.has(m.away_team)) gMap.set(m.away_team, { team: m.away_team, tla: m.away_tla, pts: 0, gf: 0, ga: 0, played: 0 })

    if (m.status !== 'finished') continue
    const h = m.home_score_90 as number | null
    const a = m.away_score_90 as number | null
    if (h === null || a === null) continue

    const home = gMap.get(m.home_team)!
    const away = gMap.get(m.away_team)!
    home.gf += h; home.ga += a; home.played++
    away.gf += a; away.ga += h; away.played++
    if (h > a) home.pts += 3
    else if (h === a) { home.pts += 1; away.pts += 1 }
    else away.pts += 3
  }

  const result: {
    group: string; team: string; tla: string | null
    pts: number; gf: number; ga: number; gd: number
    played: number; remaining: number
  }[] = []

  for (const [groupName, teams] of Object.entries(groups)) {
    const sorted = [...teams.values()]
      .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
    if (sorted.length < 3) continue

    const third = sorted[2]
    result.push({
      group: groupName.replace('GROUP_', ''),
      team: third.team,
      tla: third.tla,
      pts: third.pts,
      gf: third.gf,
      ga: third.ga,
      gd: third.gf - third.ga,
      played: third.played,
      remaining: 3 - third.played,   // 每队共踢3场
    })
  }

  result.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
  return NextResponse.json(result)
}
