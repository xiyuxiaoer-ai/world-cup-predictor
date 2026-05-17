import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('game_id')
  if (!gameId) return NextResponse.json({ error: 'game_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: matches }, { data: allPredictions }, { data: members }] = await Promise.all([
    supabase.from('matches').select('*').order('kickoff_time', { ascending: true }),
    supabase
      .from('predictions')
      .select('*, profiles(username, display_name, avatar_url)')
      .eq('game_id', gameId),
    supabase
      .from('game_members')
      .select('user_id, profiles(username, display_name, avatar_url)')
      .eq('game_id', gameId),
  ])

  const result = (matches || []).map(match => {
    const matchPredictions = (allPredictions || [])
      .filter(p => p.match_id === match.id)
      .sort((a, b) => {
        const nameA = (a.profiles?.display_name || a.profiles?.username || '').toLowerCase()
        const nameB = (b.profiles?.display_name || b.profiles?.username || '').toLowerCase()
        return nameA.localeCompare(nameB)
      })
    const userPrediction = matchPredictions.find(p => p.user_id === user.id)

    return {
      ...match,
      user_prediction: userPrediction || null,
      // 防作弊：只有自己猜过才能看到别人的猜测
      predictions: userPrediction ? matchPredictions : [],
    }
  })

  return NextResponse.json({ matches: result, members: members || [] })
}
