import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('game_id')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (gameId) {
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', user.id)

    const predictionMap: Record<string, any> = {}
    for (const p of predictions || []) {
      predictionMap[p.match_id] = p
    }

    return NextResponse.json({ matches, predictions: predictionMap })
  }

  return NextResponse.json({ matches })
}
