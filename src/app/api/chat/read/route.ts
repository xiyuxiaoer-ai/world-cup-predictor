import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversation_id } = await request.json()
  if (!conversation_id) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 })

  await supabase
    .from('message_reads')
    .upsert(
      { user_id: user.id, conversation_id, last_read_at: new Date().toISOString() },
      { onConflict: 'user_id,conversation_id' }
    )

  return NextResponse.json({ ok: true })
}
