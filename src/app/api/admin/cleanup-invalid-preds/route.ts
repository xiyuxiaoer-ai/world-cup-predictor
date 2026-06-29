import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const KNOCKOUT_STAGES = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final']

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

// GET /api/admin/cleanup-invalid-preds
// 删除所有「淘汰赛平局但未填加时赛胜者」的无效预测（比赛未结束）
export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 找出所有淘汰赛、平局、且 pred_et_winner 为 null 的预测
  const { data: preds, error: fetchErr } = await admin
    .from('predictions')
    .select('id, pred_home_score, pred_away_score, pred_et_winner, match_id, match:matches(stage, status, home_team, away_team), profile:profiles(username)')
    .is('pred_et_winner', null)
    .filter('pred_home_score', 'not.is', null)

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const invalid = (preds || []).filter((p: any) => {
    const m = Array.isArray(p.match) ? p.match[0] : p.match
    return (
      m &&
      KNOCKOUT_STAGES.includes(m.stage) &&
      m.status !== 'finished' &&
      p.pred_home_score === p.pred_away_score
    )
  })

  if (!invalid.length) return NextResponse.json({ deleted: 0, message: '没有需要清理的无效预测' })

  const ids = invalid.map((p: any) => p.id)
  const preview = invalid.map((p: any) => {
    const m = Array.isArray(p.match) ? p.match[0] : p.match
    const u = Array.isArray(p.profile) ? p.profile[0] : p.profile
    return `${u?.username} — ${m?.home_team} vs ${m?.away_team} ${p.pred_home_score}-${p.pred_away_score}`
  })

  const { error: delErr } = await admin.from('predictions').delete().in('id', ids)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ deleted: ids.length, records: preview })
}
