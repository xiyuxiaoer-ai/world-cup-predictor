import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { STADIUM_INFO } from '@/lib/stadiums'
import { MATCH_VENUES } from '@/lib/venues'

function haversineKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371
  const toRad = (d: number) => d * Math.PI / 180
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function proxyImg(url: string | null | undefined): string | null {
  if (!url) return null
  return `/api/img?url=${encodeURIComponent(url)}`
}

async function fetchStadiumImage(wikiTitle: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&format=json&pithumbsize=900`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WorldCupPredictor/1.0 (educational project)' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const pages = Object.values((await res.json()).query?.pages ?? {}) as any[]
    return proxyImg(pages[0]?.thumbnail?.source ?? null)
  } catch { return null }
}

async function fetchWeather(lat: number, lon: number, matchDate: string): Promise<any | null> {
  try {
    const res = await fetch(`https://wttr.in/${lat},${lon}?format=j1`, {
      headers: { 'User-Agent': 'WorldCupPredictor/1.0' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const json = await res.json()
    const forecast = matchDate
      ? (json.weather?.find((w: any) => w.date === matchDate) ?? json.weather?.[0])
      : json.weather?.[0]
    const cur = json.current_condition?.[0]
    if (!forecast && !cur) return null
    return {
      temp:      parseInt(forecast?.avgtempC ?? cur?.temp_C ?? '25'),
      maxTemp:   parseInt(forecast?.maxtempC ?? cur?.temp_C ?? '30'),
      minTemp:   parseInt(forecast?.mintempC ?? cur?.temp_C ?? '20'),
      humidity:  parseInt(cur?.humidity ?? '60'),
      windspeed: parseInt(cur?.windspeedKmph ?? '10'),
      desc: cur?.weatherDesc?.[0]?.value ?? forecast?.hourly?.[4]?.weatherDesc?.[0]?.value ?? 'Clear',
    }
  } catch { return null }
}

async function fetchCountrySummary(name: string): Promise<string | null> {
  try {
    const res = await fetch(`https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`, {
      headers: { 'User-Agent': 'WorldCupPredictor/1.0', Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const extract: string = (await res.json()).extract ?? ''
    if (!extract) return null
    const sentences = extract.match(/[^。！？.!?]+[。！？.!?]*/g) ?? []
    const text = sentences.slice(0, 5).join('').trim()
    return text.slice(0, 400) + (text.length > 400 ? '…' : '')
  } catch { return null }
}

interface Logistics { prevCity: string; prevStadium: string; distanceKm: number; restDays: number }

async function fetchTeamLogistics(
  tla: string, kickoffTime: string, venueLon: number, venueLat: number,
  admin: ReturnType<typeof createClient>
): Promise<Logistics | null> {
  try {
    const { data } = await admin
      .from('matches')
      .select('kickoff_time, api_match_id')
      .or(`home_tla.eq.${tla},away_tla.eq.${tla}`)
      .eq('status', 'finished')
      .lt('kickoff_time', kickoffTime)
      .order('kickoff_time', { ascending: false })
      .limit(1)
    if (!data?.length) return null
    const prev = data[0] as { kickoff_time: string; api_match_id: number }
    const prevVenue = MATCH_VENUES[prev.api_match_id]
    if (!prevVenue) return null
    return {
      prevCity:    prevVenue.city,
      prevStadium: prevVenue.stadium,
      distanceKm:  Math.round(haversineKm(prevVenue.coordinates[0], prevVenue.coordinates[1], venueLon, venueLat)),
      restDays:    Math.round((new Date(kickoffTime).getTime() - new Date(prev.kickoff_time).getTime()) / 86400000),
    }
  } catch { return null }
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  const stadium     = sp.get('stadium')      ?? ''
  const lat         = parseFloat(sp.get('lat') ?? '0')
  const lon         = parseFloat(sp.get('lon') ?? '0')
  const homeTeam    = sp.get('home_team')    ?? ''
  const awayTeam    = sp.get('away_team')    ?? ''
  const homeTla     = sp.get('home_tla')     ?? ''
  const awayTla     = sp.get('away_tla')     ?? ''
  const kickoffTime = sp.get('kickoff_time') ?? ''
  const matchDate   = kickoffTime ? kickoffTime.split('T')[0] : (sp.get('date') ?? '')

  const stadiumMeta = STADIUM_INFO[stadium] ?? null
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [image, weather, homeWiki, awayWiki, homeLogistics, awayLogistics] = await Promise.all([
    stadiumMeta ? fetchStadiumImage(stadiumMeta.wikiTitle) : Promise.resolve(null),
    fetchWeather(lat, lon, matchDate),
    homeTeam ? fetchCountrySummary(homeTeam) : Promise.resolve(null),
    awayTeam ? fetchCountrySummary(awayTeam) : Promise.resolve(null),
    (homeTla && kickoffTime) ? fetchTeamLogistics(homeTla, kickoffTime, lon, lat, admin) : Promise.resolve(null),
    (awayTla && kickoffTime) ? fetchTeamLogistics(awayTla, kickoffTime, lon, lat, admin) : Promise.resolve(null),
  ])

  return NextResponse.json(
    { stadiumInfo: stadiumMeta ? { capacity: stadiumMeta.capacity, opened: stadiumMeta.opened, image } : null, weather, homeWiki, awayWiki, homeLogistics, awayLogistics },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
