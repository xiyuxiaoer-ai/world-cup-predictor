import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type TeamStats = {
  team: string; tla: string | null
  pts: number; gf: number; ga: number; played: number
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('group_name, home_team, away_team, home_tla, away_tla, home_score_90, away_score_90, status')
    .eq('stage', 'group')

  if (error) return NextResponse.json({ standings: {} }, { status: 500 })

  const groups: Record<string, Record<string, TeamStats>> = {}

  for (const m of data ?? []) {
    if (!m.group_name) continue
    const g = m.group_name as string
    if (!groups[g]) groups[g] = {}

    const ensure = (team: string, tla: string | null) => {
      if (!groups[g][team]) groups[g][team] = { team, tla, pts: 0, gf: 0, ga: 0, played: 0 }
    }
    ensure(m.home_team, m.home_tla)
    ensure(m.away_team, m.away_tla)

    if (m.status !== 'finished') continue
    const h = m.home_score_90 as number | null
    const a = m.away_score_90 as number | null
    if (h === null || a === null) continue

    groups[g][m.home_team].gf += h
    groups[g][m.home_team].ga += a
    groups[g][m.away_team].gf += a
    groups[g][m.away_team].ga += h
    groups[g][m.home_team].played++
    groups[g][m.away_team].played++

    if (h > a) groups[g][m.home_team].pts += 3
    else if (h === a) { groups[g][m.home_team].pts += 1; groups[g][m.away_team].pts += 1 }
    else groups[g][m.away_team].pts += 3
  }

  const standings: Record<string, { team: string; tla: string | null; confirmed: boolean }[]> = {}

  for (const [g, teams] of Object.entries(groups)) {
    const sorted = Object.values(teams)
      .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)

    // 每队剩余场次（4支队轮换赛，每队共踢3场）
    const remaining = 3 - (sorted[0]?.played ?? 0)

    standings[g] = sorted.map((t, i) => {
      let confirmed = false
      if (remaining === 0) {
        // 小组全部打完，排名锁定
        confirmed = true
      } else if (i === 0 && sorted[1]) {
        // 第1名：积分严格大于第2名的最高可能积分
        confirmed = t.pts > sorted[1].pts + remaining * 3
      } else if (i === 1 && sorted[2]) {
        // 第2名：积分严格大于第3名的最高可能积分
        confirmed = t.pts > sorted[2].pts + remaining * 3
      }
      return { team: t.team, tla: t.tla, confirmed }
    })
  }

  return NextResponse.json({ standings })
}
