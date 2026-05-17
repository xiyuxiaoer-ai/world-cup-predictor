import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculatePoints, getMissPenalty } from '@/lib/scores'
import type { Match, Prediction } from '@/types'

export async function POST() {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'finished')

  if (!matches?.length) return NextResponse.json({ updated: 0 })

  let updated = 0

  for (const match of matches as Match[]) {
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', match.id)
      .is('points_earned', null)

    if (!predictions?.length) continue

    for (const pred of predictions as Prediction[]) {
      const points = calculatePoints(match, pred)
      await supabase
        .from('predictions')
        .update({ points_earned: points })
        .eq('id', pred.id)
      updated++
    }

    const gameIds = [...new Set(predictions.map(p => p.game_id))]
    for (const gameId of gameIds) {
      const { data: members } = await supabase
        .from('game_members')
        .select('user_id')
        .eq('game_id', gameId)

      for (const member of members || []) {
        const hasPrediction = predictions.some(
          p => p.game_id === gameId && p.user_id === member.user_id
        )
        if (!hasPrediction) {
          await supabase.from('predictions').insert({
            game_id: gameId,
            user_id: member.user_id,
            match_id: match.id,
            pred_home_score: 0,
            pred_away_score: 0,
            points_earned: getMissPenalty(match.stage),
          })
          updated++
        }
      }
    }
  }

  return NextResponse.json({ updated })
}
