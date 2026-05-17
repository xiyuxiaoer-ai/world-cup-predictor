import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchday = searchParams.get('matchday') || '37'

  const res = await fetch(
    `https://api.football-data.org/v4/competitions/PL/matches?matchday=${matchday}`,
    {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_TOKEN! },
      cache: 'no-store',
    }
  )

  if (!res.ok) return NextResponse.json({ error: 'API 请求失败' }, { status: 500 })
  const data = await res.json()
  return NextResponse.json({ ...data, fetchedAt: new Date().toISOString() })
}
