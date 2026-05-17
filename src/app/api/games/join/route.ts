import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await request.json()
  if (!code?.trim()) return NextResponse.json({ error: '请输入 Game 码' }, { status: 400 })

  const clean = code.trim().toLowerCase()

  const { data: games } = await supabase
    .from('games')
    .select('id, name, status')

  const game = games?.find(g => g.id.startsWith(clean) || g.id === clean)

  if (!game) return NextResponse.json({ error: 'Game 不存在，请检查 Game 码' }, { status: 404 })

  const { data: existing } = await supabase
    .from('game_members')
    .select('id')
    .eq('game_id', game.id)
    .eq('user_id', user.id)
    .single()

  if (existing) return NextResponse.json({ error: '你已经在此 Game 中了' }, { status: 400 })

  const { error } = await supabase
    .from('game_members')
    .insert({ game_id: game.id, user_id: user.id, role: 'member' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, game })
}
