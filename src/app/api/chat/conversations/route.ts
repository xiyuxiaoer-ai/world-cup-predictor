import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('game_id')
  if (!gameId) return NextResponse.json({ error: 'game_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Ensure group conversation exists for this game
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('game_id', gameId)
    .eq('type', 'group')
    .single()

  if (!existing) {
    await supabase.from('conversations').insert({ game_id: gameId, type: 'group' })
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('game_id', gameId)
    .or(`type.eq.group,user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const convs = data || []
  if (convs.length === 0) return NextResponse.json([])

  // Compute has_unread per conversation
  const convIds = convs.map((c: any) => c.id)
  const { data: reads } = await supabase
    .from('message_reads')
    .select('conversation_id, last_read_at')
    .eq('user_id', user.id)
    .in('conversation_id', convIds)

  const readMap: Record<string, string> = {}
  reads?.forEach((r: any) => { readMap[r.conversation_id] = r.last_read_at })

  const unread: Record<string, boolean> = {}
  for (const conv of convs) {
    const lastRead = readMap[conv.id]
    let q = supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .neq('sender_id', user.id)
    if (lastRead) q = q.gt('created_at', lastRead)
    const { count } = await q
    unread[conv.id] = (count ?? 0) > 0
  }

  return NextResponse.json(convs.map((c: any) => ({ ...c, has_unread: unread[c.id] ?? false })))
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { game_id, other_user_id } = await request.json()
  if (!game_id || !other_user_id) {
    return NextResponse.json({ error: 'game_id and other_user_id required' }, { status: 400 })
  }

  // Sort IDs so user1 < user2 (deduplication)
  const [u1, u2] = [user.id, other_user_id].sort()

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('game_id', game_id)
    .eq('type', 'direct')
    .eq('user1_id', u1)
    .eq('user2_id', u2)
    .single()

  if (existing) return NextResponse.json(existing)

  const { data, error } = await supabase
    .from('conversations')
    .insert({ game_id, type: 'direct', user1_id: u1, user2_id: u2 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
