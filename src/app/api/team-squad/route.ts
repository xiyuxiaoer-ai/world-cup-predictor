import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

const POS_MAP: Record<string, string> = { GK: 'GK', DF: 'DEF', MF: 'MID', FW: 'FWD' }

interface PlayerRow {
  tla: string
  shirt_number: number | null
  position: string
  player_name: string
  player_name_zh: string | null
  club: string | null
}

export function parseSquadHtml(html: string, tla: string): PlayerRow[] {
  const players: PlayerRow[] = []

  // Map position markers (squad-group-head) to their HTML offsets
  const positionMarkers: Array<{ idx: number; pos: string }> = []
  const gHeadRe = /class="squad-group-head"[\s\S]{0,500}?(GK|DF|MF|FW)\b/g
  let m: RegExpExecArray | null
  while ((m = gHeadRe.exec(html)) !== null) {
    positionMarkers.push({ idx: m.index, pos: POS_MAP[m[1]] ?? 'FWD' })
  }

  // Extract each squad-player block (lazy, no upper bound — last player extends to end)
  const playerRe = /class="squad-player"([\s\S]+?)(?=class="squad-player"|class="squad-group-head"|class="player-card"|id="key-players"|<footer|$)/g
  while ((m = playerRe.exec(html)) !== null) {
    const pHtml = m[0]
    const playerIdx = m.index

    // Nearest preceding position marker
    let position = 'FWD'
    for (const marker of positionMarkers) {
      if (marker.idx < playerIdx) position = marker.pos
      else break
    }

    // Shirt number: squad-numtag (with photo) or squad-numfb (no photo)
    const numM = pHtml.match(/squad-num(?:tag|fb)[^>]*>(\d+)/)
    const shirt_number = numM ? parseInt(numM[1]) : null

    // Chinese name: img alt (with photo) OR font-weight:700 span (no photo)
    const zhM = pHtml.match(/alt="([^"]+)"/)
      ?? pHtml.match(/font-weight:700[^>]*>([一-鿿][^<]*)</)
    const player_name_zh = zhM?.[1]?.trim() ?? null
    if (!player_name_zh) continue

    // English name from font-size:11px or 12px colored div
    const enM = pHtml.match(/color:rgba\(255,255,255,0\.4\)[^>]*margin-bottom:\d+px[^>]*>([\s\S]*?)<\/div/)
      ?? pHtml.match(/font-size:11px[^>]*>([\s\S]*?)<\/div/)
    const player_name = enM?.[1]
      ?.replace(/<!--[\s\S]*?-->/g, '')
      ?.replace(/<[^>]+>/g, '')
      ?.replace(/\s+/g, ' ')
      ?.trim() || player_name_zh

    // Club from color:#d4af37 div ("Club · Age 岁")
    const clubM = pHtml.match(/color:#d4af37[^>]*>([\s\S]*?)<\/div/)
    const clubRaw = clubM?.[1]
      ?.replace(/<!--[\s\S]*?-->/g, '')
      ?.replace(/<[^>]+>/g, '')
      ?.replace(/\s+/g, ' ')
      ?.trim() ?? ''
    const club = clubRaw.split('·')[0]?.trim() || null

    players.push({ tla, shirt_number, position, player_name, player_name_zh, club })
  }

  return players
}

const TLA_ALIASES: Record<string, string> = {
  URY: 'URU',  // football-data.org uses URY; our data uses URU
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawTla = searchParams.get('tla')?.toUpperCase() ?? ''
  const tla = TLA_ALIASES[rawTla] ?? rawTla
  if (!tla) return NextResponse.json({ error: 'tla required' }, { status: 400 })

  const slug = TLA_TO_SLUG[tla]
  if (!slug) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Try Supabase DB first
  const { data: dbData } = await admin
    .from('team_squads')
    .select('shirt_number, position, player_name, player_name_zh, club')
    .eq('tla', tla)
    .order('shirt_number', { ascending: true, nullsFirst: false })

  if (dbData && dbData.length > 0) {
    return NextResponse.json(dbData, { headers: { 'Cache-Control': 'no-store' } })
  }

  // 2. Fetch from football2026tips.com
  try {
    const res = await fetch(`https://football2026tips.com/squads/${slug}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })

    const html = await res.text()
    const players = parseSquadHtml(html, tla)
    if (players.length === 0) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })

    // 3. Cache to DB
    admin.from('team_squads').insert(players).then(() => {})

    return NextResponse.json(
      players.map(({ tla: _t, ...p }) => p),
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })
  }
}
