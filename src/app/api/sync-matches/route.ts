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

// Vercel Cron 每日自动调用（GET + Bearer CRON_SECRET 鉴权）
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('Authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runSync()
}

export async function POST() {
  return runSync()
}

async function runSync() {
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

  // 拿已经是 finished 的比赛
  const { data: alreadyFinished } = await supabaseAdmin
    .from('matches')
    .select('api_match_id, home_score_90, away_score_90, result_90, et_winner, penalty_winner')
    .eq('status', 'finished')
  // 额外：通过已有积分的预测反查比赛 ID（防止 status 被重置后仍能保护）
  const { data: scoredPredictions } = await supabaseAdmin
    .from('predictions')
    .select('match_id, matches(api_match_id, home_score_90, away_score_90, result_90, et_winner, penalty_winner)')
    .not('points_earned', 'is', null)
  // 合并两个来源，用 String() 统一类型，避免 number vs string 的 has() 失效
  const finishedMap = new Map(
    (alreadyFinished || []).map((m: any) => [String(m.api_match_id), m])
  )
  for (const p of scoredPredictions || []) {
    const m = Array.isArray(p.matches) ? p.matches[0] : p.matches
    if (m?.api_match_id != null && !finishedMap.has(String(m.api_match_id))) {
      finishedMap.set(String(m.api_match_id), m)
    }
  }

  const transformed = matches.map((match: any) => {
    const kickoffTime = new Date(match.utcDate)
    const lockTime = new Date(kickoffTime.getTime() - 60 * 60 * 1000)
    const existing = finishedMap.get(String(match.id))
    const isFinished = match.status === 'FINISHED' || !!existing

    let result90 = existing?.result_90 ?? null
    let etWinner = existing?.et_winner ?? null
    let penaltyWinner = existing?.penalty_winner ?? null

    // 只有 API 明确返回 FINISHED 时才从 API 取比分（不信任 existing 保护下的 API 数据）
    if (match.status === 'FINISHED') {
      const h = match.score.fullTime.home
      const a = match.score.fullTime.away
      if (h != null && a != null) {
        if (h > a) result90 = 'home_win'
        else if (a > h) result90 = 'away_win'
        else result90 = 'draw'
      }

      const hasET = match.score.extraTime?.home != null
      const hasPenalty = match.score.penalties?.home != null

      if (hasPenalty) {
        penaltyWinner = match.score.winner === 'HOME_TEAM' ? match.homeTeam.name : match.awayTeam.name
      } else if (hasET) {
        etWinner = match.score.winner === 'HOME_TEAM' ? match.homeTeam.name : match.awayTeam.name
      }
    }

    // 比分：优先用 DB 已有的值，其次用 API 返回的值（仅 API 明确为 FINISHED 时）
    const apiHome = match.status === 'FINISHED' ? match.score.fullTime.home : null
    const apiAway = match.status === 'FINISHED' ? match.score.fullTime.away : null
    const home90 = existing?.home_score_90 ?? apiHome
    const away90 = existing?.away_score_90 ?? apiAway

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
      home_score_90: isFinished ? home90 : null,
      away_score_90: isFinished ? away90 : null,
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
