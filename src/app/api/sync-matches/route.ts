import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculatePoints, getMissPenalty } from '@/lib/scores'
import { R32_SLOTS, LATER_SLOT_BY_ID } from '@/lib/bracketSlots'
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


  // ── R32 胜者 → 补充 R16 队名（API 有时不及时传播，如 winner=null 的 bug）──
  // 奇数 posInRound 的 R32 胜者 → 该 R16 比赛的主队；偶数 → 客队
  type TeamRef = { name: string; tla: string | null }
  const r32Supplement = new Map<number, { homeSlot: TeamRef | null; awaySlot: TeamRef | null }>()
  for (const m of matches) {
    if (m.stage !== 'LAST_32' || m.status !== 'FINISHED') continue
    const slot = R32_SLOTS[m.id as number]
    if (!slot) continue

    let winnerName: string | null = null
    let winnerTla: string | null = null

    if (m.score.winner === 'HOME_TEAM') {
      winnerName = m.homeTeam.name || m.homeTeam.shortName || null
      winnerTla = m.homeTeam.tla || null
    } else if (m.score.winner === 'AWAY_TEAM') {
      winnerName = m.awayTeam.name || m.awayTeam.shortName || null
      winnerTla = m.awayTeam.tla || null
    } else {
      // API winner=null（已知 bug），回退到 DB 存储的点球/加时胜者
      const prev = prevMap.get(String(m.id))
      const stored = prev?.penalty_winner ?? prev?.et_winner ?? null
      if (stored) {
        const homeApiName = m.homeTeam.name || m.homeTeam.shortName || ''
        const awayApiName = m.awayTeam.name || m.awayTeam.shortName || ''
        if (stored === homeApiName) {
          winnerName = homeApiName; winnerTla = m.homeTeam.tla || null
        } else {
          winnerName = awayApiName; winnerTla = m.awayTeam.tla || null
        }
      }
    }

    if (!winnerName) continue
    const cur = r32Supplement.get(slot.feedsInto) ?? { homeSlot: null, awaySlot: null }
    // 奇数 posInRound → R16 主队槽位，偶数 → 客队槽位
    if (slot.posInRound % 2 === 1) {
      r32Supplement.set(slot.feedsInto, { ...cur, homeSlot: { name: winnerName, tla: winnerTla } })
    } else {
      r32Supplement.set(slot.feedsInto, { ...cur, awaySlot: { name: winnerName, tla: winnerTla } })
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


    // ── R16+ TBD 补充：从 R32 胜者推算（仅当 API 仍返回 TBD 时生效）──────
    if (match.stage !== 'LAST_32') {
      const laterNum = LATER_SLOT_BY_ID[match.id as number]
      if (laterNum !== undefined) {
        const supp = r32Supplement.get(laterNum)
        if (supp) {
          if ((homeName === 'TBD' || !homeName) && supp.homeSlot) {
            homeName = supp.homeSlot.name
            homeTla = supp.homeSlot.tla
          }
          if ((awayName === 'TBD' || !awayName) && supp.awaySlot) {
            awayName = supp.awaySlot.name
            awayTla = supp.awaySlot.tla
          }
        }
      }
    }

    // ── 比分 & 结果 ────────────────────────────────────────────────────
    // 已算分比赛（scoredMatchIds）：完全跳过 upsert，DB 数据不被任何 API 覆盖
    // 注意：不能用 partial upsert（scorePayload={}），Supabase 会把缺失字段设为 NULL
    // 正确做法：从 upsert 数组里整条移除
    const isScored = scoredMatchIds.has(String(match.id))

    let result90 = prev?.result_90 ?? null
    let etWinner = prev?.et_winner ?? null
    let penaltyWinner = prev?.penalty_winner ?? null
    let home90: number | null = null
    let away90: number | null = null
    let homePen: number | null = null
    let awayPen: number | null = null
    let homeET: number | null = null
    let awayET: number | null = null

    if (match.status === 'FINISHED') {
      const hasET = match.score.extraTime?.home != null
      const hasPenalty = match.score.penalties?.home != null
      const regTimeHome = match.score.regularTime?.home

      // API 偶尔不返回 regularTime（已知不稳定）：用 fullTime 会算错点球赛
      // 如果 regularTime 缺失但 DB 已有比分，直接沿用 DB（比重算更可靠）
      const apiIncomplete = (hasET || hasPenalty) && regTimeHome == null

      if (apiIncomplete && prev?.home_score_90 != null) {
        // API 数据不完整，信任 DB 现有值
        home90 = prev.home_score_90
        away90 = prev.away_score_90
        homePen = prev.home_score_pen ?? null
        awayPen = prev.away_score_pen ?? null
        homeET  = prev.home_score_et  ?? null
        awayET  = prev.away_score_et  ?? null
      } else {
        // 正常计算
        const src90 = (hasET || hasPenalty) && regTimeHome != null
          ? match.score.regularTime
          : match.score.fullTime
        home90 = src90.home
        away90 = src90.away

        if (hasPenalty) {
          const regHome = match.score.regularTime?.home ?? 0
          const regAway = match.score.regularTime?.away ?? 0
          const etHome = hasET ? (match.score.extraTime?.home ?? 0) : 0
          const etAway = hasET ? (match.score.extraTime?.away ?? 0) : 0
          // fullTime = regularTime + extraTime + penaltyKicks
          homePen = match.score.fullTime.home - regHome - etHome
          awayPen = match.score.fullTime.away - regAway - etAway
          penaltyWinner = match.score.winner === 'HOME_TEAM' ? match.homeTeam.name : match.awayTeam.name
        } else if (hasET) {
          homeET = match.score.extraTime.home
          awayET = match.score.extraTime.away
          etWinner = match.score.winner === 'HOME_TEAM' ? match.homeTeam.name : match.awayTeam.name
        }
      }

      if (home90 != null && away90 != null) {
        if (home90 > away90) result90 = 'home_win'
        else if (away90 > home90) result90 = 'away_win'
        else result90 = 'draw'
      }
    }

    return {
      _isScored: isScored,
      api_match_id: match.id,
      stage: STAGE_MAP[match.stage] || 'group',
      home_team: homeName,
      away_team: awayName,
      home_tla: homeTla,
      away_tla: awayTla,
      kickoff_time: match.utcDate,
      lock_time: lockTime.toISOString(),
      status: isFinished ? 'finished' : 'scheduled',
      home_score_90:  isFinished ? (home90  ?? prev?.home_score_90  ?? null) : null,
      away_score_90:  isFinished ? (away90  ?? prev?.away_score_90  ?? null) : null,
      home_score_et:  isFinished ? (homeET  ?? prev?.home_score_et  ?? null) : null,
      away_score_et:  isFinished ? (awayET  ?? prev?.away_score_et  ?? null) : null,
      home_score_pen: isFinished ? (homePen ?? prev?.home_score_pen ?? null) : null,
      away_score_pen: isFinished ? (awayPen ?? prev?.away_score_pen ?? null) : null,
      result_90: result90,
      et_winner: etWinner,
      penalty_winner: penaltyWinner,
      group_name: match.group || null,
    }
  })

  // scored 比赛（predictions 已有 points_earned）整条跳过，DB 数据完全不动
  // unscored 比赛：移除内部标记后完整 upsert
  const toUpsert = transformed
    .filter((m: any) => !m._isScored)
    .map(({ _isScored, ...rest }: any) => rest)

  const { error } = await supabaseAdmin
    .from('matches')
    .upsert(toUpsert, { onConflict: 'api_match_id' })

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
