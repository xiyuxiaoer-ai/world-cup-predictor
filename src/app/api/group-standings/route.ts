import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type TeamStats = {
  team: string
  tla: string | null
  pts: number
  gf: number
  ga: number
  gd: number
  played: number
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('group_name, home_team, away_team, home_tla, away_tla, home_score_90, away_score_90, status')
    .eq('stage', 'group')
    .eq('status', 'finished')

  if (error) return NextResponse.json({}, { status: 500 })

  // 按组计算积分
  const groups: Record<string, Record<string, TeamStats>> = {}

  for (const m of data ?? []) {
    if (!m.group_name) continue
    const g = m.group_name as string
    if (!groups[g]) groups[g] = {}

    const h = m.home_score_90 as number | null
    const a = m.away_score_90 as number | null
    if (h === null || a === null) continue

    const ensure = (team: string, tla: string | null) => {
      if (!groups[g][team]) groups[g][team] = { team, tla, pts: 0, gf: 0, ga: 0, gd: 0, played: 0 }
    }
    ensure(m.home_team, m.home_tla)
    ensure(m.away_team, m.away_tla)

    groups[g][m.home_team].gf += h
    groups[g][m.home_team].ga += a
    groups[g][m.away_team].gf += a
    groups[g][m.away_team].ga += h
    groups[g][m.home_team].played++
    groups[g][m.away_team].played++

    if (h > a) {
      groups[g][m.home_team].pts += 3
    } else if (h === a) {
      groups[g][m.home_team].pts += 1
      groups[g][m.away_team].pts += 1
    } else {
      groups[g][m.away_team].pts += 3
    }
  }

  // 排序：积分 → 净胜球 → 进球数
  const result: Record<string, { team: string; tla: string | null }[]> = {}
  for (const [g, teams] of Object.entries(groups)) {
    result[g] = Object.values(teams)
      .map(t => ({ ...t, gd: t.gf - t.ga }))
      .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
      .map(t => ({ team: t.team, tla: t.tla }))
  }

  return NextResponse.json(result)
}
