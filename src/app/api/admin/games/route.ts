import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return !!profile?.is_admin
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = await getAdminClient()

  const { data: games } = await admin
    .from('games')
    .select('id, name, status, created_at, profiles(username, display_name)')
    .order('created_at', { ascending: false })

  const { data: memberCounts } = await admin
    .from('game_members')
    .select('game_id')

  const counts: Record<string, number> = {}
  for (const m of memberCounts || []) {
    counts[m.game_id] = (counts[m.game_id] || 0) + 1
  }

  const result = (games || []).map(g => ({
    ...g,
    member_count: counts[g.id] || 0,
    creator: (g.profiles as any)?.display_name || (g.profiles as any)?.username,
  }))

  return NextResponse.json(result)
}
