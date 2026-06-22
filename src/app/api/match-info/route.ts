import { NextResponse } from 'next/server'
import { STADIUM_INFO } from '@/lib/stadiums'

async function fetchStadiumImage(wikiTitle: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&format=json&pithumbsize=900`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WorldCupPredictor/1.0 (educational project)' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const json = await res.json()
    const pages = Object.values(json.query?.pages ?? {}) as any[]
    return pages[0]?.thumbnail?.source ?? null
  } catch { return null }
}

async function fetchWeather(lat: number, lon: number, matchDate: string): Promise<any | null> {
  try {
    const url = `https://wttr.in/${lat},${lon}?format=j1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WorldCupPredictor/1.0' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const json = await res.json()

    // Try to find forecast for match date; fall back to first available day
    const forecast = matchDate
      ? (json.weather?.find((w: any) => w.date === matchDate) ?? json.weather?.[0])
      : json.weather?.[0]
    const current = json.current_condition?.[0]
    if (!forecast && !current) return null

    const desc = current?.weatherDesc?.[0]?.value
      ?? forecast?.hourly?.[4]?.weatherDesc?.[0]?.value
      ?? 'Clear'

    return {
      temp:      parseInt(forecast?.avgtempC  ?? current?.temp_C ?? '25'),
      maxTemp:   parseInt(forecast?.maxtempC  ?? current?.temp_C ?? '30'),
      minTemp:   parseInt(forecast?.mintempC  ?? current?.temp_C ?? '20'),
      humidity:  parseInt(current?.humidity   ?? '60'),
      windspeed: parseInt(current?.windspeedKmph ?? '10'),
      desc,
    }
  } catch { return null }
}

async function fetchCountrySummary(name: string): Promise<string | null> {
  try {
    const url = `https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WorldCupPredictor/1.0 (educational project)',
        Accept: 'application/json',
      },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const json = await res.json()
    const extract: string = json.extract ?? ''
    if (!extract) return null
    // First two sentences, max 150 chars
    const sentences = extract.match(/[^。！？.!?]+[。！？.!?]*/g) ?? []
    const short = sentences.slice(0, 2).join('').trim()
    return short.slice(0, 160) + (short.length > 160 ? '…' : '')
  } catch { return null }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stadium  = searchParams.get('stadium')   ?? ''
  const lat      = parseFloat(searchParams.get('lat') ?? '0')
  const lon      = parseFloat(searchParams.get('lon') ?? '0')
  const homeTeam = searchParams.get('home_team') ?? ''
  const awayTeam = searchParams.get('away_team') ?? ''
  const matchDate = searchParams.get('date')     ?? ''

  const stadiumMeta = STADIUM_INFO[stadium] ?? null

  const [image, weather, homeWiki, awayWiki] = await Promise.all([
    stadiumMeta ? fetchStadiumImage(stadiumMeta.wikiTitle) : Promise.resolve(null),
    fetchWeather(lat, lon, matchDate),
    homeTeam ? fetchCountrySummary(homeTeam) : Promise.resolve(null),
    awayTeam ? fetchCountrySummary(awayTeam) : Promise.resolve(null),
  ])

  return NextResponse.json(
    {
      stadiumInfo: stadiumMeta
        ? { capacity: stadiumMeta.capacity, opened: stadiumMeta.opened, image }
        : null,
      weather,
      homeWiki,
      awayWiki,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
  )
}
