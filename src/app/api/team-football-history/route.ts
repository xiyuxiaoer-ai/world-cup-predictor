import { NextResponse } from 'next/server'
import { TEAM_LEGENDS } from '@/lib/team-legends'

const UA = 'WorldCupPredictor/1.0 (zhou-qiaofeng@sysj.co.jp)'

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
        // no-store so every deployment gets fresh images (avoids stale Next.js data-cache)
        cache: 'no-store',
      })
      if (!res.ok) continue
      const data = await res.json()

      // page title → image URL
      const pageImages: Record<string, string> = {}
      for (const page of Object.values(data?.query?.pages ?? {}) as any[]) {
        if (page.thumbnail?.source) {
          pageImages[page.title as string] = proxyImg(page.thumbnail.source)!
        }
      }

      // normalization: input title → normalized title
      const normMap: Record<string, string> = {}
      for (const n of (data?.query?.normalized ?? []) as any[]) {
        normMap[n.from as string] = n.to as string
      }

      // redirect: pre-redirect → post-redirect
      const rdMap: Record<string, string> = {}
      for (const r of (data?.query?.redirects ?? []) as any[]) {
        rdMap[r.from as string] = r.to as string
      }

      // For each input name: follow normalization then redirect to find the page image
      for (const name of chunk) {
        const norm = normMap[name] ?? name
        const rd1 = rdMap[norm] ?? norm
        const rd2 = rdMap[rd1] ?? rd1  // double redirect
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

async function fetchBaiduImage(name: string): Promise<string | null> {
  try {
    const url =
      `https://baike.baidu.com/api/openapi/BaikeLemmaCardApi` +
      `?scope=103&format=json&appid=379020` +
      `&bk_key=${encodeURIComponent(name)}&bk_length=100`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const imgUrl: string | undefined =
      data?.image ?? data?.pic_href ?? data?.images?.[0]?.url
    return imgUrl ? proxyImg(imgUrl) : null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tla = searchParams.get('tla')?.toUpperCase()
  if (!tla) return NextResponse.json({ error: 'Missing tla' }, { status: 400 })

  const legend = TEAM_LEGENDS[tla]
  if (!legend) return NextResponse.json({ error: 'No legend data for this team' }, { status: 404 })

  // Batch-fetch player images from English Wikipedia
  const nameEnList = legend.players.map(p => p.nameEn)
  const wikiImages = await fetchWikipediaImages(nameEnList)

  // For players still missing images, try Baidu Baike in parallel
  const players = await Promise.all(
    legend.players.map(async p => {
      let imageUrl = wikiImages[p.nameEn] ?? null
      if (!imageUrl) {
        imageUrl = await fetchBaiduImage(p.name)
      }
      return {
        name: p.name,
        nameEn: p.nameEn,
        era: p.era,
        desc: p.desc,
        imageUrl,
        baiduUrl: `https://baike.baidu.com/search/word?word=${encodeURIComponent(p.name)}`,
      }
    })
  )

  return NextResponse.json(
    { intro: legend.intro, worldCupRecord: legend.worldCupRecord, goal2026: legend.goal2026, players },
    { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } }
  )
}
