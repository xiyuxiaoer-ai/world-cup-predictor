import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tla = searchParams.get('tla')?.toUpperCase()
  if (!tla) return NextResponse.json({ error: 'tla required' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [wcResult, friendlyResult] = await Promise.all([
    admin
      .from('matches')
      .select('home_team, away_team, home_tla, away_tla, kickoff_time, home_score_90, away_score_90, home_score_et, away_score_et, home_score_pen, away_score_pen, stage, group_name')
      .or(`home_tla.eq.${tla},away_tla.eq.${tla}`)
      .eq('status', 'finished')
      .order('kickoff_time', { ascending: false }),
    admin
      .from('friendly_results')
      .select('home_team, away_team, home_tla, away_tla, home_score, away_score, match_date, competition')
      .or(`home_tla.eq.${tla},away_tla.eq.${tla}`)
      .order('match_date', { ascending: false }),
  ])

  return NextResponse.json({
    wc: wcResult.data || [],
    friendly: friendlyResult.data || [],
  })
}
