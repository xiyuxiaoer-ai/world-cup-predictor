import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const KNOCKOUT_STAGES = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final']

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('id, api_match_id, stage, home_team, away_team, home_tla, away_tla, home_score_90, away_score_90, home_score_pen, away_score_pen, home_score_et, away_score_et, penalty_winner, et_winner, status, kickoff_time')
    .in('stage', KNOCKOUT_STAGES)
    .order('kickoff_time')

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data || [])
}
