import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Join predictions → matches in one query, filter finished matches in code
  const { data: predictions, error } = await admin
    .from('predictions')
    .select(`
      id, match_id, user_id, pred_home_score, pred_away_score, game_id, created_at,
      match:matches(id, home_team, away_team, home_tla, away_tla, kickoff_time, stage, group_name, status),
      profile:profiles(username, display_name)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!predictions?.length) return NextResponse.json([])

  // Only keep predictions for non-finished matches (match may be object or array)
  const scheduled = predictions.filter((p: any) => {
    const m = Array.isArray(p.match) ? p.match[0] : p.match
    return m?.status !== 'finished'
  })
  if (!scheduled.length) return NextResponse.json([])

  const { data: games } = await admin.from('games').select('id, name')
  const gameMap = Object.fromEntries((games || []).map((g: any) => [g.id, g.name]))

  // Group by match
  const matchMap = new Map<string, { match: any; predictions: any[] }>()
  for (const p of scheduled) {
    const m = p.match as any
    if (!m) continue
    const matchId = Array.isArray(m) ? m[0]?.id : m.id
    const matchData = Array.isArray(m) ? m[0] : m
    if (!matchId) continue
    if (!matchMap.has(matchId)) {
      matchMap.set(matchId, { match: matchData, predictions: [] })
    }
    matchMap.get(matchId)!.predictions.push({
      id: p.id,
      pred_home_score: p.pred_home_score,
      pred_away_score: p.pred_away_score,
      game_name: gameMap[p.game_id] || '—',
      user: p.profile || { username: '未知', display_name: null },
    })
  }

  // Sort groups by kickoff time
  const grouped = Array.from(matchMap.values())
    .sort((a, b) => new Date(a.match.kickoff_time).getTime() - new Date(b.match.kickoff_time).getTime())

  return NextResponse.json(grouped)
}
