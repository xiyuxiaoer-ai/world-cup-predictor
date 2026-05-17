const TLA_TO_ISO2: Record<string, string> = {
  // Americas
  MEX: 'mx', USA: 'us', CAN: 'ca', BRA: 'br', ARG: 'ar',
  COL: 'co', URU: 'uy', ECU: 'ec', PAR: 'py', BOL: 'bo',
  VEN: 've', CHI: 'cl', PER: 'pe', CRC: 'cr', PAN: 'pa',
  JAM: 'jm', HON: 'hn', SLV: 'sv',
  // Europe
  FRA: 'fr', GER: 'de', ESP: 'es', ENG: 'gb-eng', POR: 'pt',
  NED: 'nl', BEL: 'be', ITA: 'it', CRO: 'hr', SRB: 'rs',
  SUI: 'ch', DEN: 'dk', AUT: 'at', SVK: 'sk', SCO: 'gb-sct',
  TUR: 'tr', POL: 'pl', ROU: 'ro', UKR: 'ua', HUN: 'hu',
  SVN: 'si', GRE: 'gr', GEO: 'ge', WAL: 'gb-wls', NIR: 'gb',
  CZE: 'cz',
  // Africa
  MAR: 'ma', SEN: 'sn', EGY: 'eg', CMR: 'cm', NGA: 'ng',
  CIV: 'ci', ALG: 'dz', TUN: 'tn', MLI: 'ml', RSA: 'za',
  GHA: 'gh', ZIM: 'zw', MOZ: 'mz', UGA: 'ug', TAN: 'tz',
  // Asia
  JPN: 'jp', KOR: 'kr', AUS: 'au', QAT: 'qa', UZB: 'uz',
  IRN: 'ir', KSA: 'sa', CHN: 'cn', IND: 'in', THA: 'th',
  // Oceania
  NZL: 'nz',
}

export function getFlagUrl(tla: string | null | undefined): string | null {
  if (!tla) return null
  const iso2 = TLA_TO_ISO2[tla.toUpperCase()]
  if (!iso2) return null
  return `https://flagcdn.com/w40/${iso2}.png`
}

export function getTeamDisplay(tla: string | null | undefined, fullName: string): string {
  return tla ?? fullName.slice(0, 3).toUpperCase()
}
