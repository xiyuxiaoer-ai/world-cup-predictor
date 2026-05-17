import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculatePoints, getMissPenalty } from '@/lib/scores'
import type { Match, Prediction } from '@/types'

const STAGE_MAP: Record<string, string> = {
  GROUP_STAGE: 'group',
  LAST_32: 'round_of_32',
  LAST_16: 'round_of_16',
  QUARTER_FINALS: 'quarter_final',
  SEMI_FINALS: 'semi_final',
  THIRD_PLACE: 'third_place',
  FINAL: 'final',
}

export async function POST() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_TOKEN! },
    cache: 'no-store',
  })

  if (!res.ok) return NextResponse.json({ error: '获取比赛数据失败' }, { status: 500 })

  const { matches } = await res.json()

  const transformed = matches.map((match: any) => {
    const kickoffTime = new Date(match.utcDate)
    const lockTime = new Date(kickoffTime.getTime() - 60 * 60 * 1000)
    const isFinished = match.status === 'FINISHED'

    let result90 = null, etWinner = null, penaltyWinner = null

    if (isFinished) {
      const h = match.score.fullTime.home
      const a = match.score.fullTime.away
      if (h > a) result90 = 'home_win'
      else if (a > h) result90 = 'away_win'
      else result90 = 'draw'

      const hasET = match.score.extraTime?.home != null
      const hasPenalty = match.score.penalties?.home != null

      if (hasPenalty) {
        penaltyWinner = match.score.winner === 'HOME_TEAM' ? match.homeTeam.name : match.awayTeam.name
      } else if (hasET) {
        etWinner = match.score.winner === 'HOME_TEAM' ? match.homeTeam.name : match.awayTeam.name
      }
    }

    return {
      api_match_id: match.id,
      stage: STAGE_MAP[match.stage] || 'group',
      home_team: match.homeTeam.name || match.homeTeam.shortName || 'TBD',
      away_team: match.awayTeam.name || match.awayTeam.shortName || 'TBD',
      home_tla: match.homeTeam.tla || null,
      away_tla: match.awayTeam.tla || null,
      kickoff_time: match.utcDate,
      lock_time: lockTime.toISOString(),
      status: isFinished ? 'finished' : 'scheduled',
      home_score_90: isFinished ? match.score.fullTime.home : null,
      away_score_90: isFinished ? match.score.fullTime.away : null,
      result_90: result90,
      et_winner: etWinner,
      penalty_winner: penaltyWinner,
      group_name: match.group || null,
    }
  })

  const { error } = await supabaseAdmin
    .from('matches')
    .upsert(transformed, { onConflict: 'api_match_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 自动计算积分
  const { data: finishedMatches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('status', 'finished')

  let scored = 0
  for (const match of (finishedMatches as Match[]) || []) {
    const { data: predictions } = await supabaseAdmin
      .from('predictions')
      .select('*')
      .eq('match_id', match.id)
      .is('points_earned', null)

    if (!predictions?.length) continue

    for (const pred of predictions as Prediction[]) {
      const points = calculatePoints(match, pred)
      await supabaseAdmin.from('predictions').update({ points_earned: points }).eq('id', pred.id)
      scored++
    }

    // 漏猜惩罚
    const gameIds = [...new Set(predictions.map(p => p.game_id))]
    for (const gameId of gameIds) {
      const { data: members } = await supabaseAdmin
        .from('game_members').select('user_id').eq('game_id', gameId)
      for (const member of members || []) {
        const hasPred = predictions.some(p => p.game_id === gameId && p.user_id === member.user_id)
        if (!hasPred) {
          await supabaseAdmin.from('predictions').insert({
            game_id: gameId, user_id: member.user_id, match_id: match.id,
            pred_home_score: 0, pred_away_score: 0,
            points_earned: getMissPenalty(match.stage),
          })
          scored++
        }
      }
    }
  }

  return NextResponse.json({ success: true, matches: transformed.length, scored })
}
