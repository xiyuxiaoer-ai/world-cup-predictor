import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: pred } = await admin
    .from('predictions')
    .select('id, match_id')
    .eq('id', id)
    .single()

  if (!pred) return NextResponse.json({ error: '预测不存在' }, { status: 404 })

  const { data: match } = await admin
    .from('matches')
    .select('status')
    .eq('id', pred.match_id)
    .single()

  if (match?.status === 'finished') {
    return NextResponse.json({ error: '比赛已结束，无法删除' }, { status: 400 })
  }

  const { error } = await admin.from('predictions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
