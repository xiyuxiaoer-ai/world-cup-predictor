// GeoJSON proxy — serves world-atlas countries-110m.json through our Vercel domain.
// cdn.jsdelivr.net is unreliable in China; this caches the GeoJSON on Vercel's edge.

const SOURCE = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export async function GET() {
  try {
    const res = await fetch(SOURCE, {
      next: { revalidate: 2592000 }, // cache 30 days on Vercel
    })
    if (!res.ok) return new Response('Upstream error', { status: 502 })

    const body = await res.text()
    return new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=2592000, stale-while-revalidate=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new Response('Fetch failed', { status: 502 })
  }
}
