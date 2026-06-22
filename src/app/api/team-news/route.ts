import { NextResponse } from 'next/server'

export interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
}

function parseRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = []
  const blocks = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

  for (const block of blocks) {
    const raw = block[1]

    const titleMatch =
      raw.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
      raw.match(/<title>([\s\S]*?)<\/title>/)
    const title = titleMatch?.[1]?.trim() ?? ''

    const linkMatch = raw.match(/<link>(https?:\/\/[^\s<]+)<\/link>/) ||
      raw.match(/<link\s+href="([^"]+)"/)
    const link = linkMatch?.[1]?.trim() ?? ''

    const dateMatch = raw.match(/<pubDate>([\s\S]*?)<\/pubDate>/)
    const pubDate = dateMatch?.[1]?.trim() ?? ''

    const sourceMatch =
      raw.match(/<source[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/source>/) ||
      raw.match(/<source[^>]*>([\s\S]*?)<\/source>/)
    const source = sourceMatch?.[1]?.trim() ?? ''

    if (title && link) items.push({ title, link, pubDate, source })
    if (items.length >= 10) break
  }

  return items
}

// Google News RSS returns google.com redirect URLs — follow them server-side so Chinese
// users get direct links to sina/qq/xinhua/thepaper (accessible in China).
async function resolveGoogleRedirect(googleUrl: string): Promise<string> {
  if (!googleUrl.includes('news.google.com')) return googleUrl
  try {
    const res = await fetch(googleUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorldCupPredictor/1.0)' },
      signal: AbortSignal.timeout(4000),
    })
    // After following redirects, res.url is the final destination
    if (res.url && !res.url.includes('news.google.com')) return res.url
    // Some feeds encode the URL in the HTML; try extracting from response text
    const html = await res.text()
    const m = html.match(/href="(https?:\/\/(?:sports\.sina|sports\.qq|xinhuanet|thepaper|bbc\.com)[^"]+)"/)
    return m?.[1] ?? googleUrl
  } catch {
    return googleUrl
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim() ?? ''
  if (!name) return NextResponse.json([])

  const SITES = [
    'sports.sina.com.cn',
    'sports.qq.com',
    'xinhuanet.com',
    'bbc.com/zhongwen',
    'thepaper.cn',
  ]
  const siteFilter = SITES.map(s => `site:${s}`).join(' OR ')

  // 只取最近 30 天的新闻
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const afterDate = monthAgo.toISOString().slice(0, 10) // YYYY-MM-DD
  const query = encodeURIComponent(`${name} 足球 (${siteFilter}) after:${afterDate}`)
  const url = `https://news.google.com/rss/search?q=${query}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WorldCupPredictor/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 1800 },
    })

    if (!res.ok) return NextResponse.json([])

    const xml = await res.text()
    const items = parseRSS(xml)

    // Resolve Google redirect URLs in parallel (max 8 concurrent)
    const resolved = await Promise.all(
      items.map(item => resolveGoogleRedirect(item.link).then(link => ({ ...item, link })))
    )

    // 二次过滤：移除 30 天前的条目，并按最新排在最前
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    const filtered = resolved
      .filter(item => {
        if (!item.pubDate) return true
        const t = new Date(item.pubDate).getTime()
        return isNaN(t) || t >= cutoff
      })
      .sort((a, b) => {
        const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0
        const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0
        return tb - ta
      })

    return NextResponse.json(filtered, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  } catch {
    return NextResponse.json([])
  }
}
