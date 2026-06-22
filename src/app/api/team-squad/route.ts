import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Wikipedia section index for each team on "2026 FIFA World Cup squads"
const TLA_TO_SECTION: Record<string, number> = {
  CZE: 2,  MEX: 3,  RSA: 4,  KOR: 5,
  BIH: 7,  CAN: 8,  QAT: 9,  SUI: 10,
  BRA: 12, HAI: 13, MAR: 14, SCO: 15,
  AUS: 17, PAR: 18, TUR: 19, USA: 20,
  CUW: 22, ECU: 23, GER: 24, CIV: 25,
  JPN: 27, NED: 28, SWE: 29, TUN: 30,
  BEL: 32, EGY: 33, IRN: 34, NZL: 35,
  CPV: 37, KSA: 38, ESP: 39, URU: 40,
  FRA: 42, IRQ: 43, NOR: 44, SEN: 45,
  ALG: 47, ARG: 48, AUT: 49, JOR: 50,
  COL: 52, COD: 53, POR: 54, UZB: 55,
  CRO: 57, ENG: 58, GHA: 59, PAN: 60,
}

const POSITION_MAP: Record<string, string> = {
  GK: 'GK', DF: 'DEF', MF: 'MID', FW: 'FWD',
}

// Find the full extent of a {{ }} template starting at `start`
function findTemplateEnd(text: string, start: number): number {
  let depth = 0, i = start
  while (i < text.length) {
    if (text[i] === '{' && text[i + 1] === '{') { depth++; i += 2 }
    else if (text[i] === '}' && text[i + 1] === '}') { depth--; i += 2; if (depth === 0) return i }
    else i++
  }
  return text.length
}

// Extract a named param value from template body, respecting nested [[ ]] and {{ }}
function getParam(body: string, key: string): string {
  const needle = `|${key}=`
  const idx = body.indexOf(needle)
  if (idx === -1) return ''
  let val = '', i = idx + needle.length
  let linkDepth = 0, tmplDepth = 0
  while (i < body.length) {
    const c = body[i]
    if (c === '[' && body[i + 1] === '[') { linkDepth++; val += '[['; i += 2; continue }
    if (c === ']' && body[i + 1] === ']') { linkDepth--; val += ']]'; i += 2; continue }
    if (c === '{' && body[i + 1] === '{') { tmplDepth++; i += 2; continue }  // skip nested templates
    if (c === '}' && body[i + 1] === '}') { tmplDepth--; i += 2; continue }
    if (c === '|' && linkDepth === 0 && tmplDepth === 0) break
    val += c; i++
  }
  return val.trim()
}

// [[Paris Saint-Germain F.C.|PSG]] → Paris Saint-Germain F.C.   [[Lionel Messi]] → Lionel Messi
function cleanLink(str: string): string {
  return str
    .replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .trim()
}

function parseSquad(wikitext: string, tla: string): any[] {
  const players: any[] = []

  const prefixes = ['{{nat fs g player|', '{{Nat fs g player|', '{{nat fs player|']
  for (const prefix of prefixes) {
    let pos = 0
    while (true) {
      const start = wikitext.indexOf(prefix, pos)
      if (start === -1) break
      const end = findTemplateEnd(wikitext, start)
      const body = wikitext.slice(start + prefix.length, end - 2)

      const name = cleanLink(getParam(body, 'name'))
      const club = cleanLink(getParam(body, 'club'))
      const posStr = getParam(body, 'pos')
      const noStr = getParam(body, 'no')

      if (name) {
        players.push({
          tla,
          shirt_number: noStr ? parseInt(noStr) || null : null,
          position: POSITION_MAP[posStr?.toUpperCase()] || 'FWD',
          player_name: name,
          player_name_zh: null,
          club: club || null,
        })
      }
      pos = end
    }
  }

  // Coach
  const coachPrefixes = ['{{nat fs g coach|', '{{Nat fs g coach|', '{{nat fs coach|']
  for (const prefix of coachPrefixes) {
    let pos = 0
    while (true) {
      const start = wikitext.indexOf(prefix, pos)
      if (start === -1) break
      const end = findTemplateEnd(wikitext, start)
      const body = wikitext.slice(start + prefix.length, end - 2)
      const name = cleanLink(getParam(body, 'name'))
      if (name) {
        players.unshift({ tla, shirt_number: null, position: 'HEAD_COACH', player_name: name, player_name_zh: null, club: null })
      }
      pos = end
    }
  }

  return players
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tla = searchParams.get('tla')?.toUpperCase()
  if (!tla) return NextResponse.json({ error: 'tla required' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Try DB first (fast path)
  const { data: dbData } = await admin
    .from('team_squads')
    .select('shirt_number, position, player_name, player_name_zh, club')
    .eq('tla', tla)
    .order('shirt_number', { ascending: true, nullsFirst: false })

  if (dbData && dbData.length > 0) {
    return NextResponse.json(dbData)
  }

  // 2. Fallback: fetch from Wikipedia
  const sectionIdx = TLA_TO_SECTION[tla]
  if (!sectionIdx) return NextResponse.json([])

  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=2026_FIFA_World_Cup_squads&format=json&prop=wikitext&section=${sectionIdx}&disablelimitreport=1`
    const res = await fetch(wikiUrl, {
      headers: { 'User-Agent': 'WorldCupPredictor/1.0 (educational project)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return NextResponse.json([])

    const json = await res.json()
    const wikitext: string = json.parse?.wikitext?.['*'] || ''
    if (!wikitext) return NextResponse.json([])

    const players = parseSquad(wikitext, tla)
    if (players.length === 0) return NextResponse.json([])

    // 3. Cache to DB so next request is instant
    admin.from('team_squads').insert(players).then(() => {})

    return NextResponse.json(
      players.map(({ tla: _tla, ...p }) => p),
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    )
  } catch {
    return NextResponse.json([])
  }
}
