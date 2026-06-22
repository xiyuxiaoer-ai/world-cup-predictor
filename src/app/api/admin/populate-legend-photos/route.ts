import { createClient } from '@supabase/supabase-js'
import { TEAM_LEGENDS } from '@/lib/team-legends'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const UA = 'WorldCupPredictor/1.0'

async function batchWikiImages(names: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  for (let i = 0; i < names.length; i += 50) {
    const chunk = names.slice(i, i + 50)
    try {
      const url =
        `https://en.wikipedia.org/w/api.php?action=query` +
        `&titles=${encodeURIComponent(chunk.join('|'))}` +
        `&prop=pageimages&format=json&pithumbsize=400&redirects=1`
      const res = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' })
      if (!res.ok) continue
      const data = await res.json()

      const pageImages: Record<string, string> = {}
      for (const page of Object.values(data?.query?.pages ?? {}) as any[]) {
        if (page.thumbnail?.source) pageImages[page.title as string] = page.thumbnail.source
      }
      const normMap: Record<string, string> = {}
      for (const n of (data?.query?.normalized ?? []) as any[]) normMap[n.from] = n.to
      const rdMap: Record<string, string> = {}
      for (const r of (data?.query?.redirects ?? []) as any[]) rdMap[r.from] = r.to

      for (const name of chunk) {
        const norm = normMap[name] ?? name
        const rd1 = rdMap[norm] ?? norm
        const rd2 = rdMap[rd1] ?? rd1
        const img = pageImages[rd2] ?? pageImages[rd1] ?? pageImages[norm] ?? pageImages[name]
        if (img) result[name] = img
      }
    } catch { /* skip chunk on network error */ }
  }
  return result
}

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Collect all unique legend player English names
  const allPlayers: { nameEn: string }[] = []
  for (const legend of Object.values(TEAM_LEGENDS)) {
    for (const p of legend.players) {
      if (!allPlayers.find(x => x.nameEn === p.nameEn)) {
        allPlayers.push({ nameEn: p.nameEn })
      }
    }
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(data) + '\n')) } catch { /* closed */ }
      }

      send({ type: 'start', total: allPlayers.length })

      // Batch Wikipedia fetch (50 per request)
      const nameEnList = allPlayers.map(p => p.nameEn)
      send({ type: 'fetching', msg: `Wikipedia批量查询 ${nameEnList.length} 位球星...` })
      const wikiImages = await batchWikiImages(nameEnList)
      send({ type: 'wiki_done', found: Object.keys(wikiImages).length, total: nameEnList.length })

      // Upsert to Supabase
      const rows = Object.entries(wikiImages).map(([name_en, photo_url]) => ({ name_en, photo_url }))
      if (rows.length > 0) {
        const { error } = await admin.from('legend_photos').upsert(rows, { onConflict: 'name_en' })
        if (error) send({ type: 'dberror', error: error.message })
        else send({ type: 'ok', upserted: rows.length })
      }

      // Report missing
      const missing = nameEnList.filter(n => !wikiImages[n])
      send({ type: 'done', upserted: rows.length, missing: missing.length, missing_names: missing.slice(0, 20) })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
