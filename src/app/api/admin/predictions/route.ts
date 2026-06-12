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

  const { data: matches } = await admin
    .from('matches')
    .select('id, home_team, away_team, home_tla, away_tla, kickoff_time, stage, group_name')
    .neq('status', 'finished')
    .order('kickoff_time', { ascending: true })

  if (!matches?.length) return NextResponse.json([])

  const matchIds = matches.map((m: any) => m.id)
  const matchMap = Object.fromEntries(matches.map((m: any) => [m.id, m]))

  const { data: predictions, error } = await admin
    .from('predictions')
    .select('id, match_id, user_id, pred_home_score, pred_away_score, game_id, created_at')
    .in('match_id', matchIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!predictions?.length) return NextResponse.json([])

  const userIds = [...new Set(predictions.map((p: any) => p.user_id))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, username, display_name')
    .in('id', userIds)
  const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]))

  const { data: games } = await admin.from('games').select('id, name')
  const gameMap = Object.fromEntries((games || []).map((g: any) => [g.id, g.name]))

  const grouped = matches
    .map((m: any) => ({
      match: m,
      predictions: predictions
        .filter((p: any) => p.match_id === m.id)
        .map((p: any) => ({
          ...p,
          user: profileMap[p.user_id] || { username: '未知', display_name: null },
          game_name: gameMap[p.game_id] || '—',
        })),
    }))
    .filter((g: any) => g.predictions.length > 0)

  return NextResponse.json(grouped)
}
