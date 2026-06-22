import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Client } from 'pg'

const SECRET = 'wc2026-init-xq'

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS team_squads (
  id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  tla             text    NOT NULL,
  shirt_number    integer,
  position        text    CHECK (position IN ('GK','DEF','MID','FWD','HEAD_COACH','ASST_COACH','COACH')),
  player_name     text    NOT NULL,
  player_name_zh  text,
  club            text,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS team_squads_tla_idx ON team_squads (tla);
ALTER TABLE team_squads ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_squads' AND policyname='public read') THEN
    CREATE POLICY "public read" ON team_squads FOR SELECT USING (true);
  END IF;
END $$;
`

async function tryCreateTableViaPg(serviceRoleKey: string): Promise<{ ok: boolean; msg: string }> {
  const projectRef = 'hiatpshykhbbhdzbhgac'
  // Try Supabase Supavisor session pooler — accepts service_role key as password
  const configs = [
    {
      host: `aws-0-ap-northeast-1.pooler.supabase.com`,
      port: 5432,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password: serviceRoleKey,
      ssl: { rejectUnauthorized: false },
    },
    {
      host: `aws-0-ap-northeast-2.pooler.supabase.com`,
      port: 5432,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password: serviceRoleKey,
      ssl: { rejectUnauthorized: false },
    },
    {
      host: `aws-0-us-east-1.pooler.supabase.com`,
      port: 5432,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password: serviceRoleKey,
      ssl: { rejectUnauthorized: false },
    },
    {
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: serviceRoleKey,
      ssl: { rejectUnauthorized: false },
    },
  ]

  for (const config of configs) {
    const client = new Client(config)
    try {
      await client.connect()
      await client.query(CREATE_SQL)
      await client.end()
      return { ok: true, msg: `connected to ${config.host}:${config.port}` }
    } catch (e: any) {
      try { await client.end() } catch {}
      const shortHost = config.host.split('.')[0]
      if (e.message?.includes('ENOTFOUND') || e.message?.includes('ETIMEDOUT') || e.message?.includes('ECONNREFUSED')) {
        // Network error, try next host
        continue
      }
      return { ok: false, msg: `${shortHost}: ${e.message?.slice(0, 100)}` }
    }
  }
  return { ok: false, msg: 'all pg connection attempts timed out/unreachable' }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const footballToken = process.env.FOOTBALL_DATA_API_TOKEN

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // Step 1: try direct PostgreSQL connection
  const pgResult = await tryCreateTableViaPg(serviceRoleKey)

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
    return NextResponse.json({ pgResult, fetchError, teams: 0 })
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

  // Step 3: if pg succeeded, we're done. Otherwise try REST insert.
  if (pgResult.ok) {
    // Re-insert rows via admin client now that table exists
    await admin.from('team_squads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error: insertError } = await admin.from('team_squads').insert(rows)
    return NextResponse.json({
      ok: !insertError,
      pgResult,
      teams: teams.length,
      players: rows.length,
      insertError: insertError?.message,
    })
  }

  // Table not created - try insert anyway (will fail if table doesn't exist)
  await admin.from('team_squads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { error: insertError } = await admin.from('team_squads').insert(rows)

  return NextResponse.json({
    ok: !insertError,
    pgResult,
    teams: teams.length,
    players: rows.length,
    insertError: insertError?.message,
    footballToken: footballToken ? footballToken.slice(0, 8) + '...' : 'not set',
  })
}
