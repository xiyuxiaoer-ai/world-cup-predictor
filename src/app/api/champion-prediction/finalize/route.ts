import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 防止重复结算
  const { data: alreadyApplied } = await supabaseAdmin
    .from('champion_predictions')
    .select('id')
    .not('bonus_applied_at', 'is', null)
    .limit(1)
    .single()
  if (alreadyApplied) return NextResponse.json({ error: '彩蛋积分已经结算过了，不可重复操作' }, { status: 400 })

  // 取决赛结果
  const { data: finalMatch } = await supabaseAdmin
    .from('matches')
    .select('home_team, home_tla, away_team, away_tla, result_90, et_winner, penalty_winner, status')
    .eq('stage', 'final')
    .single()

  if (!finalMatch || finalMatch.status !== 'finished') {
    return NextResponse.json({ error: '决赛尚未结束，无法结算' }, { status: 400 })
  }

  let champion: string
  if (finalMatch.penalty_winner) {
    champion = finalMatch.penalty_winner
  } else if (finalMatch.et_winner) {
    champion = finalMatch.et_winner
  } else if (finalMatch.result_90 === 'home_win') {
    champion = finalMatch.home_team
  } else {
    champion = finalMatch.away_team
  }

  // 取所有彩蛋预测
  const { data: predictions } = await supabaseAdmin.from('champion_predictions').select('*')
  if (!predictions?.length) return NextResponse.json({ success: true, champion, correct: 0, applied: 0 })

  let correct = 0
  let applied = 0
  const now = new Date().toISOString()

  for (const pred of predictions) {
    const isCorrect = pred.predicted_team === champion
    if (isCorrect) {
      correct++
      // 取该用户加入的所有 game
      const { data: memberships } = await supabaseAdmin
        .from('game_members')
        .select('game_id')
        .eq('user_id', pred.user_id)

      for (const m of memberships || []) {
        await supabaseAdmin
          .from('game_members')
          .update({ champion_bonus: pred.bonus_points })
          .eq('user_id', pred.user_id)
          .eq('game_id', m.game_id)
        applied++
      }
    }

    await supabaseAdmin
      .from('champion_predictions')
      .update({ is_correct: isCorrect, bonus_applied_at: now })
      .eq('id', pred.id)
  }

  return NextResponse.json({ success: true, champion, correct, applied })
}
