import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversation_id')
  if (!conversationId) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles!sender_id(username, display_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversation_id, content } = await request.json()
  if (!conversation_id || !content?.trim()) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id, sender_id: user.id, content: content.trim() })
    .select('*, profiles!sender_id(username, display_name, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
