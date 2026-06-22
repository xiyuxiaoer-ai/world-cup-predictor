// Image proxy — lets Chinese users' browsers load Wikipedia images through our Vercel domain
// upload.wikimedia.org is blocked in China; this route fetches and streams images server-side.

const ALLOWED_HOSTS = [
  // Wikimedia / Wikipedia
  'upload.wikimedia.org',
  'commons.wikimedia.org',
  'en.wikipedia.org',
  'zh.wikipedia.org',
  // Baidu Baike image CDN — fallback source for player photos
  'bkimg.cdn.bcebos.com',   // primary Baidu Baike CDN
  'bcebos.com',             // matches *.bcebos.com
  'baidu.com',              // matches gss0/gss1/gss2/hiphotos/imgsrc.baidu.com
  'bdstatic.com',           // Baidu static CDN
]

export async function GET(request: Request) {
  const rawUrl = new URL(request.url).searchParams.get('url')
  if (!rawUrl) return new Response('Missing url', { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  if (!ALLOWED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))) {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    const upstream = await fetch(rawUrl, {
      headers: { 'User-Agent': 'WorldCupPredictor/1.0 (educational project)' },
      // no next.revalidate here — Response constructor used directly
    })
    if (!upstream.ok) return new Response('Upstream error', { status: 502 })

    const body = await upstream.arrayBuffer()
    const contentType = upstream.headers.get('Content-Type') || 'image/jpeg'

    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new Response('Fetch failed', { status: 502 })
  }
}
