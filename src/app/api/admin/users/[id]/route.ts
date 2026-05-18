import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

// 修改邮箱或密码
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await request.json()
  const admin = await getAdminClient()

  const updates: any = {}
  if (body.email) updates.email = body.email
  if (body.password) updates.password = body.password

  const { error } = await admin.auth.admin.updateUserById(id, updates)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// 删除用户（彻底删除）
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await checkAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  if (id === adminUser.id) return NextResponse.json({ error: '不能删除自己' }, { status: 400 })

  const admin = await getAdminClient()

  // 删除 predictions、game_members、profiles（CASCADE 会处理大部分）
  await admin.from('predictions').delete().eq('user_id', id)
  await admin.from('game_members').delete().eq('user_id', id)
  await admin.from('profiles').delete().eq('id', id)
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
