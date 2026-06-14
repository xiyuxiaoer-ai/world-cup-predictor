import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  // Get all conversations this user participates in
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, game_id')
    .or(`type.eq.group,user1_id.eq.${user.id},user2_id.eq.${user.id}`)

  if (!convs || convs.length === 0) return NextResponse.json({ count: 0 })

  // Filter to only games user is a member of
  const { data: memberships } = await supabase
    .from('game_members')
    .select('game_id')
    .eq('user_id', user.id)

  const myGameIds = new Set((memberships || []).map(m => m.game_id))
  const myConvIds = convs.filter(c => myGameIds.has(c.game_id)).map(c => c.id)
  if (myConvIds.length === 0) return NextResponse.json({ count: 0 })

  // Get last read times
  const { data: reads } = await supabase
    .from('message_reads')
    .select('conversation_id, last_read_at')
    .eq('user_id', user.id)
    .in('conversation_id', myConvIds)

  const readMap: Record<string, string> = {}
  reads?.forEach(r => { readMap[r.conversation_id] = r.last_read_at })

  // Count unread across all conversations
  let total = 0
  for (const convId of myConvIds) {
    const lastRead = readMap[convId]
    let q = supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', convId)
      .neq('sender_id', user.id)

    if (lastRead) q = q.gt('created_at', lastRead)

    const { count } = await q
    total += count ?? 0
  }

  return NextResponse.json({ count: total })
}
