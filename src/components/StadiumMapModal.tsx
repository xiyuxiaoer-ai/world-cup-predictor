'use client'

import { memo, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { getFlagUrl } from '@/lib/flags'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ─── Icons: filled + stroke combo, max design quality ────────────────────────

const IcX = () => (
  <svg viewBox="0 0 20 20" width={16} height={16}>
    <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

// Stadium silhouette — arched roof + stands + field
const IcStadium = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
    <path d="M3 27 Q3 11 16 11 Q29 11 29 27" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" fill="rgba(245,158,11,0.08)" />
    <rect x="11" y="20" width="10" height="7" rx="1" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" strokeWidth="1.5" />
    <line x1="16" y1="20" x2="16" y2="27" stroke="#f59e0b" strokeWidth="1" />
    <line x1="11" y1="23.5" x2="21" y2="23.5" stroke="#f59e0b" strokeWidth="1" />
    <line x1="3" y1="27" x2="29" y2="27" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    <line x1="3" y1="27" x2="3" y2="20" stroke="#f59e0b" strokeWidth="1.5" />
    <line x1="29" y1="27" x2="29" y2="20" stroke="#f59e0b" strokeWidth="1.5" />
  </svg>
)

// Calendar — clean grid style
const IcCalendar = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <rect x="2" y="4" width="20" height="18" rx="3" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="1.6" />
    <line x1="2" y1="10" x2="22" y2="10" stroke="#f59e0b" strokeWidth="1.5" />
    <line x1="7" y1="2" x2="7" y2="7" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    <line x1="17" y1="2" x2="17" y2="7" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    <circle cx="7" cy="15.5" r="1.3" fill="#f59e0b" />
    <circle cx="12" cy="15.5" r="1.3" fill="#f59e0b" />
    <circle cx="17" cy="15.5" r="1.3" fill="rgba(245,158,11,0.4)" />
  </svg>
)

// Thermometer — tube + mercury
const IcThermometer = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <rect x="10" y="3" width="4" height="13" rx="2" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="1.5" />
    <rect x="11.2" y="8" width="1.6" height="8" rx="0.8" fill="#ef4444" />
    <circle cx="12" cy="18" r="3" fill="#ef4444" />
    <line x1="14.5" y1="6" x2="17" y2="6" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="14.5" y1="9" x2="17" y2="9" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

// Drop (humidity)
const IcHumidity = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M12 3C12 3 5 10 5 15.5a7 7 0 0 0 14 0C19 10 12 3 12 3Z" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M9 16.5a3 3 0 0 0 4 1" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

// Wind
const IcWind = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M3 9h10a3 3 0 0 0 0-6 3 3 0 0 0-2.83 2" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M3 13h14a3 3 0 0 1 0 6 3 3 0 0 1-2.83-2" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M3 17h7" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

// Route / Travel distance — filled origin+destination with dashed arc
const IcDistance = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 28 28" width={size} height={size} fill="none">
    <circle cx="6" cy="20" r="3.5" fill="rgba(245,158,11,0.25)" stroke="#f59e0b" strokeWidth="1.8" />
    <circle cx="22" cy="8" r="3.5" fill="rgba(245,158,11,0.25)" stroke="#f59e0b" strokeWidth="1.8" />
    <path d="M6 16.5 C 6 8, 22 12, 22 11.5" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2.5" strokeLinecap="round" fill="none" />
  </svg>
)

// Moon / Rest days — crescent (filled)
const IcRest = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="rgba(99,102,241,0.2)" stroke="#818cf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17" cy="5" r="1" fill="#818cf8" />
    <circle cx="20" cy="8" r="0.7" fill="rgba(129,140,248,0.5)" />
  </svg>
)

// Pin / Location
const IcLocation = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="9" r="2.8" fill="#f59e0b" />
  </svg>
)

