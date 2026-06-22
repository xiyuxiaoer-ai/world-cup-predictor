import { createClient } from '@supabase/supabase-js'
import { TEAM_LEGENDS } from '@/lib/team-legends'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const UA = 'WorldCupPredictor/1.0'

// nameEn in team-legends.ts → exact Wikipedia article title
// Needed when Wikipedia has a disambiguation page or the name differs slightly
const WIKI_TITLE_OVERRIDES: Record<string, string> = {
  'Raúl':               'Raúl (footballer)',
  'Luis Díaz':          'Luis Díaz (footballer, born 1997)',
  'Chris Wood':         'Chris Wood (New Zealand footballer)',
  'Mahmoud Hassan':     'Trezeguet (Egyptian footballer)',
  'Marcelo Etcheverry': 'Marco Etcheverry',
}

// Direct Wikimedia Commons URLs for players where pageimages API fails
// (articles use non-free lead images that don't appear even with pilicense=any)
const HARDCODED_PHOTOS: Record<string, string> = {
  'Zico':       'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Zico_2012_3.jpg/500px-Zico_2012_3.jpg',
  'Xavi':       'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Xavi%2C_Persepolis_vs._Al_Sadd%2C_20190520_02_%28cropped%29.jpg/400px-Xavi%2C_Persepolis_vs._Al_Sadd%2C_20190520_02_%28cropped%29.jpg',
  'Sadio Mané': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Esteghlal_F.C._v_Al_Nassr_FC%2C_3_March_2025%2C_Sadio_Man%C3%A9_%28cropped%29.jpg/400px-Esteghlal_F.C._v_Al_Nassr_FC%2C_3_March_2025%2C_Sadio_Man%C3%A9_%28cropped%29.jpg',
  'Luis Díaz':  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/FC_RB_Salzburg_gegen_FC_Bayern_M%C3%BCnchen_%282026-01-06_Testspiel%29_40_%28Luiz_D%C3%ADaz%29.jpg/400px-FC_RB_Salzburg_gegen_FC_Bayern_M%C3%BCnchen_%282026-01-06_Testspiel%29_40_%28Luiz_D%C3%ADaz%29.jpg',
}

async function batchWikiImages(
  // nameEn → wiki title to query; returns nameEn → image URL
  nameToWiki: Record<string, string>
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  // Reverse map: wiki title → original nameEn (for result attribution)
  const wikiToName: Record<string, string> = {}
  for (const [name, wiki] of Object.entries(nameToWiki)) wikiToName[wiki] = name

  const wikiTitles = Object.values(nameToWiki)

  for (let i = 0; i < wikiTitles.length; i += 50) {
    const chunk = wikiTitles.slice(i, i + 50)
    try {
      const url =
        `https://en.wikipedia.org/w/api.php?action=query` +
        `&titles=${encodeURIComponent(chunk.join('|'))}` +
        `&prop=pageimages&format=json&pithumbsize=400&redirects=1&pilicense=any`
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

      for (const wikiTitle of chunk) {
        const norm = normMap[wikiTitle] ?? wikiTitle
        const rd1 = rdMap[norm] ?? norm
        const rd2 = rdMap[rd1] ?? rd1
        const img = pageImages[rd2] ?? pageImages[rd1] ?? pageImages[norm] ?? pageImages[wikiTitle]
        if (img) {
          // Map back to original nameEn
          const originalName = wikiToName[wikiTitle] ?? wikiTitle
          result[originalName] = img
        }
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

      // Build nameEn → wiki title map (apply overrides for disambiguation)
      const nameEnList = allPlayers.map(p => p.nameEn)
      const nameToWiki: Record<string, string> = {}
      for (const name of nameEnList) {
        nameToWiki[name] = WIKI_TITLE_OVERRIDES[name] ?? name
      }
      send({ type: 'fetching', msg: `Wikipedia批量查询 ${nameEnList.length} 位球星...` })
      const wikiImages = await batchWikiImages(nameToWiki)
      // Merge hardcoded photos (overrides wiki results for specific players)
      for (const [name, url] of Object.entries(HARDCODED_PHOTOS)) {
        wikiImages[name] = url
      }
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
