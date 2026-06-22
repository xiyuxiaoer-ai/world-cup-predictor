import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tla = searchParams.get('tla')?.toUpperCase()
  if (!tla) return NextResponse.json({ error: 'tla required' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await admin
    .from('team_squads')
    .select('shirt_number, position, player_name, player_name_zh, club')
    .eq('tla', tla)
    .order('shirt_number', { ascending: true })

  return NextResponse.json(data || [])
}
