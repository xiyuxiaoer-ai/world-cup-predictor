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

    // title: CDATA or plain
    const titleMatch =
      raw.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
      raw.match(/<title>([\s\S]*?)<\/title>/)
    const title = titleMatch?.[1]?.trim() ?? ''

    // link: text node after <link> tag (Google RSS uses <link/> with preceding GUID sometimes)
    const linkMatch = raw.match(/<link>(https?:\/\/[^\s<]+)<\/link>/) ||
      raw.match(/<link\s+href="([^"]+)"/)
    const link = linkMatch?.[1]?.trim() ?? ''

    // pubDate
    const dateMatch = raw.match(/<pubDate>([\s\S]*?)<\/pubDate>/)
    const pubDate = dateMatch?.[1]?.trim() ?? ''

    // source
    const sourceMatch =
      raw.match(/<source[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/source>/) ||
      raw.match(/<source[^>]*>([\s\S]*?)<\/source>/)
    const source = sourceMatch?.[1]?.trim() ?? ''

    if (title && link) items.push({ title, link, pubDate, source })
    if (items.length >= 10) break
  }

  return items
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim() ?? ''
  if (!name) return NextResponse.json([])

  // Search Google News RSS — Chinese + English query for broader coverage
  const query = encodeURIComponent(`${name} 足球 国家队`)
  const url = `https://news.google.com/rss/search?q=${query}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; WorldCupPredictor/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 1800 }, // cache 30 min server-side
    })

    if (!res.ok) return NextResponse.json([])

    const xml = await res.text()
    const items = parseRSS(xml)
    return NextResponse.json(items, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  } catch {
    return NextResponse.json([])
  }
}
