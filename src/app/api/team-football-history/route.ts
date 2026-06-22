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
  // Wikipedia allows up to 50 titles per request
  for (let i = 0; i < names.length; i += 50) {
    const chunk = names.slice(i, i + 50)
    const titles = chunk.join('|')
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=pageimages&format=json&pithumbsize=400&redirects=1`
      const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        next: { revalidate: 86400 },
      })
      if (!res.ok) continue
      const data = await res.json()

      // Build reverse-lookup maps for normalized titles and redirects
      const redirectMap: Record<string, string> = {}
      for (const r of (data?.query?.redirects ?? [])) {
        redirectMap[r.to] = r.from
      }
      const normalMap: Record<string, string> = {}
      for (const n of (data?.query?.normalized ?? [])) {
        normalMap[n.to] = n.from
      }

      const pages: any[] = Object.values(data?.query?.pages ?? {})
      for (const page of pages) {
        if (!page.thumbnail?.source) continue
        const imgUrl = proxyImg(page.thumbnail.source)!
        const pageTitle: string = page.title
        result[pageTitle] = imgUrl
        const afterRedirect = redirectMap[pageTitle]
        if (afterRedirect) result[afterRedirect] = imgUrl
        const afterNorm = normalMap[afterRedirect ?? pageTitle]
        if (afterNorm) result[afterNorm] = imgUrl
      }
    } catch {
      // Network failure — continue without images for this chunk
    }
  }
  return result
}

async function fetchBaiduImage(name: string): Promise<string | null> {
  try {
    const url = `https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?scope=103&format=json&appid=379020&bk_key=${encodeURIComponent(name)}&bk_length=100`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    // Baidu Baike API may return different fields depending on scope
    const imgUrl: string | undefined = data?.image ?? data?.pic_href ?? data?.images?.[0]?.url
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

  // Batch-fetch player images from English Wikipedia (upload.wikimedia.org CDN is accessible in China)
  const nameEnList = legend.players.map(p => p.nameEn)
  const wikiImages = await fetchWikipediaImages(nameEnList)

  // For players still missing images, try Baidu Baike in parallel
  const players = await Promise.all(
    legend.players.map(async (p) => {
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
    {
      intro: legend.intro,
      worldCupRecord: legend.worldCupRecord,
      goal2026: legend.goal2026,
      players,
    },
    { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } }
  )
}
