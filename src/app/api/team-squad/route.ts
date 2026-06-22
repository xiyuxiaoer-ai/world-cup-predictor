import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

function findTemplateEnd(text: string, start: number): number {
  let depth = 0, i = start
  while (i < text.length) {
    if (text[i] === '{' && text[i + 1] === '{') { depth++; i += 2 }
    else if (text[i] === '}' && text[i + 1] === '}') { depth--; i += 2; if (depth === 0) return i }
    else i++
  }
  return text.length
}

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
    if (c === '{' && body[i + 1] === '{') { tmplDepth++; i += 2; continue }
    if (c === '}' && body[i + 1] === '}') { tmplDepth--; i += 2; continue }
    if (c === '|' && linkDepth === 0 && tmplDepth === 0) break
    val += c; i++
  }
  return val.trim()
}

// [[Paris Saint-Germain|PSG]] → display: "Paris Saint-Germain"  wikiTitle: "Paris Saint-Germain"
// [[Lionel Messi]]           → display: "Lionel Messi"          wikiTitle: "Lionel Messi"
// plain text                 → display: "text"                  wikiTitle: null
function parseLink(str: string): { display: string; wikiTitle: string | null } {
  const m = str.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/)
  if (m) return { display: m[1], wikiTitle: m[1] }
  // strip any remaining [[ ]] and return as plain
  const display = str.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1').replace(/\[|\]/g, '').trim()
  return { display, wikiTitle: null }
}

interface PlayerRow {
  tla: string
  shirt_number: number | null
  position: string
  player_name: string
  player_name_zh: string | null
  club: string | null
  _wikiTitle?: string | null
}

function parseSquad(wikitext: string, tla: string): PlayerRow[] {
  const players: PlayerRow[] = []

  const playerPrefixes = ['{{nat fs g player|', '{{Nat fs g player|', '{{nat fs player|']
  for (const prefix of playerPrefixes) {
    let pos = 0
    while (true) {
      const start = wikitext.indexOf(prefix, pos)
      if (start === -1) break
      const end = findTemplateEnd(wikitext, start)
      const body = wikitext.slice(start + prefix.length, end - 2)

      const nameRaw = getParam(body, 'name')
      const clubRaw = getParam(body, 'club')
      const { display: name, wikiTitle } = parseLink(nameRaw)
      const { display: club } = parseLink(clubRaw)
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
          _wikiTitle: wikiTitle,
        })
      }
      pos = end
    }
  }

  const coachPrefixes = ['{{nat fs g coach|', '{{Nat fs g coach|', '{{nat fs coach|']
  for (const prefix of coachPrefixes) {
    let pos = 0
    while (true) {
      const start = wikitext.indexOf(prefix, pos)
      if (start === -1) break
      const end = findTemplateEnd(wikitext, start)
      const body = wikitext.slice(start + prefix.length, end - 2)
      const nameRaw = getParam(body, 'name')
      const { display: name, wikiTitle } = parseLink(nameRaw)
      if (name) {
        players.unshift({
          tla, shirt_number: null, position: 'HEAD_COACH',
          player_name: name, player_name_zh: null, club: null,
          _wikiTitle: wikiTitle,
        })
      }
      pos = end
    }
  }

  return players
}

// Batch-query WikiData for zh-hans (Simplified Chinese) labels
// Uses enwiki titles as lookup keys → returns map: English title → Simplified Chinese name
async function fetchZhNames(titles: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (titles.length === 0) return map

  // WikiData API supports up to 50 titles per request
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50)
    const titlesParam = batch.map(t => encodeURIComponent(t)).join('|')
    // Request: look up by English Wikipedia title, get zh-hans / zh / zh-cn labels + enwiki sitelink
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&titles=${titlesParam}&props=labels%7Csitelinks&sitefilter=enwiki&languages=zh-hans%7Czh%7Czh-cn&format=json&redirects=yes`

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'WorldCupPredictor/1.0 (educational project)' },
        next: { revalidate: 86400 },
      })
      if (!res.ok) continue
      const json = await res.json()

      for (const entity of Object.values(json.entities || {}) as any[]) {
        if (entity.missing !== undefined) continue
        // Priority: zh-hans > zh > zh-cn (all simplified or close to it)
        const zhName =
          entity.labels?.['zh-hans']?.value ||
          entity.labels?.['zh-cn']?.value ||
          entity.labels?.['zh']?.value
        if (!zhName) continue

        // Map the canonical English Wikipedia title to the Chinese name
        const enTitle = entity.sitelinks?.enwiki?.title
        if (enTitle) map.set(enTitle, zhName)
      }
    } catch { /* silently skip */ }
  }

  return map
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tla = searchParams.get('tla')?.toUpperCase()
  if (!tla) return NextResponse.json({ error: 'tla required' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Try DB first
  const { data: dbData } = await admin
    .from('team_squads')
    .select('shirt_number, position, player_name, player_name_zh, club')
    .eq('tla', tla)
    .order('shirt_number', { ascending: true, nullsFirst: false })

  if (dbData && dbData.length > 0) {
    return NextResponse.json(dbData, { headers: { 'Cache-Control': 'no-store' } })
  }

  // 2. Fetch from Wikipedia
  const sectionIdx = TLA_TO_SECTION[tla]
  if (!sectionIdx) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })

  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=2026_FIFA_World_Cup_squads&format=json&prop=wikitext&section=${sectionIdx}&disablelimitreport=1`
    const res = await fetch(wikiUrl, {
      headers: { 'User-Agent': 'WorldCupPredictor/1.0 (educational project)' },
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })

    const json = await res.json()
    const wikitext: string = json.parse?.wikitext?.['*'] || ''
    if (!wikitext) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })

    const players = parseSquad(wikitext, tla)
    if (players.length === 0) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })

    // 3. Batch-fetch Chinese names from Wikipedia zh interwiki
    const wikiTitles = players
      .map(p => p._wikiTitle)
      .filter((t): t is string => !!t)

    const zhMap = await fetchZhNames(wikiTitles)

    // Apply Chinese names
    for (const p of players) {
      if (p._wikiTitle && zhMap.has(p._wikiTitle)) {
        p.player_name_zh = zhMap.get(p._wikiTitle)!
      }
    }

    // 4. Cache to DB
    const rows = players.map(({ _wikiTitle: _, ...p }) => p)
    admin.from('team_squads').insert(rows).then(() => {})

    return NextResponse.json(
      rows.map(({ tla: _tla, ...p }) => p),
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })
  }
}
