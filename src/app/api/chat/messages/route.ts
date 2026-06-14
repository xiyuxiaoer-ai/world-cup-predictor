import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversation_id')
  if (!conversationId) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: msgs, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!msgs || msgs.length === 0) return NextResponse.json([])

  const senderIds = [...new Set(msgs.map(m => m.sender_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', senderIds)

  const profileMap: Record<string, any> = {}
  profiles?.forEach(p => { profileMap[p.id] = p })

  return NextResponse.json(msgs.map(m => ({ ...m, profiles: profileMap[m.sender_id] ?? null })))
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversation_id, content } = await request.json()
  if (!conversation_id || !content?.trim()) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: newMsg, error } = await supabase
    .from('messages')
    .insert({ conversation_id, sender_id: user.id, content: content.trim() })
    .select('id, conversation_id, sender_id, content, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ ...newMsg, profiles: profile ?? null })
}
