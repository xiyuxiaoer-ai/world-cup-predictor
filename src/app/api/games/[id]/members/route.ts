import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('game_members')
    .select('role, joined_at, profiles(id, username, display_name, avatar_url, bio)')
    .eq('game_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await request.json()
  if (!username?.trim()) return NextResponse.json({ error: '用户名不能为空' }, { status: 400 })

  const { data: membership } = await supabase
    .from('game_members')
    .select('role')
    .eq('game_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: '你不在此 Game 中' }, { status: 403 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .eq('username', username.trim())
    .single()

  if (!profile) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  const { data: existing } = await supabase
    .from('game_members')
    .select('id')
    .eq('game_id', id)
    .eq('user_id', profile.id)
    .single()

  if (existing) return NextResponse.json({ error: '该用户已在此 Game 中' }, { status: 400 })

  const { error } = await supabase
    .from('game_members')
    .insert({ game_id: id, user_id: profile.id, role: 'member' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, profile })
}
