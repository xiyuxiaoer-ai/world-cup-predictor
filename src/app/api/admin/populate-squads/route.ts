import { createClient } from '@supabase/supabase-js'
import { parseSquadHtml } from '../../team-squad/route'

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

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  const tlaFilter = sp.get('tla')?.toUpperCase()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const teams = tlaFilter && TLA_TO_SLUG[tlaFilter]
    ? [[tlaFilter, TLA_TO_SLUG[tlaFilter]] as [string, string]]
    : Object.entries(TLA_TO_SLUG)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(data) + '\n')) } catch { /* closed */ }
      }

      send({ type: 'start', total: teams.length, time: new Date().toISOString() })

      let ok = 0, failed = 0

      for (const [tla, slug] of teams) {
        try {
          const res = await fetch(`https://football2026tips.com/squads/${slug}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            cache: 'no-store',
            signal: AbortSignal.timeout(12000),
          })

          if (!res.ok) {
            send({ type: 'error', tla, slug, error: `HTTP ${res.status}` })
            failed++
            continue
          }

          const html = await res.text()
          const players = parseSquadHtml(html, tla)

          if (players.length < 3) {
            send({ type: 'warn', tla, slug, count: players.length, msg: '解析球员数太少' })
            failed++
            continue
          }

          // Clear old data and insert fresh
          await admin.from('team_squads').delete().eq('tla', tla)
          const { error: dbErr } = await admin.from('team_squads').insert(players)

          if (dbErr) {
            send({ type: 'dberror', tla, error: dbErr.message })
            failed++
          } else {
            send({ type: 'ok', tla, slug, count: players.length })
            ok++
          }
        } catch (e) {
          send({ type: 'error', tla, slug, error: String(e).slice(0, 200) })
          failed++
        }

        // Polite delay between requests
        await new Promise(r => setTimeout(r, 400))
      }

      send({ type: 'done', ok, failed, total: teams.length })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
