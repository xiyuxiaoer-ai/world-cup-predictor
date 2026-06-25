import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('game_id')
  const userId = searchParams.get('user_id')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!gameId || !userId) return NextResponse.json({ error: 'game_id and user_id required' }, { status: 400 })

  const { data: predictions, error } = await supabase
    .from('predictions')
    .select(`
      pred_home_score, pred_away_score, points_earned,
      match:matches(home_team, away_team, home_tla, away_tla, kickoff_time, home_score_90, away_score_90, stage, group_name)
    `)
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .not('points_earned', 'is', null)
    .neq('points_earned', 0)
    .order('kickoff_time', { ascending: false, referencedTable: 'matches' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(predictions || [])
}
