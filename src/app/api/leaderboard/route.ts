import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('game_id')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!gameId) return NextResponse.json({ error: 'game_id required' }, { status: 400 })

  const [{ data: members }, { data: predictions }] = await Promise.all([
    supabase
      .from('game_members')
      .select('user_id, profiles(username, display_name, avatar_url)')
      .eq('game_id', gameId),
    supabase
      .from('predictions')
      .select('user_id, points_earned')
      .eq('game_id', gameId),
  ])

  const pointsMap: Record<string, number> = {}
  const countMap: Record<string, number> = {}

  for (const pred of predictions || []) {
    pointsMap[pred.user_id] = (pointsMap[pred.user_id] || 0) + (pred.points_earned || 0)
    countMap[pred.user_id] = (countMap[pred.user_id] || 0) + 1
  }

  const leaderboard = (members || [])
    .map(m => ({
      user_id: m.user_id,
      username: (m.profiles as any)?.username || '',
      display_name: (m.profiles as any)?.display_name || '',
      avatar_url: (m.profiles as any)?.avatar_url || null,
      total_points: pointsMap[m.user_id] || 0,
      prediction_count: countMap[m.user_id] || 0,
    }))
    .sort((a, b) => b.total_points - a.total_points)

  return NextResponse.json(leaderboard)
}
