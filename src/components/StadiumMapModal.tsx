'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { getFlagUrl } from '@/lib/flags'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface MatchInfo {
  stadiumInfo: { capacity: number; opened: number; image: string | null } | null
  weather: {
    temp: number; maxTemp: number; minTemp: number
    humidity: number; windspeed: number; desc: string
  } | null
  homeWiki: string | null
  awayWiki: string | null
}

interface Props {
  homeTla: string
  awayTla: string
  homeTeam: string
  awayTeam: string
  venue: { stadium: string; city: string; coordinates: [number, number] }
  matchDate?: string  // YYYY-MM-DD
  onClose: () => void
}

function weatherIcon(desc: string): string {
  const d = desc.toLowerCase()
  if (d.includes('blizzard') || d.includes('snow')) return '❄️'
  if (d.includes('thunder')) return '⛈️'
  if (d.includes('heavy rain')) return '🌧️'
  if (d.includes('rain') || d.includes('shower') || d.includes('drizzle')) return '🌦️'
  if (d.includes('fog') || d.includes('mist')) return '🌫️'
  if (d.includes('overcast') || d.includes('cloud')) return '☁️'
  if (d.includes('sun') || d.includes('clear')) return '☀️'
  return '⛅'
}

const WEATHER_ZH: Record<string, string> = {
  'Sunny': '晴天', 'Clear': '晴天', 'Partly cloudy': '多云', 'Partly Cloudy': '多云',
  'Cloudy': '阴天', 'Overcast': '阴天', 'Mist': '薄雾', 'Fog': '大雾',
  'Light drizzle': '毛毛雨', 'Drizzle': '小雨', 'Light rain': '小雨',
  'Moderate rain': '中雨', 'Heavy rain': '大雨', 'Patchy rain possible': '局部有雨',
  'Patchy light rain': '零星小雨', 'Thundery outbreaks possible': '局部雷阵雨',
  'Blizzard': '暴风雪', 'Light snow': '小雪', 'Moderate snow': '中雪',
}
function weatherZh(desc: string) { return WEATHER_ZH[desc] || desc }

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200/60 dark:bg-gray-700/40 ${className ?? ''}`} />
}

export default function StadiumMapModal({
  homeTla, awayTla, homeTeam, awayTeam, venue, matchDate, onClose,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [info, setInfo] = useState<MatchInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setMounted(true)
    const p = new URLSearchParams({
      stadium:   venue.stadium,
      lat:       venue.coordinates[1].toString(),
      lon:       venue.coordinates[0].toString(),
      home_team: homeTeam,
      away_team: awayTeam,
      ...(matchDate ? { date: matchDate } : {}),
    })
    fetch(`/api/match-info?${p}`)
      .then(r => r.json())
      .then(d => { setInfo(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null

  const homeFlagUrl = getFlagUrl(homeTla)
  const awayFlagUrl  = getFlagUrl(awayTla)
  const isMainlandChina = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Shanghai'
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${venue.coordinates[1]},${venue.coordinates[0]}`
  const amapUrl  = `https://www.amap.com/search?query=${encodeURIComponent(venue.stadium + ' ' + venue.city)}`
  const mapUrl   = isMainlandChina ? amapUrl : gmapsUrl
  const mapLabel = isMainlandChina ? '在高德地图打开 →' : '在地图中打开 →'

  const heroImg = !imgError ? info?.stadiumInfo?.image : null
  const weather = info?.weather
  const wIcon   = weather ? weatherIcon(weather.desc) : '⛅'

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:mx-4 glass rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col animate-spring-in"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Hero Image ── */}
        <div className="relative h-52 shrink-0 bg-gradient-to-br from-slate-700 to-slate-900">
          {loading && !heroImg ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl opacity-10 select-none">🏟</span>
            </div>
          ) : heroImg ? (
            <img
              src={heroImg}
              alt={venue.stadium}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl opacity-10 select-none">🏟</span>
            </div>
          )}

          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

          {/* close */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/50 text-white text-sm flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
          >✕</button>

          {/* stadium name */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pointer-events-none">
            <p className="text-white font-bold text-xl leading-tight drop-shadow-md">{venue.stadium}</p>
            <p className="text-white/65 text-sm mt-0.5 drop-shadow">{venue.city}</p>
          </div>
        </div>

        {/* ── Teams Row ── */}
        <div className="flex items-center justify-center gap-5 px-5 py-3.5 border-b border-white/20 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            {homeFlagUrl && <img src={homeFlagUrl} alt={homeTeam} className="w-7 h-[18px] object-cover rounded-sm shadow-sm" />}
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{homeTeam}</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded-full tracking-wider">VS</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{awayTeam}</span>
            {awayFlagUrl && <img src={awayFlagUrl} alt={awayTeam} className="w-7 h-[18px] object-cover rounded-sm shadow-sm" />}
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto flex-1">

          {/* Mini Map – zoomed North America */}
          <div className="bg-[#192844] overflow-hidden" style={{ maxHeight: 140 }}>
            <ComposableMap
              projectionConfig={{ scale: 480, center: [-96, 38] }}
              style={{ width: '100%', height: 140 }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#263d6a"
                      stroke="#192844"
                      strokeWidth={0.5}
                      style={{ default: { outline: 'none' } }}
                    />
                  ))
                }
              </Geographies>
              <Marker coordinates={venue.coordinates}>
                <circle r={14} fill="#f59e0b" opacity={0.18} />
                <circle r={7}  fill="#f59e0b" opacity={0.5}  />
                <circle r={4}  fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
              </Marker>
            </ComposableMap>
          </div>

          {/* ── Info Grid ── */}
          <div className="grid grid-cols-2 gap-3 p-4">

            {/* Stadium card */}
            <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700/30 p-4 space-y-2">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">场馆信息</p>
              {loading ? (
                <div className="space-y-2 pt-0.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-3/4" />
                </div>
              ) : info?.stadiumInfo ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">🏟</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                        {info.stadiumInfo.capacity.toLocaleString('zh-CN')}
                      </p>
                      <p className="text-[10px] text-gray-400">座位容量</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">📅</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                        {info.stadiumInfo.opened} 年
                      </p>
                      <p className="text-[10px] text-gray-400">建成年份</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 pt-1">暂无数据</p>
              )}
            </div>

            {/* Weather card */}
            <div className="rounded-2xl bg-sky-50/80 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-700/30 p-4 space-y-2">
              <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">当地天气</p>
              {loading ? (
                <div className="space-y-2 pt-0.5">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ) : weather ? (
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl leading-none">{wIcon}</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{weather.temp}°</span>
                  </div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{weatherZh(weather.desc)}</p>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <span>💧</span> 湿度 {weather.humidity}%
                    </p>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <span>🌬</span> {weather.windspeed} km/h
                    </p>
                    <p className="text-[11px] text-gray-400">
                      最高 {weather.maxTemp}° / 最低 {weather.minTemp}°
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 pt-1">暂无预报</p>
              )}
            </div>
          </div>

          {/* ── Country Summaries ── */}
          <div className="px-4 pb-5 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">参赛国简介</p>

            {[
              { tla: homeTla, name: homeTeam, flagUrl: homeFlagUrl, wiki: info?.homeWiki },
              { tla: awayTla, name: awayTeam, flagUrl: awayFlagUrl, wiki: info?.awayWiki },
            ].map(({ name, flagUrl, wiki }) => (
              <div
                key={name}
                className="rounded-2xl bg-white/35 dark:bg-white/5 border border-white/50 dark:border-white/10 p-4"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  {flagUrl && (
                    <img src={flagUrl} alt={name} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                  )}
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{name}</span>
                </div>
                {loading ? (
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-full" />
                    <Skeleton className="h-2.5 w-5/6" />
                    <Skeleton className="h-2.5 w-3/4" />
                  </div>
                ) : wiki ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{wiki}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">暂无介绍</p>
                )}
              </div>
            ))}
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/20 dark:border-white/10 shrink-0">
          <span className="text-xs text-gray-400">📍 {venue.city}</span>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-500 hover:text-amber-600 font-semibold transition-colors"
          >
            {mapLabel}
          </a>
        </div>

      </div>
    </div>,
    document.body
  )
}
