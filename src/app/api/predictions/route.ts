import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('game_id')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase
    .from('predictions')
    .select('*, matches(*)')
    .eq('user_id', user.id)

  if (gameId) query = query.eq('game_id', gameId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { game_id, match_id, pred_home_score, pred_away_score, pred_et_winner, pred_penalty_winner } = body

  const { data: match } = await supabase
    .from('matches')
    .select('lock_time, status')
    .eq('id', match_id)
    .single()

  if (!match) return NextResponse.json({ error: '比赛不存在' }, { status: 404 })
  if (new Date() >= new Date(match.lock_time)) {
    return NextResponse.json({ error: '该比赛已锁定，无法提交预测' }, { status: 400 })
  }

  // 已提交过就跳过，不覆盖
  const { data: existing } = await supabase
    .from('predictions')
    .select('id')
    .eq('game_id', game_id)
    .eq('user_id', user.id)
    .eq('match_id', match_id)
    .single()

  if (existing) return NextResponse.json({ skipped: true }, { status: 200 })

  const { data, error } = await supabase
    .from('predictions')
    .insert({
      game_id,
      user_id: user.id,
      match_id,
      pred_home_score,
      pred_away_score,
      pred_et_winner: pred_et_winner || null,
      pred_penalty_winner: pred_penalty_winner || null,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
