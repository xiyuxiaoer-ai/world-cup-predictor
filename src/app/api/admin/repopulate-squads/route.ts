import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { parseSquadHtml } from '../../team-squad/route'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const TLA_TO_SLUG: Record<string, string> = {
  ALG: 'algeria', ARG: 'argentina', AUS: 'australia', AUT: 'austria',
  BEL: 'belgium', BIH: 'bosnia', BRA: 'brazil', CAN: 'canada',
  CIV: 'ivory-coast', COD: 'dr-congo', COL: 'colombia', CPV: 'cape-verde',
  CRO: 'croatia', CUW: 'curacao', CZE: 'czechia', ECU: 'ecuador',
  EGY: 'egypt', ENG: 'england', ESP: 'spain', FRA: 'france',
  GER: 'germany', GHA: 'ghana', HAI: 'haiti', IRN: 'iran',
  IRQ: 'iraq', JOR: 'jordan', JPN: 'japan', KOR: 'south-korea',
  KSA: 'saudi-arabia', MAR: 'morocco', MEX: 'mexico', NED: 'netherlands',
  NOR: 'norway', NZL: 'new-zealand', PAN: 'panama', PAR: 'paraguay',
  POR: 'portugal', QAT: 'qatar', RSA: 'south-africa', SCO: 'scotland',
  SEN: 'senegal', SUI: 'switzerland', SWE: 'sweden', TUN: 'tunisia',
  TUR: 'turkey', URU: 'uruguay', USA: 'usa', UZB: 'uzbekistan',
}

async function runSql(supabaseUrl: string, serviceRoleKey: string, sql: string): Promise<boolean> {
  const res = await fetch(`${supabaseUrl}/pg/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceRoleKey}` },
    body: JSON.stringify({ query: sql }),
  })
  return res.ok
}

export async function POST(request: Request) {
  const sp = new URL(request.url).searchParams

  // 支持两种鉴权方式：1) admin session  2) ?token=service_role_key
  const tokenParam = sp.get('token')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (tokenParam !== serviceRoleKey) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登录或 token 错误' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const tlaFilter = sp.get('tla')?.toUpperCase()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceRoleKey)

  // 1. Add photo_url column if not exists
  await runSql(supabaseUrl, serviceRoleKey,
    `ALTER TABLE team_squads ADD COLUMN IF NOT EXISTS photo_url text`
  )

  const teams = tlaFilter && TLA_TO_SLUG[tlaFilter]
    ? [[tlaFilter, TLA_TO_SLUG[tlaFilter]] as [string, string]]
    : Object.entries(TLA_TO_SLUG)

  const results: Array<{ tla: string; count: number; photos: number; error?: string }> = []

  for (const [tla, slug] of teams) {
    try {
      const res = await fetch(`https://football2026tips.com/squads/${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) {
        results.push({ tla, count: 0, photos: 0, error: `HTTP ${res.status}` })
        continue
      }

      const html = await res.text()
      const players = parseSquadHtml(html, tla)

      if (players.length < 3) {
        results.push({ tla, count: players.length, photos: 0, error: '解析球员数太少' })
        continue
      }

      const photos = players.filter(p => p.photo_url).length

      await admin.from('team_squads').delete().eq('tla', tla)
      const { error: dbErr } = await admin.from('team_squads').insert(players)

      if (dbErr) {
        results.push({ tla, count: players.length, photos, error: dbErr.message })
      } else {
        results.push({ tla, count: players.length, photos })
      }
    } catch (e) {
      results.push({ tla, count: 0, photos: 0, error: String(e).slice(0, 200) })
    }

    await new Promise(r => setTimeout(r, 350))
  }

  const ok = results.filter(r => !r.error).length
  const totalPhotos = results.reduce((s, r) => s + r.photos, 0)
  return NextResponse.json({ ok, failed: results.length - ok, totalPhotos, results })
}
