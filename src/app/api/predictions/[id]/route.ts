import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const homeScore = Number(body.pred_home_score)
  const awayScore = Number(body.pred_away_score)
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    return NextResponse.json({ error: '无效比分' }, { status: 400 })
  }
  const etWinner: string | null = body.pred_et_winner ?? null
  const penaltyWinner: string | null = body.pred_penalty_winner ?? null

  // Fetch the prediction
  const { data: pred } = await supabase
    .from('predictions')
    .select('id, user_id, match_id, game_id')
    .eq('id', id)
    .single()

  if (!pred) return NextResponse.json({ error: '预测不存在' }, { status: 404 })
  if (pred.user_id !== user.id) return NextResponse.json({ error: '无权修改' }, { status: 403 })

  // Match must not be finished
  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .eq('id', pred.match_id)
    .single()

  if (match?.status === 'finished') {
    return NextResponse.json({ error: '比赛已结束，无法修改' }, { status: 400 })
  }

  // Must be the only prediction for this match+game
  const { count } = await supabase
    .from('predictions')
    .select('id', { count: 'exact', head: true })
    .eq('match_id', pred.match_id)
    .eq('game_id', pred.game_id)

  if ((count ?? 0) > 1) {
    return NextResponse.json({ error: '其他成员已提交猜测，无法修改' }, { status: 400 })
  }

  const { error } = await supabase
    .from('predictions')
    .update({
      pred_home_score: homeScore,
      pred_away_score: awayScore,
      pred_et_winner: etWinner,
      pred_penalty_winner: penaltyWinner,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
