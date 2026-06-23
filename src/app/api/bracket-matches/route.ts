import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('id, api_match_id, stage, home_team, away_team, home_tla, away_tla, home_score_90, away_score_90, status, kickoff_time')
    .eq('stage', 'round_of_32')
    .order('kickoff_time')

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data || [])
}
