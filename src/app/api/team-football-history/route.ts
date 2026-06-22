import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TEAM_LEGENDS } from '@/lib/team-legends'

export const dynamic = 'force-dynamic'

const UA = 'WorldCupPredictor/1.0'

function proxyImg(url: string | null | undefined): string | null {
  if (!url) return null
  return `/api/img?url=${encodeURIComponent(url)}`
}

async function fetchWikipediaImages(names: string[]): Promise<Record<string, string>> {
  if (names.length === 0) return {}
  const result: Record<string, string> = {}

  for (let i = 0; i < names.length; i += 50) {
    const chunk = names.slice(i, i + 50)
    try {
      const url =
        `https://en.wikipedia.org/w/api.php?action=query` +
        `&titles=${encodeURIComponent(chunk.join('|'))}` +
        `&prop=pageimages&format=json&pithumbsize=400&redirects=1`
      const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        cache: 'no-store',
      })
      if (!res.ok) continue
      const data = await res.json()

      const pageImages: Record<string, string> = {}
      for (const page of Object.values(data?.query?.pages ?? {}) as any[]) {
        if (page.thumbnail?.source) {
          pageImages[page.title as string] = proxyImg(page.thumbnail.source)!
        }
      }

      const normMap: Record<string, string> = {}
      for (const n of (data?.query?.normalized ?? []) as any[]) {
        normMap[n.from as string] = n.to as string
      }

      const rdMap: Record<string, string> = {}
      for (const r of (data?.query?.redirects ?? []) as any[]) {
        rdMap[r.from as string] = r.to as string
      }

      for (const name of chunk) {
        const norm = normMap[name] ?? name
        const rd1 = rdMap[norm] ?? norm
        const rd2 = rdMap[rd1] ?? rd1
        const img =
          pageImages[rd2] ?? pageImages[rd1] ?? pageImages[norm] ?? pageImages[name]
        if (img) result[name] = img
      }
    } catch {
      // network failure — skip this chunk
    }
  }
  return result
}

// Some data sources use alternate TLA codes — map to canonical TEAM_LEGENDS key
const TLA_ALIASES: Record<string, string> = {
  URY: 'URU',  // Uruguay: football-data.org uses URY, our data uses URU
  KOR: 'KOR',
  PRK: 'PRK',
}

export async function GET(request: Request) {
  try {
  const { searchParams } = new URL(request.url)
  const rawTla = searchParams.get('tla')?.toUpperCase() ?? ''
  const tla = TLA_ALIASES[rawTla] ?? rawTla
  if (!tla) return NextResponse.json({ error: 'Missing tla' }, { status: 400 })

  const legend = TEAM_LEGENDS[tla]
  if (!legend) return NextResponse.json({ error: 'No legend data for this team' }, { status: 404 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const nameEnList = legend.players.map(p => p.nameEn)

  // 1. Try Supabase first (pre-populated, always works for Chinese users)
  let dbPhotoMap: Record<string, string> = {}
  try {
    const { data: dbPhotos } = await admin
      .from('legend_photos')
      .select('name_en, photo_url')
      .in('name_en', nameEnList)
    for (const row of dbPhotos ?? []) {
      if (row.photo_url) dbPhotoMap[row.name_en] = proxyImg(row.photo_url)!
    }
  } catch {
    // Supabase unavailable — fall through to Wikipedia
  }

  // 2. For any still missing, fall back to Wikipedia API
  const missing = nameEnList.filter(n => !dbPhotoMap[n])
  const wikiImages = await fetchWikipediaImages(missing)

  const players = legend.players.map(p => ({
    name: p.name,
    nameEn: p.nameEn,
    era: p.era,
    desc: p.desc,
    imageUrl: dbPhotoMap[p.nameEn] ?? wikiImages[p.nameEn] ?? null,
    baiduUrl: `https://baike.baidu.com/search/word?word=${encodeURIComponent(p.name)}`,
  }))

  return NextResponse.json(
    { intro: legend.intro, worldCupRecord: legend.worldCupRecord, goal2026: legend.goal2026, players },
    { headers: { 'Cache-Control': 'no-store' } }
  )
  } catch (err) {
    console.error('[team-football-history] unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
