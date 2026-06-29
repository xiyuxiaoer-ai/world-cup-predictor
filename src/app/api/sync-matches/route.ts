import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculatePoints, getMissPenalty } from '@/lib/scores'
import { R32_SLOTS, LATER_SLOT_BY_ID, LATER_ROUNDS } from '@/lib/bracketSlots'
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
    .select('api_match_id, home_team, away_team, home_tla, away_tla, status, home_score_90, away_score_90, result_90, et_winner, penalty_winner')
  if (existingError) return NextResponse.json({ error: '读取现有比赛数据失败，同步中止以保护数据' }, { status: 500 })
  const prevMap = new Map(
    (allExisting || []).map((m: any) => [String(m.api_match_id), m])
  )
  // 额外：通过已有积分的预测反查 finished 状态（防止 status 被 API 重置后保护失效）
  const { data: scoredPredictions } = await supabaseAdmin
    .from('predictions')
    .select('match_id, matches(api_match_id, home_score_90, away_score_90, result_90, et_winner, penalty_winner)')
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

  // ── 胜者推算补充：覆盖 R32→R16→QF→SF→决赛 全程 ─────────────────────
  // matchNum → api_match_id（LATER_SLOT_BY_ID 反转）
  const matchNumToApiId: Record<number, number> = {}
  for (const [idStr, mn] of Object.entries(LATER_SLOT_BY_ID)) matchNumToApiId[mn] = Number(idStr)

  // 从 prevMap 里算某场比赛的胜者
  const getWinner = (prev: any): { name: string; tla: string | null } | null => {
    if (!prev || prev.status !== 'finished') return null
    if (prev.penalty_winner) return { name: prev.penalty_winner, tla: prev.penalty_winner === prev.home_team ? prev.home_tla : prev.away_tla }
    if (prev.et_winner)      return { name: prev.et_winner,      tla: prev.et_winner      === prev.home_team ? prev.home_tla : prev.away_tla }
    if (prev.result_90 === 'home_win') return { name: prev.home_team, tla: prev.home_tla }
    if (prev.result_90 === 'away_win') return { name: prev.away_team, tla: prev.away_tla }
    return null
  }

  // winnerSupplementMap：目标赛程 api_match_id → { home?, away? }
  const winnerSupplementMap: Record<number, { home?: string; homeTla?: string | null; away?: string; awayTla?: string | null }> = {}

  const fillSupplementMap = (
    groups: Record<number, { apiMatchId: number; posInRound: number }[]>
  ) => {
    for (const [mnStr, group] of Object.entries(groups)) {
      const targetApiId = matchNumToApiId[Number(mnStr)]
      if (!targetApiId) continue
      for (let i = 0; i < group.length; i++) {
        const winner = getWinner(prevMap.get(String(group[i].apiMatchId)))
        if (!winner || winner.name === 'TBD') continue
        if (!winnerSupplementMap[targetApiId]) winnerSupplementMap[targetApiId] = {}
        if (i === 0) { winnerSupplementMap[targetApiId].home = winner.name; winnerSupplementMap[targetApiId].homeTla = winner.tla }
        else         { winnerSupplementMap[targetApiId].away = winner.name; winnerSupplementMap[targetApiId].awayTla = winner.tla }
      }
    }
  }

  // 1. R32 → R16（来源：R32_SLOTS，按 feedsInto 分组）
  const r32Groups: Record<number, { apiMatchId: number; posInRound: number }[]> = {}
  for (const [idStr, slot] of Object.entries(R32_SLOTS)) {
    if (!r32Groups[slot.feedsInto]) r32Groups[slot.feedsInto] = []
    r32Groups[slot.feedsInto].push({ apiMatchId: Number(idStr), posInRound: slot.posInRound })
  }
  for (const arr of Object.values(r32Groups)) arr.sort((a, b) => a.posInRound - b.posInRound)
  fillSupplementMap(r32Groups)

  // 2. R16 → QF → SF → 决赛（来源：LATER_ROUNDS，按 feedsInto 分组）
  const laterGroups: Record<number, { apiMatchId: number; posInRound: number }[]> = {}
  for (const [mnStr, slot] of Object.entries(LATER_ROUNDS)) {
    if (!slot.feedsInto) continue
    const apiMatchId = matchNumToApiId[Number(mnStr)]
    if (!apiMatchId) continue
    if (!laterGroups[slot.feedsInto]) laterGroups[slot.feedsInto] = []
    laterGroups[slot.feedsInto].push({ apiMatchId, posInRound: slot.posInRound })
  }
  for (const arr of Object.values(laterGroups)) arr.sort((a, b) => a.posInRound - b.posInRound)
  fillSupplementMap(laterGroups)

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

    // 胜者推算补充（R16、QF、SF、决赛）：仅在 TBD 时填入
    if (match.stage === 'LAST_16' || match.stage === 'QUARTER_FINALS' || match.stage === 'SEMI_FINALS' || match.stage === 'FINAL') {
      const supp = winnerSupplementMap[match.id as number]
      if (supp) {
        if (homeName === 'TBD' && supp.home) { homeName = supp.home; homeTla = supp.homeTla ?? homeTla }
        if (awayName === 'TBD' && supp.away) { awayName = supp.away; awayTla = supp.awayTla ?? awayTla }
      }
    }

    // ── 比分 & 结果：已有值不被 null/空覆盖 ──────────────────────────
    let result90 = prev?.result_90 ?? null
    let etWinner = prev?.et_winner ?? null
    let penaltyWinner = prev?.penalty_winner ?? null

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

    const apiHome = match.status === 'FINISHED' ? match.score.fullTime.home : null
    const apiAway = match.status === 'FINISHED' ? match.score.fullTime.away : null
    const home90 = prev?.home_score_90 ?? apiHome
    const away90 = prev?.away_score_90 ?? apiAway

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
