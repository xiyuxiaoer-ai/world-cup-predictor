import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SECRET = 'wc2026-init-xq'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const footballToken = process.env.FOOTBALL_DATA_API_TOKEN

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // Check if table exists first
  const { error: checkError } = await admin.from('team_squads').select('id').limit(1)
  if (checkError && checkError.code === '42P01') {
    return NextResponse.json({
      ok: false,
      error: 'TABLE_NOT_EXISTS',
      message: 'team_squads table does not exist. Please run the SQL migration in Supabase dashboard first.',
      sql_url: 'https://supabase.com/dashboard/project/hiatpshykhbbhdzbhgac/sql/new',
    })
  }

  // Fetch squad data from football-data.org
  const fdHeaders: Record<string, string> = { 'X-Auth-Token': footballToken || '' }
  let teams: any[] = []
  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/teams', {
      headers: fdHeaders,
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      teams = data.teams || []
    } else {
      return NextResponse.json({ ok: false, error: `football-data.org ${res.status}` })
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message })
  }

  if (teams.length === 0) {
    return NextResponse.json({ ok: false, error: 'No teams returned from football-data.org' })
  }

  const POSITION_MAP: Record<string, string> = {
    Goalkeeper: 'GK', Defender: 'DEF', Midfielder: 'MID', Attacker: 'FWD',
  }

  const rows: any[] = []
  for (const team of teams) {
    const tla = team.tla?.toUpperCase()
    if (!tla) continue
    if (team.coach?.name) {
      rows.push({ tla, shirt_number: null, position: 'HEAD_COACH', player_name: team.coach.name, player_name_zh: null, club: null })
    }
    for (const p of team.squad || []) {
      rows.push({
        tla,
        shirt_number: p.shirtNumber ?? null,
        position: POSITION_MAP[p.position] || 'FWD',
        player_name: p.name,
        player_name_zh: null,
        club: p.currentTeam?.name ?? null,
      })
    }
  }

  // Clear existing data and insert fresh
  await admin.from('team_squads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { error: insertError } = await admin.from('team_squads').insert(rows)

  return NextResponse.json({
    ok: !insertError,
    teams: teams.length,
    players: rows.length,
    insertError: insertError?.message,
  })
}
