import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const POSITION_MAP: Record<string, string> = {
  Goalkeeper: 'GK',
  Defender: 'DEF',
  Midfielder: 'MID',
  Attacker: 'FWD',
}

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return !!profile?.is_admin
}

async function ensureTableExists(supabaseUrl: string, serviceRoleKey: string): Promise<boolean> {
  // Try creating the table via Supabase pg-meta REST endpoint
  const sql = `
    CREATE TABLE IF NOT EXISTS team_squads (
      id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
      tla             text    NOT NULL,
      shirt_number    integer,
      position        text    CHECK (position IN ('GK', 'DEF', 'MID', 'FWD', 'HEAD_COACH', 'ASST_COACH', 'COACH')),
      player_name     text    NOT NULL,
      player_name_zh  text,
      club            text,
      created_at      timestamptz DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS team_squads_tla_idx ON team_squads (tla);
    ALTER TABLE team_squads ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_squads' AND policyname = 'public read') THEN
        CREATE POLICY "public read" ON team_squads FOR SELECT USING (true);
      END IF;
    END $$;
  `

  // Try the pg-meta query endpoint (available in Supabase Cloud)
  const res = await fetch(`${supabaseUrl}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  if (res.ok) return true

  // Fallback: try the REST RPC endpoint (some Supabase setups)
  const res2 = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    },
    body: JSON.stringify({ query: sql }),
  })

  return res2.ok
}

export async function POST() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const footballToken = process.env.FOOTBALL_DATA_API_TOKEN!

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // Step 1: ensure table exists
  const tableCreated = await ensureTableExists(supabaseUrl, serviceRoleKey)

  // Step 2: fetch teams + squads from football-data.org
  const teamsRes = await fetch('https://api.football-data.org/v4/competitions/WC/teams', {
    headers: { 'X-Auth-Token': footballToken },
    cache: 'no-store',
  })

  if (!teamsRes.ok) {
    return NextResponse.json({
      error: `football-data.org 请求失败: ${teamsRes.status}`,
      tableCreated,
    }, { status: 502 })
  }

  const { teams } = await teamsRes.json()
  if (!Array.isArray(teams)) {
    return NextResponse.json({ error: '返回数据格式错误', tableCreated }, { status: 502 })
  }

  // Step 3: build rows
  const rows: any[] = []
  for (const team of teams) {
    const tla = team.tla?.toUpperCase()
    if (!tla) continue

    // Coach
    if (team.coach?.name) {
      rows.push({
        tla,
        shirt_number: null,
        position: 'HEAD_COACH',
        player_name: team.coach.name,
        player_name_zh: null,
        club: null,
      })
    }

    // Players
    if (Array.isArray(team.squad)) {
      for (const player of team.squad) {
        rows.push({
          tla,
          shirt_number: player.shirtNumber ?? null,
          position: POSITION_MAP[player.position] || 'FWD',
          player_name: player.name,
          player_name_zh: null,
          club: player.currentTeam?.name ?? null,
        })
      }
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: '没有获取到球员数据，可能 API 未返回名单', tableCreated }, { status: 400 })
  }

  // Step 4: clear old data and insert
  await admin.from('team_squads').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { error } = await admin.from('team_squads').insert(rows)

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({
        error: '表不存在，请先在 Supabase SQL Editor 中运行 sql/create_team_squads.sql',
        tableCreated: false,
        rows: rows.length,
      }, { status: 500 })
    }
    return NextResponse.json({ error: error.message, tableCreated }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    teams: teams.length,
    players: rows.length,
    tableCreated,
  })
}