// Home base / camp
const IcBase = ({ size = 15 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M3 11.5L12 3l9 8.5" stroke="#34d399" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 10V21h4v-5h6v5h4V10" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Globe
const IcGlobe = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <circle cx="12" cy="12" r="9" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1.5" />
    <path d="M12 3a15 15 0 0 1 0 18M3 12h18" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M5.6 7h12.8M5.6 17h12.8" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" />
  </svg>
)

// Weather icons (distinctive, character-driven)
function IcWeather({ desc, size = 36 }: { desc: string; size?: number }) {
  const d = desc.toLowerCase()
  if (d.includes('thunder'))
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
        <path d="M30 22A9 9 0 0 0 28 5H26A14 14 0 1 0 8 22" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M22 16L16 26h8l-6 10" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (d.includes('snow') || d.includes('blizzard'))
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
        <path d="M30 22A8 8 0 0 0 28 7H26A13 13 0 1 0 8 22" stroke="#bfdbfe" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="12" y1="28" x2="12" y2="36" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="26" x2="20" y2="38" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="28" x2="28" y2="36" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower'))
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
        <path d="M30 22A8 8 0 0 0 28 7H26A13 13 0 1 0 8 22" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="14" y1="28" x2="11" y2="38" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <line x1="21" y1="28" x2="18" y2="38" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="28" x2="25" y2="38" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  if (d.includes('fog') || d.includes('mist'))
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
        <line x1="5" y1="14" x2="35" y2="14" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="5" y1="20" x2="35" y2="20" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="26" x2="30" y2="26" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" y1="32" x2="28" y2="32" stroke="rgba(203,213,225,0.4)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  if (d.includes('overcast') || (d.includes('cloud') && !d.includes('partly')))
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
        <path d="M32 24H12a8 8 0 1 1 .88-16A10 10 0 1 1 32 24z" fill="rgba(148,163,184,0.15)" stroke="#94a3b8" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  if (d.includes('cloud') || d.includes('partly'))
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
        <circle cx="14" cy="18" r="5" fill="rgba(251,191,36,0.2)" stroke="#fbbf24" strokeWidth="1.5" />
        <path d="M6 6l1.5 1.5M14 4v2M22 6l-1.5 1.5M25 14h-2" stroke="#fbbf24" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M30 28H16a6 6 0 0 1 0-12 7.5 7.5 0 1 1 14 12z" fill="rgba(148,163,184,0.15)" stroke="#94a3b8" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    )
  // Sunny / Clear
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
      <circle cx="20" cy="20" r="8" fill="rgba(251,191,36,0.2)" stroke="#fbbf24" strokeWidth="2" />
      <line x1="20" y1="4" x2="20" y2="8" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="20" y1="32" x2="20" y2="36" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="4" y1="20" x2="8" y2="20" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="32" y1="20" x2="36" y2="20" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="7.75" y1="7.75" x2="10.6" y2="10.6" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <line x1="29.4" y1="29.4" x2="32.25" y2="32.25" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <line x1="7.75" y1="32.25" x2="10.6" y2="29.4" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <line x1="29.4" y1="10.6" x2="32.25" y2="7.75" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Static data tables ──────────────────────────────────────────────────────

// world-atlas geo.id is unpadded: '32' not '032'
const TLA_TO_ISO: Record<string, string> = {
  MEX: '484', USA: '840', CAN: '124', BRA: '76',  ARG: '32',
  COL: '170', URU: '858', ECU: '218', PAR: '600',
  PAN: '591', HAI: '332', CUW: '531',
  FRA: '250', GER: '276', ESP: '724', ENG: '826', POR: '620',
  NED: '528', BEL: '56',  CRO: '191', SUI: '756',
  TUR: '792', AUT: '40',  SWE: '752', NOR: '578', SCO: '826',
  BIH: '70',  CZE: '203',
  MAR: '504', SEN: '686', EGY: '818', CIV: '384', ALG: '12',
  TUN: '788', GHA: '288', COD: '180', CPV: '132', RSA: '710',
  JPN: '392', KOR: '410', AUS: '36',  QAT: '634', UZB: '860',
  IRN: '364', KSA: '682', JOR: '400', IRQ: '368',
  NZL: '554',
}

const TLA_TO_REGION: Record<string, string> = {
  ARG:'南美洲', BRA:'南美洲', URU:'南美洲', COL:'南美洲', ECU:'南美洲', PAR:'南美洲',
  USA:'北美洲', CAN:'北美洲', MEX:'北美洲',
  PAN:'中美洲', HAI:'加勒比海', CUW:'加勒比海',
  FRA:'西欧', GER:'中欧', ESP:'西欧', POR:'西欧', NED:'西欧', BEL:'西欧',
  SUI:'中欧', AUT:'中欧', ENG:'英伦', SCO:'英伦',
  CRO:'东南欧', BIH:'东南欧', CZE:'中欧', TUR:'亚欧交界',
  SWE:'北欧', NOR:'北欧',
  MAR:'北非', EGY:'北非', ALG:'北非', TUN:'北非',
  SEN:'西非', CIV:'西非', GHA:'西非', CPV:'西非',
  COD:'中非', RSA:'南非',
  JPN:'东亚', KOR:'东亚',
  AUS:'大洋洲', NZL:'大洋洲',
  IRN:'中东', KSA:'中东', QAT:'中东', JOR:'中东', IRQ:'中东',
  UZB:'中亚',
}

// Geographic stats for all WC2026 nations
const COUNTRY_GEO: Record<string, { capital: string; population: string; area: string }> = {
  ARG: { capital:'布宜诺斯艾利斯', population:'4,660万', area:'278.0万 km²' },
  BRA: { capital:'巴西利亚',     population:'2.15亿',  area:'851.6万 km²' },
  URU: { capital:'蒙得维的亚',   population:'359万',   area:'17.6万 km²' },
  COL: { capital:'波哥大',       population:'5,200万', area:'113.9万 km²' },
  ECU: { capital:'基多',         population:'1,840万', area:'28.4万 km²' },
  PAR: { capital:'亚松森',       population:'750万',   area:'40.7万 km²' },
  USA: { capital:'华盛顿特区',   population:'3.35亿',  area:'983.4万 km²' },
  CAN: { capital:'渥太华',       population:'3,900万', area:'998.5万 km²' },
  MEX: { capital:'墨西哥城',     population:'1.30亿',  area:'196.4万 km²' },
  PAN: { capital:'巴拿马城',     population:'450万',   area:'7.5万 km²' },
  HAI: { capital:'太子港',       population:'1,160万', area:'2.8万 km²' },
  CUW: { capital:'威廉斯塔德',   population:'15万',    area:'0.04万 km²' },
  FRA: { capital:'巴黎',         population:'6,800万', area:'64.3万 km²' },
  GER: { capital:'柏林',         population:'8,400万', area:'35.7万 km²' },
  ESP: { capital:'马德里',       population:'4,700万', area:'50.6万 km²' },
  ENG: { capital:'伦敦',         population:'5,600万', area:'13.0万 km²' },
  POR: { capital:'里斯本',       population:'1,030万', area:'9.2万 km²' },
  NED: { capital:'阿姆斯特丹',   population:'1,760万', area:'4.2万 km²' },
  BEL: { capital:'布鲁塞尔',     population:'1,160万', area:'3.1万 km²' },
  CRO: { capital:'萨格勒布',     population:'395万',   area:'5.7万 km²' },
  SUI: { capital:'伯尔尼',       population:'880万',   area:'4.1万 km²' },
  TUR: { capital:'安卡拉',       population:'8,500万', area:'78.4万 km²' },
  AUT: { capital:'维也纳',       population:'910万',   area:'8.4万 km²' },
  SWE: { capital:'斯德哥尔摩',   population:'1,040万', area:'44.9万 km²' },
  NOR: { capital:'奥斯陆',       population:'545万',   area:'38.5万 km²' },
  SCO: { capital:'爱丁堡',       population:'560万',   area:'7.9万 km²' },
  BIH: { capital:'萨拉热窝',     population:'327万',   area:'5.1万 km²' },
  CZE: { capital:'布拉格',       population:'1,080万', area:'7.9万 km²' },
  MAR: { capital:'拉巴特',       population:'3,780万', area:'44.7万 km²' },
  EGY: { capital:'开罗',         population:'1.05亿',  area:'100.1万 km²' },
  ALG: { capital:'阿尔及尔',     population:'4,500万', area:'238.2万 km²' },
  TUN: { capital:'突尼斯',       population:'1,200万', area:'16.4万 km²' },
  SEN: { capital:'达喀尔',       population:'1,700万', area:'19.7万 km²' },
  CIV: { capital:'亚穆苏克罗',   population:'2,750万', area:'32.2万 km²' },
  GHA: { capital:'阿克拉',       population:'3,300万', area:'23.9万 km²' },
  CPV: { capital:'普拉亚',       population:'56万',    area:'0.4万 km²' },
  COD: { capital:'金沙萨',       population:'1.02亿',  area:'234.5万 km²' },
  RSA: { capital:'比勒陀利亚',   population:'6,000万', area:'122.0万 km²' },
  JPN: { capital:'东京',         population:'1.25亿',  area:'37.8万 km²' },
  KOR: { capital:'首尔',         population:'5,180万', area:'10.0万 km²' },
  AUS: { capital:'堪培拉',       population:'2,600万', area:'769.2万 km²' },
  QAT: { capital:'多哈',         population:'290万',   area:'1.2万 km²' },
  UZB: { capital:'塔什干',       population:'3,600万', area:'44.8万 km²' },
  IRN: { capital:'德黑兰',       population:'8,600万', area:'164.8万 km²' },
  KSA: { capital:'利雅得',       population:'3,580万', area:'214.9万 km²' },
  JOR: { capital:'安曼',         population:'1,020万', area:'8.9万 km²' },
  IRQ: { capital:'巴格达',       population:'4,200万', area:'43.8万 km²' },
  NZL: { capital:'惠灵顿',       population:'515万',   area:'26.8万 km²' },
}

// WC2026 team base camps (training headquarters)
const TEAM_BASE: Record<string, { city: string; facility: string }> = {
  USA: { city: '卡里, 北卡罗来纳州', facility: '美国足球总部训练基地' },
  MEX: { city: '弗里斯科, 德克萨斯州', facility: 'FC达拉斯训练中心' },
  CAN: { city: '温哥华, 不列颠哥伦比亚省', facility: 'BC广场周边训练基地' },
  ARG: { city: '洛杉矶, 加利福尼亚州', facility: '洛杉矶训练基地' },
  BRA: { city: '奥兰多, 佛罗里达州', facility: '奥兰多城训练设施' },
  FRA: { city: '达拉斯, 德克萨斯州', facility: 'FC达拉斯周边训练营' },
  GER: { city: '夏洛特, 北卡罗来纳州', facility: '夏洛特官方训练基地' },
  ESP: { city: '达拉斯, 德克萨斯州', facility: '达拉斯训练基地' },
  ENG: { city: '达拉斯, 德克萨斯州', facility: '英足总达拉斯营地' },
  POR: { city: '堪萨斯城, 密苏里州', facility: '堪萨斯城训练营' },
  NED: { city: '巴尔的摩, 马里兰州', facility: '荷兰足协东岸营地' },
  MAR: { capital: '', city: '费城, 宾夕法尼亚州', facility: '费城周边训练基地' },
  SEN: { city: '迈阿密, 佛罗里达州', facility: '迈阿密球场训练基地' },
  JPN: { city: '西雅图, 华盛顿州', facility: '西雅图索恩斯训练中心' },
  KOR: { city: '西雅图, 华盛顿州', facility: '西雅图联合营地' },
  AUS: { city: '达拉斯, 德克萨斯州', facility: '澳大利亚队达拉斯营地' },
}

const WEATHER_MAP: Array<[RegExp, string]> = [
  [/sunny|clear/i, '晴天'],
  [/partly.?cloud/i, '多云'],
  [/overcast/i, '阴天'],
  [/cloud/i, '阴天'],
  [/mist|fog/i, '雾'],
  [/thunder/i, '雷阵雨'],
  [/blizzard/i, '暴风雪'],
  [/snow/i, '小雪'],
  [/heavy.?rain/i, '大雨'],
  [/moderate.?rain/i, '中雨'],
  [/drizzle|light.?rain|patchy.?rain/i, '小雨'],
  [/rain/i, '雨'],
]
function weatherZh(desc: string): string {
  for (const [re, zh] of WEATHER_MAP) if (re.test(desc)) return zh
  return desc
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Skel({ cls }: { cls: string }) {
  return <div className={`rounded-lg animate-pulse ${cls}`} style={{ background: 'rgba(255,255,255,0.08)' }} />
}

function SectionHeader({ label, color = '#f59e0b' }: { label: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${color}55, transparent)` }} />
    </div>
  )
}

const CountryMiniMap = memo(function CountryMiniMap({ iso, name }: { iso: string | null; name: string }) {
  return (
    <div style={{ background: 'linear-gradient(180deg,#0c1628 0%,#0f1d34 100%)', height: 120, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, rgba(30,58,100,0.8) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <ComposableMap projectionConfig={{ scale: 142, center: [0, 8] }} style={{ width: '100%', height: 120 }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const hit = iso !== null && String(geo.id) === iso
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={hit ? '#f59e0b' : '#1a3358'}
                  stroke={hit ? '#fde68a' : '#0c1628'}
                  strokeWidth={hit ? 0.8 : 0.25}
                  style={{ default:{outline:'none'}, hover:{outline:'none'}, pressed:{outline:'none'} }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>
      {iso && (
        <div style={{ position: 'absolute', bottom: 5, right: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', letterSpacing: '0.1em', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{name}</span>
        </div>
      )}
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

// ─── Main ─────────────────────────────────────────────────────────────────────

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

  const isCN = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Shanghai'
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${venue.coordinates[1]},${venue.coordinates[0]}`
  const amapUrl  = `https://www.amap.com/search?query=${encodeURIComponent(venue.stadium + ' ' + venue.city)}`
  const heroImg  = !imgErr ? (info?.stadiumInfo?.image ?? null) : null
  const w        = info?.weather

  const homeTlaUpper = homeTla?.toUpperCase()
  const awayTlaUpper = awayTla?.toUpperCase()
  const homeFlagUrl  = getFlagUrl(homeTla)
  const awayFlagUrl  = getFlagUrl(awayTla)
  const homeIso    = TLA_TO_ISO[homeTlaUpper]    ?? null
  const awayIso    = TLA_TO_ISO[awayTlaUpper]    ?? null
  const homeRegion = TLA_TO_REGION[homeTlaUpper] ?? ''
  const awayRegion = TLA_TO_REGION[awayTlaUpper] ?? ''
  const homeGeo    = COUNTRY_GEO[homeTlaUpper]   ?? null
  const awayGeo    = COUNTRY_GEO[awayTlaUpper]   ?? null
  const homeBase   = TEAM_BASE[homeTlaUpper]      ?? null
  const awayBase   = TEAM_BASE[awayTlaUpper]      ?? null

  const teams = [
    { name: homeTeam, flag: homeFlagUrl, tla: homeTlaUpper, iso: homeIso, region: homeRegion, geo: homeGeo, base: homeBase, wiki: info?.homeWiki, log: info?.homeLogistics },
    { name: awayTeam, flag: awayFlagUrl, tla: awayTlaUpper, iso: awayIso, region: awayRegion, geo: awayGeo, base: awayBase, wiki: info?.awayWiki, log: info?.awayLogistics },
  ]

  return createPortal(
    /* Overlay */
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center md:p-6"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      {/* Sheet */}
      <div
        className="relative w-full md:max-w-4xl rounded-t-[28px] md:rounded-[28px] overflow-hidden flex flex-col animate-sheet-in"
        style={{
          maxHeight: '93vh',
          background: 'linear-gradient(158deg, rgba(12,22,50,0.97) 0%, rgba(6,10,28,0.99) 100%)',
          backdropFilter: 'blur(64px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(64px) saturate(1.8)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset, 0 1px 0 rgba(255,255,255,0.25) inset, 0 64px 128px rgba(0,0,0,0.75)',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── HERO ── */}
        <div className="relative shrink-0" style={{ height: 230 }}>
          {heroImg
            ? <img src={heroImg} alt={venue.stadium} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
            : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#111827,#0c1628)' }}>
                <IcStadium size={110} />
              </div>
            )
          }
          {/* dramatic gradient overlays */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(6,10,28,1) 0%,rgba(6,10,28,0.5) 45%,rgba(6,10,28,0.1) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(6,10,28,0.4) 0%,transparent 35%)' }} />

          {/* Pill / handle (mobile) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full md:hidden" style={{ background: 'rgba(255,255,255,0.25)' }} />

          {/* Close */}
          <button onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90 z-10"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <IcX />
          </button>

          {/* Stadium name */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
            <p className="text-2xl md:text-[28px] font-black text-white leading-tight" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.9)' }}>{venue.stadium}</p>
            <p className="flex items-center gap-1.5 mt-1.5 text-white/55 text-sm font-semibold">
              <IcLocation size={13} />{venue.city}
            </p>
          </div>
        </div>

        {/* ── TEAMS BANNER ── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 gap-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className="text-base md:text-lg font-bold text-white text-right leading-tight">{homeTeam}</span>
            {homeFlagUrl && <img src={homeFlagUrl} alt={homeTeam} className="w-11 h-7 object-cover rounded-md shrink-0" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }} />}
          </div>
          <div className="shrink-0 px-3.5 py-1.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="text-[10px] font-black text-amber-400 tracking-[0.25em]">VS</span>
          </div>
          <div className="flex items-center gap-3 flex-1 justify-start">
            {awayFlagUrl && <img src={awayFlagUrl} alt={awayTeam} className="w-11 h-7 object-cover rounded-md shrink-0" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }} />}
            <span className="text-base md:text-lg font-bold text-white leading-tight">{awayTeam}</span>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="overflow-y-auto flex-1 overscroll-contain pb-1">

          {/* ── VENUE MAP + STADIUM/WEATHER — 2 col on desktop ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* Left: North America map */}
            <div style={{ background: 'linear-gradient(180deg,#080f22 0%,#0c1628 100%)', minHeight: 160 }}>
              <ComposableMap projectionConfig={{ scale: 480, center: [-96, 37] }} style={{ width: '100%', height: 160 }}>
                <Geographies geography={GEO_URL}>
                  {({ geographies }) => geographies.map(geo => (
                    <Geography key={geo.rsmKey} geography={geo} fill="#1a3254" stroke="#080f22" strokeWidth={0.5}
                      style={{ default:{outline:'none'}, hover:{outline:'none'}, pressed:{outline:'none'} }} />
                  ))}
                </Geographies>
                <Marker coordinates={venue.coordinates}>
                  <circle r={32} fill="#f59e0b" opacity={0.05} />
                  <circle r={16} fill="#f59e0b" opacity={0.15} />
                  <circle r={7}  fill="#f59e0b" stroke="#fff" strokeWidth={2} />
                  <circle r={2.5} fill="#fff" />
                </Marker>
              </ComposableMap>
            </div>

            {/* Right: Stadium stats + Weather */}
            <div className="flex flex-col gap-3 p-4">
              {/* Stadium pills */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <IcStadium size={20} />
                  <div>
                    <p className="text-[11px] text-amber-400/70 font-medium">座位容量</p>
                    <p className="text-base font-black text-white">{loading ? '—' : info?.stadiumInfo ? `${(info.stadiumInfo.capacity / 10000).toFixed(1)}万` : '—'}</p>
                  </div>
                </div>
                <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <IcCalendar size={18} />
                  <div>
                    <p className="text-[11px] text-amber-400/70 font-medium">建成年份</p>
                    <p className="text-base font-black text-white">{loading ? '—' : info?.stadiumInfo?.opened ?? '—'}</p>
                  </div>
                </div>
              </div>
              {/* Weather */}
              {!loading && w ? (
                <div className="rounded-xl p-3.5 flex-1 flex flex-col justify-between" style={{ background: 'linear-gradient(135deg,rgba(14,165,233,0.13),rgba(14,165,233,0.05))', border: '1px solid rgba(14,165,233,0.2)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-sky-400/70 font-bold uppercase tracking-widest mb-1">比赛日天气</p>
                      <p className="text-3xl font-black text-white">{w.temp}<span className="text-base font-semibold text-white/50 ml-0.5">°C</span></p>
                      <p className="text-sm font-semibold text-sky-300 mt-0.5">{weatherZh(w.desc)}</p>
                    </div>
                    <div className="text-sky-300">
                      <IcWeather desc={w.desc} size={48} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 pt-2" style={{ borderTop: '1px solid rgba(14,165,233,0.15)' }}>
                    <span className="flex items-center gap-1 text-xs text-sky-400/70"><IcHumidity size={13} />湿度 {w.humidity}%</span>
                    <span className="flex items-center gap-1 text-xs text-sky-400/70"><IcWind size={13} />{w.windspeed} km/h</span>
                    <span className="text-xs text-white/30 ml-auto">↑{w.maxTemp}° ↓{w.minTemp}°</span>
                  </div>
                </div>
              ) : !loading ? (
                <div className="rounded-xl p-3 text-center" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-xs text-white/30">天气预报暂时无法获取</p>
                </div>
              ) : (
                <Skel cls="flex-1 rounded-xl" />
              )}
            </div>
          </div>

          {/* ── TEAM LOGISTICS + BASE ── */}
          <div className="px-5 pt-5 pb-1">
            <SectionHeader label="赛程轨迹 · 驻地信息" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teams.map(({ name, flag, base, log }) => (
                <div key={name} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {/* Team header */}
                  <div className="flex items-center gap-2.5 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {flag && <img src={flag} alt={name} className="w-8 h-5 object-cover rounded-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.6)' }} />}
                    <span className="text-sm font-bold text-white">{name}</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Base camp */}
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.14)' }}>
                      <span className="shrink-0 mt-0.5"><IcBase size={15} /></span>
                      <div>
                        <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wider mb-0.5">世界杯驻地</p>
                        {base
                          ? <><p className="text-sm font-semibold text-white/90 leading-tight">{base.city}</p>
                            <p className="text-xs text-white/40 mt-0.5">{base.facility}</p></>
                          : <p className="text-xs text-white/30 italic">驻地信息待公布</p>
                        }
                      </div>
                    </div>
                    {/* Travel logistics */}
                    {loading ? (
                      <div className="space-y-2"><Skel cls="h-4 w-full" /><Skel cls="h-4 w-4/5" /></div>
                    ) : log ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2.5">
                          <span className="shrink-0 mt-0.5 text-white/30"><IcLocation size={12} /></span>
                          <span className="text-xs text-white/45 leading-snug">上一场：{log.prevCity} · {log.prevStadium}</span>
                        </div>
                        <div className="flex items-center gap-5 pl-0.5">
                          <div className="flex items-center gap-2">
                            <IcDistance size={16} />
                            <div>
                              <p className="text-xs text-amber-400/60 font-medium">移动距离</p>
                              <p className="text-sm font-bold text-amber-300">{log.distanceKm.toLocaleString()} km</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <IcRest size={16} />
                            <div>
                              <p className="text-xs text-indigo-400/60 font-medium">休息天数</p>
                              <p className="text-sm font-bold text-indigo-300">{log.restDays} 天</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-white/25 italic pl-0.5">本届首场出赛</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── COUNTRY CARDS ── */}
          <div className="px-5 pt-5 pb-6">
            <SectionHeader label="参赛国简介" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map(({ name, flag, iso, region, geo, wiki }) => (
                <div key={name} className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {/* Country header */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-3.5">
                    <div className="flex items-center gap-3">
                      {flag && <img src={flag} alt={name} className="w-10 h-6.5 object-cover rounded-md" style={{ boxShadow: '0 3px 10px rgba(0,0,0,0.6)' }} />}
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{name}</p>
                        {region && <p className="text-[10px] text-amber-400/60 font-semibold mt-0.5">{region}</p>}
                      </div>
                    </div>
                    <span className="opacity-30"><IcGlobe size={16} /></span>
                  </div>

                  {/* World map with country highlighted */}
                  <CountryMiniMap iso={iso} name={name} />

                  {/* Geographic stats */}
                  {geo && (
                    <div className="grid grid-cols-3 gap-0 mx-4 my-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      {[
                        { label: '首都', val: geo.capital },
                        { label: '人口', val: geo.population },
                        { label: '面积', val: geo.area },
                      ].map(({ label, val }, i) => (
                        <div key={label} className="flex flex-col items-center py-2.5 px-1" style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : undefined, background: 'rgba(255,255,255,0.03)' }}>
                          <p className="text-[9px] text-white/35 font-bold uppercase tracking-wider">{label}</p>
                          <p className="text-xs font-bold text-white/80 mt-0.5 text-center leading-tight">{val}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Wikipedia summary */}
                  <div className="px-4 pb-4 flex-1">
                    {loading ? (
                      <div className="space-y-1.5">
                        <Skel cls="h-2.5 w-full" /><Skel cls="h-2.5 w-11/12" />
                        <Skel cls="h-2.5 w-4/5" /><Skel cls="h-2.5 w-3/4" />
                        <Skel cls="h-2.5 w-3/5" />
                      </div>
                    ) : wiki ? (
                      <p className="text-xs text-white/45 leading-relaxed">{wiki}</p>
                    ) : (
                      <p className="text-xs text-white/20 italic">暂无简介</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── FOOTER ── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.09)', background: 'rgba(0,0,0,0.25)' }}>
          <span className="flex items-center gap-1.5 text-xs text-white/35 font-semibold">
            <IcLocation size={12} />{venue.city}
          </span>
          <a href={isCN ? amapUrl : gmapsUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs font-bold transition-colors" style={{ color: '#f59e0b' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')}
            onMouseLeave={e => (e.currentTarget.style.color = '#f59e0b')}>
            在地图中打开 →
          </a>
        </div>

      </div>
    </div>,
    document.body
  )
}
