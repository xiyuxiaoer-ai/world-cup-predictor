import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const gameId = searchParams.get('game_id')
  if (!gameId) return NextResponse.json({ error: 'game_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 取该 game 的所有成员 user_id
  const { data: members } = await supabase
    .from('game_members')
    .select('user_id')
    .eq('game_id', gameId)

  if (!members?.length) return NextResponse.json([])

  const userIds = members.map(m => m.user_id)

  const { data: predictions } = await supabase
    .from('champion_predictions')
    .select('user_id, predicted_team, predicted_team_tla, stage_at_prediction, bonus_points, predicted_at, is_correct')
    .in('user_id', userIds)

  return NextResponse.json(predictions || [])
}
