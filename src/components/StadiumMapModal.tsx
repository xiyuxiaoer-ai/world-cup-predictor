'use client'

import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { getFlagUrl } from '@/lib/flags'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// TLA → ISO 3166-1 numeric (zero-padded 3-digit string) used by world-atlas
const TLA_TO_ISO: Record<string, string> = {
  // Americas
  MEX: '484', USA: '840', CAN: '124', BRA: '076', ARG: '032',
  COL: '170', URU: '858', URY: '858', ECU: '218', PAR: '600', BOL: '068',
  VEN: '862', CHI: '152', PER: '604', CRC: '188', PAN: '591',
  JAM: '388', HON: '340', SLV: '222', GUA: '320', TRI: '780', CUB: '192',
  HAI: '332', NCA: '558', DOM: '214', SUR: '740', GUY: '328',
  // Europe
  FRA: '250', GER: '276', ESP: '724', ENG: '826', POR: '620',
  NED: '528', BEL: '056', ITA: '380', CRO: '191', SRB: '688',
  SUI: '756', DEN: '208', AUT: '040', SVK: '703', SCO: '826',
  TUR: '792', POL: '616', ROU: '642', UKR: '804', HUN: '348',
  SVN: '705', GRE: '300', GEO: '268', WAL: '826', NIR: '826',
  CZE: '203', NOR: '578', SWE: '752', ISL: '352', FIN: '246',
  BIH: '070', MKD: '807', ALB: '008', MNE: '499', LUX: '442',
  ARM: '051', IRL: '372', CYP: '196',
  // Africa
  MAR: '504', SEN: '686', EGY: '818', CMR: '120', NGA: '566',
  CIV: '384', ALG: '012', TUN: '788', MLI: '466', RSA: '710',
  GHA: '288', ZIM: '716', MOZ: '508', UGA: '800', TAN: '834',
  COD: '180', ZAM: '894', CPV: '132', GUI: '324', KEN: '404',
  ANG: '024', GAB: '266', NIG: '562', ETH: '231',
  // Asia
  JPN: '392', KOR: '410', AUS: '036', QAT: '634', UZB: '860',
  IRN: '364', KSA: '682', CHN: '156', IND: '356', THA: '764',
  JOR: '400', IRQ: '368', KUW: '414', IDN: '360', VIE: '704',
  // Oceania
  NZL: '554', FIJ: '242',
}

interface Props {
  homeTla: string
  awayTla: string
  homeTeam: string
  awayTeam: string
  venue: { stadium: string; city: string; coordinates: [number, number] }
  onClose: () => void
}

export default function StadiumMapModal({ homeTla, awayTla, homeTeam, awayTeam, venue, onClose }: Props) {
  const homeIso = TLA_TO_ISO[homeTla?.toUpperCase()] ?? null
  const awayIso = TLA_TO_ISO[awayTla?.toUpperCase()] ?? null
  const highlighted = new Set([homeIso, awayIso].filter(Boolean) as string[])

  const homeFlagUrl = getFlagUrl(homeTla)
  const awayFlagUrl = getFlagUrl(awayTla)

  const isMainlandChina = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Shanghai'
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${venue.coordinates[1]},${venue.coordinates[0]}`
  const amapUrl = `https://www.amap.com/search?query=${encodeURIComponent(venue.stadium + ' ' + venue.city)}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {homeFlagUrl && <img src={homeFlagUrl} alt={homeTeam} className="w-6 h-4 object-cover rounded-sm" />}
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{homeTeam}</span>
            </div>
            <span className="text-gray-300 dark:text-gray-600 text-xs">vs</span>
            <div className="flex items-center gap-1.5">
              {awayFlagUrl && <img src={awayFlagUrl} alt={awayTeam} className="w-6 h-4 object-cover rounded-sm" />}
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{awayTeam}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none ml-3">✕</button>
        </div>

        {/* Map */}
        <div className="bg-sky-50 dark:bg-gray-800">
          <ComposableMap
            projectionConfig={{ scale: 140, center: [0, 20] }}
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isHome = geo.id === homeIso
                  const isAway = geo.id === awayIso
                  const isBoth = isHome && isAway
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={
                        isBoth ? '#f59e0b'
                        : isHome ? '#fbbf24'
                        : isAway ? '#fbbf24'
                        : '#cbd5e1'
                      }
                      stroke="#ffffff"
                      strokeWidth={0.4}
                      style={{ default: { outline: 'none' } }}
                    />
                  )
                })
              }
            </Geographies>

            {/* Stadium marker */}
            <Marker coordinates={venue.coordinates}>
              <circle r={5} fill="#ef4444" stroke="#ffffff" strokeWidth={2} />
              <circle r={9} fill="#ef444430" />
            </Marker>
          </ComposableMap>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block shrink-0" />
              参赛国
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block shrink-0" />
              {venue.stadium} · {venue.city}
            </span>
          </div>
          <a
            href={isMainlandChina ? amapUrl : gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-500 hover:text-amber-600 font-medium shrink-0"
          >
            {isMainlandChina ? '在高德地图打开 →' : '在地图中打开 →'}
          </a>
        </div>
      </div>
    </div>
  )
}
