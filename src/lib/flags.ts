const FLAG_MAP: Record<string, string> = {
  // Americas
  MEX: '🇲🇽', USA: '🇺🇸', CAN: '🇨🇦', BRA: '🇧🇷', ARG: '🇦🇷',
  COL: '🇨🇴', URU: '🇺🇾', ECU: '🇪🇨', PAR: '🇵🇾', BOL: '🇧🇴',
  VEN: '🇻🇪', CHI: '🇨🇱', PER: '🇵🇪', CRC: '🇨🇷', PAN: '🇵🇦',
  JAM: '🇯🇲', HON: '🇭🇳', SLV: '🇸🇻',
  // Europe
  FRA: '🇫🇷', GER: '🇩🇪', ESP: '🇪🇸', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', POR: '🇵🇹',
  NED: '🇳🇱', BEL: '🇧🇪', ITA: '🇮🇹', CRO: '🇭🇷', SRB: '🇷🇸',
  SUI: '🇨🇭', DEN: '🇩🇰', AUT: '🇦🇹', SVK: '🇸🇰', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  TUR: '🇹🇷', POL: '🇵🇱', ROU: '🇷🇴', UKR: '🇺🇦', HUN: '🇭🇺',
  SVN: '🇸🇮', GRE: '🇬🇷', GEO: '🇬🇪', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', NIR: '🇬🇧',
  // Africa
  MAR: '🇲🇦', SEN: '🇸🇳', EGY: '🇪🇬', CMR: '🇨🇲', NGA: '🇳🇬',
  CIV: '🇨🇮', ALG: '🇩🇿', TUN: '🇹🇳', MLI: '🇲🇱', RSA: '🇿🇦',
  GHA: '🇬🇭', ZIM: '🇿🇼', MOZ: '🇲🇿', UGA: '🇺🇬', TAN: '🇹🇿',
  // Asia
  JPN: '🇯🇵', KOR: '🇰🇷', AUS: '🇦🇺', QAT: '🇶🇦', UZB: '🇺🇿',
  IRN: '🇮🇷', KSA: '🇸🇦', CHN: '🇨🇳', IND: '🇮🇳', THA: '🇹🇭',
  // Oceania
  NZL: '🇳🇿',
  CZE: '🇨🇿',
}

export function getFlag(tla: string | null | undefined): string {
  if (!tla) return '🏳️'
  return FLAG_MAP[tla.toUpperCase()] ?? '🏳️'
}

export function getTeamDisplay(tla: string | null | undefined, fullName: string): string {
  return tla ?? fullName.slice(0, 3).toUpperCase()
}
