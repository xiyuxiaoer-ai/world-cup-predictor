'use client'

import { memo, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { getFlagUrl } from '@/lib/flags'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ─── Custom SVG icons (no system emoji) ─────────────────────────────────────

function IcStadium({ s = 16 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 19C4 14 7 9 12 9C17 9 20 14 21 19" />
      <ellipse cx="12" cy="16" rx="4" ry="2" />
      <line x1="3" y1="19" x2="21" y2="19" />
      <line x1="6.5" y1="19" x2="6.5" y2="14.5" />
      <line x1="17.5" y1="19" x2="17.5" y2="14.5" />
    </svg>
  )
}

function IcCal({ s = 16 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2.5" />
      <path d="M3 10h18M8 2v4M16 2v4" />
      <circle cx="8" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="15" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IcTherm({ s = 16 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M12 4v9.4A4 4 0 1 0 16 17a4 4 0 0 0-4-3.6V4" />
      <line x1="15" y1="7" x2="12" y2="7" />
      <line x1="15" y1="10.5" x2="12" y2="10.5" />
    </svg>
  )
}

function IcDrop({ s = 16 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5C12 2.5 4.5 10.5 4.5 15A7.5 7.5 0 0 0 19.5 15C19.5 10.5 12 2.5 12 2.5Z" />
    </svg>
  )
}

function IcWind({ s = 16 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h11a3 3 0 1 0-3-3" />
      <path d="M3 12h16a3 3 0 1 1-3 3" />
      <path d="M3 16h7" />
    </svg>
  )
}

function IcRoute({ s = 16 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="5" r="2.5" />
      <path d="M5 16.5C5 11 10 9 14 8.5" strokeDasharray="2.5 2" />
      <line x1="14" y1="8.5" x2="19" y2="7.5" />
    </svg>
  )
}

function IcMoon({ s = 16 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function IcPin({ s = 14 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

// Weather icon component (no emoji)
function IcWeather({ desc, s = 24 }: { desc: string; s?: number }) {
  const d = desc.toLowerCase()
  if (d.includes('thunder'))
    return (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
        <path d="M13 11l-4 6h6l-4 6" />
      </svg>
    )
  if (d.includes('snow') || d.includes('blizzard'))
    return (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
        <path d="M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01" />
      </svg>
    )
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower'))
    return (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
      </svg>
    )
  if (d.includes('fog') || d.includes('mist'))
    return (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M3 12h18M3 16h18M3 20h18M12 4v2M6.34 6.34l1.42 1.42M1 10h2M21 10h2M17.66 6.34l1.41-1.41" />
      </svg>
    )
  if (d.includes('overcast') || (d.includes('cloud') && !d.includes('partly')))
    return (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    )
  if (d.includes('cloud') || d.includes('partly'))
    return (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v1M3.79 5.79l.7.71M1 11h1" />
        <circle cx="10" cy="11" r="3" />
        <path d="M6 18H14a4 4 0 0 0 0-8 5.78 5.78 0 0 0-.7.07A5.99 5.99 0 0 0 5 14a3.5 3.5 0 0 0 1 4z" />
      </svg>
    )
  // default: sunny / clear
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

// ─── Data maps ───────────────────────────────────────────────────────────────

const TLA_TO_ISO: Record<string, string> = {
  MEX: '484', USA: '840', CAN: '124', BRA: '076', ARG: '032',
  COL: '170', URU: '858', ECU: '218', PAR: '600',
  PAN: '591', HAI: '332', CUW: '531',
  FRA: '250', GER: '276', ESP: '724', ENG: '826', POR: '620',
  NED: '528', BEL: '056', CRO: '191', SUI: '756',
  TUR: '792', AUT: '040', SWE: '752', NOR: '578', SCO: '826',
  BIH: '070', CZE: '203',
  MAR: '504', SEN: '686', EGY: '818', CIV: '384', ALG: '012',
  TUN: '788', GHA: '288', COD: '180', CPV: '132', RSA: '710',
  JPN: '392', KOR: '410', AUS: '036', QAT: '634', UZB: '860',
  IRN: '364', KSA: '682', JOR: '400', IRQ: '368',
  NZL: '554',
}

const TLA_TO_REGION: Record<string, string> = {
  ARG:'南美洲', BRA:'南美洲', URU:'南美洲', COL:'南美洲', ECU:'南美洲', PAR:'南美洲',
  USA:'北美洲', CAN:'北美洲', MEX:'北美洲',
  PAN:'中美洲', HAI:'加勒比海', CUW:'加勒比海',
  FRA:'西欧', GER:'中欧', ESP:'西欧', POR:'西欧', NED:'西欧', BEL:'西欧',
  SUI:'中欧', AUT:'中欧', ENG:'不列颠群岛', SCO:'不列颠群岛',
  CRO:'东南欧', BIH:'东南欧', CZE:'中欧',
  TUR:'亚欧交界', SWE:'北欧', NOR:'北欧',
  MAR:'北非', EGY:'北非', ALG:'北非', TUN:'北非',
  SEN:'西非', CIV:'西非', GHA:'西非', CPV:'西非',
  COD:'中非', RSA:'南非',
  JPN:'东亚', KOR:'东亚',
  AUS:'大洋洲', NZL:'大洋洲',
  IRN:'中东', KSA:'中东', QAT:'中东', JOR:'中东', IRQ:'中东',
  UZB:'中亚',
}

const WEATHER_ZH: Record<string, string> = {
  'Sunny':'晴天','Clear':'晴天','Partly cloudy':'多云','Partly Cloudy':'多云',
  'Cloudy':'阴天','Overcast':'阴天','Mist':'薄雾','Fog':'大雾',
  'Light drizzle':'毛毛雨','Drizzle':'小雨','Light rain':'小雨',
  'Moderate rain':'中雨','Heavy rain':'大雨','Patchy rain possible':'局部有雨',
  'Patchy light rain':'零星小雨','Thundery outbreaks possible':'局部雷阵雨',
  'Blizzard':'暴风雪','Light snow':'小雪','Moderate snow':'中雪',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Skel({ c }: { c: string }) {
  return <div className={`rounded-md bg-white/20 dark:bg-white/10 animate-pulse ${c}`} />
}

const CountryMiniMap = memo(function CountryMiniMap({ iso }: { iso: string | null }) {
  return (
    <div style={{ background: '#14213d', height: 96, overflow: 'hidden' }}>
      <ComposableMap projectionConfig={{ scale: 130, center: [0, 12] }} style={{ width: '100%', height: 96 }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={geo.id === iso ? '#f59e0b' : '#1e3a5f'}
                stroke="#14213d"
                strokeWidth={0.4}
                style={{ default:{outline:'none'}, hover:{outline:'none'}, pressed:{outline:'none'} }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
    </div>
  )
})

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatchInfo {
  stadiumInfo: { capacity: number; opened: number; image: string | null } | null
  weather: { temp: number; maxTemp: number; minTemp: number; humidity: number; windspeed: number; desc: string } | null
  homeWiki: string | null
  awayWiki: string | null
  homeLogistics: { prevCity: string; prevStadium: string; distanceKm: number; restDays: number } | null
  awayLogistics: { prevCity: string; prevStadium: string; distanceKm: number; restDays: number } | null
}

interface Props {
  homeTla: string
  awayTla: string
  homeTeam: string
  awayTeam: string
  venue: { stadium: string; city: string; coordinates: [number, number] }
  kickoffTime?: string
  onClose: () => void
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StadiumMapModal({ homeTla, awayTla, homeTeam, awayTeam, venue, kickoffTime, onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  const [info, setInfo] = useState<MatchInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgErr, setImgErr] = useState(false)

  useEffect(() => {
    setMounted(true)
    const p = new URLSearchParams({
      stadium:   venue.stadium,
      lat:       venue.coordinates[1].toString(),
      lon:       venue.coordinates[0].toString(),
      home_team: homeTeam,
      away_team: awayTeam,
      home_tla:  homeTla,
      away_tla:  awayTla,
      ...(kickoffTime ? { kickoff_time: kickoffTime } : {}),
    })
    fetch(`/api/match-info?${p}`)
      .then(r => r.json())
      .then(d => { setInfo(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null

  const homeFlagUrl = getFlagUrl(homeTla)
  const awayFlagUrl  = getFlagUrl(awayTla)
  const isCN = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Shanghai'
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${venue.coordinates[1]},${venue.coordinates[0]}`
  const amapUrl  = `https://www.amap.com/search?query=${encodeURIComponent(venue.stadium + ' ' + venue.city)}`

  const heroImg = !imgErr ? (info?.stadiumInfo?.image ?? null) : null
  const w = info?.weather

  const homeIso    = TLA_TO_ISO[homeTla?.toUpperCase()]    ?? null
  const awayIso    = TLA_TO_ISO[awayTla?.toUpperCase()]    ?? null
  const homeRegion = TLA_TO_REGION[homeTla?.toUpperCase()] ?? ''
  const awayRegion = TLA_TO_REGION[awayTla?.toUpperCase()] ?? ''

  const teams = [
    { name: homeTeam, flag: homeFlagUrl, tla: homeTla, iso: homeIso, region: homeRegion, wiki: info?.homeWiki, log: info?.homeLogistics },
    { name: awayTeam, flag: awayFlagUrl, tla: awayTla, iso: awayIso, region: awayRegion, wiki: info?.awayWiki, log: info?.awayLogistics },
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:mx-4 rounded-t-[28px] sm:rounded-[24px] overflow-hidden max-h-[94vh] flex flex-col animate-sheet-in"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.10) 60%, rgba(255,255,255,0.06) 100%)',
          backdropFilter: 'blur(48px) saturate(2)',
          WebkitBackdropFilter: 'blur(48px) saturate(2)',
          border: '1px solid rgba(255,255,255,0.3)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 1px 0 rgba(255,255,255,0.4) inset',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Hero image ── */}
        <div className="relative h-52 shrink-0">
          {heroImg ? (
            <img src={heroImg} alt={venue.stadium} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1a2a4a,#0f172a)' }}>
              <IcStadium s={72} />
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0) 100%)' }} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform hover:scale-110 active:scale-95"
            style={{ background:'rgba(0,0,0,0.52)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.18)' }}
          >✕</button>
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pointer-events-none">
            <p className="text-white font-bold text-xl leading-tight" style={{ textShadow:'0 1px 8px rgba(0,0,0,0.6)' }}>{venue.stadium}</p>
            <p className="flex items-center gap-1.5 mt-0.5 text-white/60 text-sm">
              <IcPin s={12} />{venue.city}
            </p>
          </div>
        </div>

        {/* ── Teams ── */}
        <div className="flex items-center justify-center gap-5 px-5 py-3.5 shrink-0" style={{ borderBottom:'1px solid rgba(255,255,255,0.14)' }}>
          <div className="flex items-center gap-2.5">
            {homeFlagUrl && <img src={homeFlagUrl} alt={homeTeam} className="w-8 h-5 object-cover rounded-sm" style={{ boxShadow:'0 2px 6px rgba(0,0,0,0.3)' }} />}
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{homeTeam}</span>
          </div>
          <span className="text-[9px] font-black text-gray-400 border border-gray-300/50 dark:border-gray-500/50 px-2.5 py-0.5 rounded-full tracking-[0.2em]">VS</span>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{awayTeam}</span>
            {awayFlagUrl && <img src={awayFlagUrl} alt={awayTeam} className="w-8 h-5 object-cover rounded-sm" style={{ boxShadow:'0 2px 6px rgba(0,0,0,0.3)' }} />}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 overscroll-contain">

          {/* Venue map (North America zoom) */}
          <div style={{ background:'#14213d', maxHeight:128, overflow:'hidden' }}>
            <ComposableMap projectionConfig={{ scale: 480, center: [-96, 38] }} style={{ width:'100%', height:128 }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) => geographies.map(geo => (
                  <Geography key={geo.rsmKey} geography={geo} fill="#1e3a5f" stroke="#14213d" strokeWidth={0.5}
                    style={{ default:{outline:'none'}, hover:{outline:'none'}, pressed:{outline:'none'} }} />
                ))}
              </Geographies>
              <Marker coordinates={venue.coordinates}>
                <circle r={20} fill="#f59e0b" opacity={0.1} />
                <circle r={10} fill="#f59e0b" opacity={0.3} />
                <circle r={5}  fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
              </Marker>
            </ComposableMap>
          </div>

          {/* ── Stadium + Weather grid ── */}
          <div className="grid grid-cols-2 gap-3 p-4">

            {/* Stadium card */}
            <div className="rounded-2xl p-4" style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.18),rgba(245,158,11,0.07))', border:'1px solid rgba(245,158,11,0.25)' }}>
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.18em] mb-3">场馆信息</p>
              {loading ? (
                <div className="space-y-2.5"><Skel c="h-9 w-full" /><Skel c="h-7 w-3/4" /></div>
              ) : info?.stadiumInfo ? (
                <div className="space-y-3.5">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500/90 mt-0.5"><IcStadium s={14} /></span>
                    <div><p className="text-base font-black text-gray-800 dark:text-gray-50 leading-none">{(info.stadiumInfo.capacity / 10000).toFixed(1)}万</p><p className="text-[10px] text-amber-600/70 dark:text-amber-400/60 mt-0.5">座位容量</p></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500/90 mt-0.5"><IcCal s={14} /></span>
                    <div><p className="text-base font-black text-gray-800 dark:text-gray-50 leading-none">{info.stadiumInfo.opened}</p><p className="text-[10px] text-amber-600/70 dark:text-amber-400/60 mt-0.5">建成年份</p></div>
                  </div>
                </div>
              ) : <p className="text-xs text-gray-400 mt-2">暂无数据</p>}
            </div>

            {/* Weather card */}
            <div className="rounded-2xl p-4" style={{ background:'linear-gradient(135deg,rgba(14,165,233,0.18),rgba(14,165,233,0.07))', border:'1px solid rgba(14,165,233,0.25)' }}>
              <p className="text-[9px] font-black text-sky-500 uppercase tracking-[0.18em] mb-3">当地天气</p>
              {loading ? (
                <div className="space-y-2.5"><Skel c="h-9 w-1/2" /><Skel c="h-4 w-full" /><Skel c="h-4 w-4/5" /></div>
              ) : w ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sky-500"><IcWeather desc={w.desc} s={28} /></span>
                    <span className="text-2xl font-black text-gray-800 dark:text-gray-50">{w.temp}°</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{WEATHER_ZH[w.desc] ?? w.desc}</p>
                  <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-[11px] text-sky-600/80 dark:text-sky-400/70"><IcDrop s={11} />湿度 {w.humidity}%</p>
                    <p className="flex items-center gap-1.5 text-[11px] text-sky-600/80 dark:text-sky-400/70"><IcWind s={11} />{w.windspeed} km/h</p>
                    <p className="text-[10px] text-gray-400">最高 {w.maxTemp}° / 最低 {w.minTemp}°</p>
                  </div>
                </div>
              ) : <p className="text-xs text-gray-400 mt-2">暂无预报</p>}
            </div>
          </div>

          {/* ── Team logistics ── */}
          <div className="px-4 pb-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.18em] shrink-0">赛程轨迹</p>
              <div className="flex-1 h-px" style={{ background:'linear-gradient(to right, rgba(255,255,255,0.2), transparent)' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {teams.map(({ name, flag, log }) => (
                <div key={name} className="rounded-2xl p-3.5 space-y-2.5" style={{ background:'rgba(255,255,255,0.09)', border:'1px solid rgba(255,255,255,0.14)' }}>
                  <div className="flex items-center gap-1.5">
                    {flag && <img src={flag} alt={name} className="w-5 h-3.5 object-cover rounded-sm" />}
                    <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300 truncate">{name}</p>
                  </div>
                  {loading ? (
                    <div className="space-y-2"><Skel c="h-3 w-full" /><Skel c="h-3 w-4/5" /><Skel c="h-3 w-3/5" /></div>
                  ) : log ? (
                    <div className="space-y-2">
                      <div className="flex items-start gap-1.5">
                        <span className="text-gray-400 mt-0.5 shrink-0"><IcPin s={11} /></span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">上场：{log.prevCity}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 shrink-0"><IcRoute s={11} /></span>
                        <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200">{log.distanceKm.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 shrink-0"><IcMoon s={11} /></span>
                        <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200">休息 {log.restDays} 天</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">本届首场</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Country info ── */}
          <div className="px-4 pb-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.18em] shrink-0">参赛国简介</p>
              <div className="flex-1 h-px" style={{ background:'linear-gradient(to right, rgba(255,255,255,0.2), transparent)' }} />
            </div>
            {teams.map(({ name, flag, iso, region, wiki }) => (
              <div key={name} className="rounded-2xl overflow-hidden" style={{ background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)' }}>
                {/* header */}
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    {flag && <img src={flag} alt={name} className="w-7 h-4.5 object-cover rounded-sm" style={{ boxShadow:'0 2px 6px rgba(0,0,0,0.22)' }} />}
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{name}</span>
                  </div>
                  {region && <span className="text-[9px] text-gray-400 bg-white/20 dark:bg-white/10 px-2 py-0.5 rounded-full border border-white/20">{region}</span>}
                </div>
                {/* country mini-map */}
                <CountryMiniMap iso={iso} />
                {/* wiki text */}
                <div className="px-4 py-3.5">
                  {loading ? (
                    <div className="space-y-1.5">
                      <Skel c="h-2.5 w-full" /><Skel c="h-2.5 w-11/12" /><Skel c="h-2.5 w-4/5" /><Skel c="h-2.5 w-3/5" />
                    </div>
                  ) : wiki ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{wiki}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">暂无简介</p>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderTop:'1px solid rgba(255,255,255,0.12)' }}>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <IcPin s={12} />{venue.city}
          </span>
          <a href={isCN ? amapUrl : gmapsUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-amber-500 hover:text-amber-400 font-bold transition-colors">
            在地图中打开 →
          </a>
        </div>

      </div>
    </div>,
    document.body
  )
}
