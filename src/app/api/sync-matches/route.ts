import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculatePoints, getMissPenalty } from '@/lib/scores'
import { R32_SLOTS } from '@/lib/bracketSlots'
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

  const [matchesRes, standingsRes] = await Promise.all([
    fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_TOKEN! },
      cache: 'no-store',
    }),
    fetch('https://api.football-data.org/v4/competitions/WC/standings', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_TOKEN! },
      cache: 'no-store',
    }),
  ])

  if (!matchesRes.ok) return NextResponse.json({ error: '获取比赛数据失败' }, { status: 500 })

  const { matches } = await matchesRes.json()

  // 从 standings 建立 "A1"/"K2"/"G2" → 球队 的映射，用于补充 R32 中 TBD 的具体小组槽位
  const groupSlotTeam: Record<string, { name: string; tla: string | null }> = {}
  if (standingsRes.ok) {
    const { standings } = await standingsRes.json()
    for (const group of standings || []) {
      // API 返回 "Group A" 或 "GROUP_A" 两种格式，统一提取末尾单字母
      const raw = (group.group as string) || ''
      const letter = raw.replace(/^(GROUP_|Group\s+)/i, '').trim()
      if (!letter || letter.length !== 1) continue
      for (const row of group.table || []) {
        const key = `${letter}${row.position}` // e.g. "K2", "G1"
        groupSlotTeam[key] = {
          name: row.team.name || row.team.shortName || 'TBD',
          tla: row.team.tla || null,
        }
      }
    }
  }

  // 拉取 DB 中所有比赛作为 fallback（保护球队名 + 比分 + 状态，防止 API 抖动覆盖好数据）
  // 若查询失败则中止同步，绝不用空 prevMap 覆盖好数据
  const { data: allExisting, error: existingError } = await supabaseAdmin
    .from('matches')
    .select('api_match_id, home_team, away_team, home_tla, away_tla, status, home_score_90, away_score_90, home_score_et, away_score_et, home_score_pen, away_score_pen, result_90, et_winner, penalty_winner')
  if (existingError) return NextResponse.json({ error: '读取现有比赛数据失败，同步中止以保护数据' }, { status: 500 })
  const prevMap = new Map(
    (allExisting || []).map((m: any) => [String(m.api_match_id), m])
  )
  // 额外：通过已有积分的预测反查 finished 状态（防止 status 被 API 重置后保护失效）
  const { data: scoredPredictions } = await supabaseAdmin
    .from('predictions')
    .select('match_id, matches(api_match_id, home_score_90, away_score_90, home_score_et, away_score_et, home_score_pen, away_score_pen, result_90, et_winner, penalty_winner)')
    .not('points_earned', 'is', null)
  const scoredMatchIds = new Set<string>()
  for (const p of scoredPredictions || []) {
    const m = Array.isArray(p.matches) ? p.matches[0] : p.matches
    if (m?.api_match_id == null) continue
    const key = String(m.api_match_id)
    scoredMatchIds.add(key)
    // 若 prevMap 里该比赛比分丢失，从 scored prediction 补回
    const prev = prevMap.get(key)
    if (prev && prev.home_score_90 == null && m.home_score_90 != null) {
      prevMap.set(key, { ...prev, ...m })
    } else if (!prev) {
      prevMap.set(key, m)
    }
  }


  const transformed = matches.map((match: any) => {
    const kickoffTime = new Date(match.utcDate)
    const lockTime = new Date(kickoffTime.getTime() - 60 * 60 * 1000)
    const prev = prevMap.get(String(match.id))
    const wasFinished = prev?.status === 'finished' || scoredMatchIds.has(String(match.id))
    const isFinished = match.status === 'FINISHED' || wasFinished

    // ── 球队名：优先级 API > DB已有 > standings > TBD ──────────────────
    // 保证已有好数据不被 API 抖动覆盖成 TBD
    const homeFromApi = match.homeTeam.name || match.homeTeam.shortName || ''
    const awayFromApi = match.awayTeam.name || match.awayTeam.shortName || ''
    const prevHome = prev?.home_team && prev.home_team !== 'TBD' ? prev.home_team : ''
    const prevAway = prev?.away_team && prev.away_team !== 'TBD' ? prev.away_team : ''
    let homeName = homeFromApi || prevHome || 'TBD'
    let homeTla: string | null = match.homeTeam.tla || prev?.home_tla || null
    let awayName = awayFromApi || prevAway || 'TBD'
    let awayTla: string | null = match.awayTeam.tla || prev?.away_tla || null

    // standings 兜底：仅在仍为 TBD 且是具体小组槽位时补充
    const slot = match.stage === 'LAST_32' ? R32_SLOTS[match.id as number] : undefined
    if (slot) {
      if (homeName === 'TBD' && /^[A-L][12]$/.test(slot.homeLabel) && groupSlotTeam[slot.homeLabel]) {
        homeName = groupSlotTeam[slot.homeLabel].name
        homeTla = groupSlotTeam[slot.homeLabel].tla
      }
      if (awayName === 'TBD' && /^[A-L][12]$/.test(slot.awayLabel) && groupSlotTeam[slot.awayLabel]) {
        awayName = groupSlotTeam[slot.awayLabel].name
        awayTla = groupSlotTeam[slot.awayLabel].tla
      }
    }


    // ── 比分 & 结果 ────────────────────────────────────────────────────
    let result90 = prev?.result_90 ?? null
    let etWinner = prev?.et_winner ?? null
    let penaltyWinner = prev?.penalty_winner ?? null

    // football-data.org: ET/点球赛时 fullTime 含所有进球（包括点球）
    // 必须用 regularTime 取 90 分钟比分，用 penalties 取点球比分
    let apiHome90: number | null = null
    let apiAway90: number | null = null
    let apiHomePen: number | null = null
    let apiAwayPen: number | null = null
    let apiHomeET: number | null = null
    let apiAwayET: number | null = null

    if (match.status === 'FINISHED') {
      const hasET = match.score.extraTime?.home != null
      const hasPenalty = match.score.penalties?.home != null

      // 90分钟比分：优先用 regularTime（ET/点球赛时更准确），否则用 fullTime
      const src90 = (hasET || hasPenalty) && match.score.regularTime?.home != null
        ? match.score.regularTime
        : match.score.fullTime
      apiHome90 = src90.home
      apiAway90 = src90.away

      if (apiHome90 != null && apiAway90 != null) {
        if (apiHome90 > apiAway90) result90 = 'home_win'
        else if (apiAway90 > apiHome90) result90 = 'away_win'
        else result90 = 'draw'
      }

      if (hasPenalty) {
        // score.penalties 是包含 regularTime 的累积值，且不含 sudden death
        // 用 fullTime - regularTime(- extraTime) 才能得到完整点球阶段得分（含 sudden death）
        const regHome = match.score.regularTime?.home ?? 0
        const regAway = match.score.regularTime?.away ?? 0
        const etHome = hasET ? (match.score.extraTime?.home ?? 0) : 0
        const etAway = hasET ? (match.score.extraTime?.away ?? 0) : 0
        apiHomePen = match.score.fullTime.home - regHome - etHome
        apiAwayPen = match.score.fullTime.away - regAway - etAway
        penaltyWinner = match.score.winner === 'HOME_TEAM' ? match.homeTeam.name : match.awayTeam.name
      } else if (hasET) {
        apiHomeET = match.score.extraTime.home
        apiAwayET = match.score.extraTime.away
        etWinner = match.score.winner === 'HOME_TEAM' ? match.homeTeam.name : match.awayTeam.name
      }
    }

    // 保护：API 返回有效值时用 API（允许修正旧错误数据），API 返回 null 时保留 DB 旧值
    const home90  = apiHome90  ?? prev?.home_score_90  ?? null
    const away90  = apiAway90  ?? prev?.away_score_90  ?? null
    const homePen = apiHomePen ?? prev?.home_score_pen ?? null
    const awayPen = apiAwayPen ?? prev?.away_score_pen ?? null
    const homeET  = apiHomeET  ?? prev?.home_score_et  ?? null
    const awayET  = apiAwayET  ?? prev?.away_score_et  ?? null

    return {
      api_match_id: match.id,
      stage: STAGE_MAP[match.stage] || 'group',
      home_team: homeName,
      away_team: awayName,
      home_tla: homeTla,
      away_tla: awayTla,
      kickoff_time: match.utcDate,
      lock_time: lockTime.toISOString(),
      status: isFinished ? 'finished' : 'scheduled',
      home_score_90: isFinished ? home90 : null,
      away_score_90: isFinished ? away90 : null,
      home_score_et: isFinished ? homeET : null,
      away_score_et: isFinished ? awayET : null,
      home_score_pen: isFinished ? homePen : null,
      away_score_pen: isFinished ? awayPen : null,
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
