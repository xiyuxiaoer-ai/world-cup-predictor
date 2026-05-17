import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: game } = await supabase
    .from('games')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!game) return NextResponse.json({ error: 'Game 不存在' }, { status: 404 })
  if (game.created_by !== user.id) return NextResponse.json({ error: '只有管理员可以删除成员' }, { status: 403 })
  if (userId === user.id) return NextResponse.json({ error: '不能删除自己' }, { status: 400 })

  const { error } = await supabase
    .from('game_members')
    .delete()
    .eq('game_id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
