import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SECRET = 'wc2026-init-xq'

const CREATE_SQL_STEPS = [
  `CREATE TABLE IF NOT EXISTS team_squads (
    id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
    tla             text    NOT NULL,
    shirt_number    integer,
    position        text    CHECK (position IN ('GK','DEF','MID','FWD','HEAD_COACH','ASST_COACH','COACH')),
    player_name     text    NOT NULL,
    player_name_zh  text,
    club            text,
    created_at      timestamptz DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS team_squads_tla_idx ON team_squads (tla)`,
  `ALTER TABLE team_squads ENABLE ROW LEVEL SECURITY`,
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const footballToken = process.env.FOOTBALL_DATA_API_TOKEN

  // Collect env diagnostics
  const envKeys = Object.keys(process.env)
    .filter(k => /supabase|postgres|database|db_|pghost|pgport|pguser|pgpass/i.test(k))
    .map(k => {
      const v = process.env[k] || ''
      return `${k}=${v.slice(0, 30)}${v.length > 30 ? '...' : ''}`
    })

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // Step 1: try multiple SQL execution paths
  const createResults: string[] = [`envKeys: ${envKeys.join(' | ')}`]

  // Try pg-meta paths
  const pgMetaUrls = [
    `${supabaseUrl}/pg/query`,
    `${supabaseUrl}/meta/query`,
    `${supabaseUrl}/v1/pg-meta/query`,
    `https://api.supabase.com/v1/projects/hiatpshykhbbhdzbhgac/database/query`,
  ]
  let tableCreated = false
  for (const url of pgMetaUrls) {
    if (tableCreated) break
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceRoleKey}` },
        body: JSON.stringify({ query: CREATE_SQL_STEPS.join(';\n') }),
      })
      const body = await res.text()
      createResults.push(`${url.split('/').slice(-2).join('/')}: ${res.status} ${body.slice(0, 80)}`)
      if (res.ok) { tableCreated = true; break }
    } catch (e: any) {
      createResults.push(`${url.split('/').slice(-1)[0]}: err ${e.message?.slice(0,40)}`)
    }
  }

  // Step 2: fetch squad data
  const fdHeaders: Record<string, string> = {}
  if (footballToken) fdHeaders['X-Auth-Token'] = footballToken

  let teams: any[] = []
  let fetchError = ''
  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/teams', {
      headers: fdHeaders,
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      teams = data.teams || []
    } else {
      fetchError = `football-data.org ${res.status}: ${await res.text().then(t => t.slice(0, 100))}`
    }
  } catch (e: any) {
    fetchError = e.message
  }

  if (teams.length === 0) {
    return NextResponse.json({ createResults, fetchError, teams: 0 })
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

  // Step 3: clear + insert
  await admin.from('team_squads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { error: insertError } = await admin.from('team_squads').insert(rows)

  return NextResponse.json({
    ok: !insertError,
    tableCreated,
    createResults,
    teams: teams.length,
    players: rows.length,
    insertError: insertError?.message,
    footballToken: footballToken ? footballToken.slice(0, 6) + '...' : 'not set',
  })
}
