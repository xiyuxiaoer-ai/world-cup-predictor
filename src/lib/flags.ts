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

const TLA_TO_ZH: Record<string, string> = {
  // 美洲
  MEX: '墨西哥', USA: '美国', CAN: '加拿大', BRA: '巴西', ARG: '阿根廷',
  COL: '哥伦比亚', URU: '乌拉圭', ECU: '厄瓜多尔', PAR: '巴拉圭', BOL: '玻利维亚',
  VEN: '委内瑞拉', CHI: '智利', PER: '秘鲁', CRC: '哥斯达黎加', PAN: '巴拿马',
  JAM: '牙买加', HON: '洪都拉斯', SLV: '萨尔瓦多',
  // 欧洲
  FRA: '法国', GER: '德国', ESP: '西班牙', ENG: '英格兰', POR: '葡萄牙',
  NED: '荷兰', BEL: '比利时', ITA: '意大利', CRO: '克罗地亚', SRB: '塞尔维亚',
  SUI: '瑞士', DEN: '丹麦', AUT: '奥地利', SVK: '斯洛伐克', SCO: '苏格兰',
  TUR: '土耳其', POL: '波兰', ROU: '罗马尼亚', UKR: '乌克兰', HUN: '匈牙利',
  SVN: '斯洛文尼亚', GRE: '希腊', GEO: '格鲁吉亚', WAL: '威尔士', NIR: '北爱尔兰',
  CZE: '捷克',
  // 非洲
  MAR: '摩洛哥', SEN: '塞内加尔', EGY: '埃及', CMR: '喀麦隆', NGA: '尼日利亚',
  CIV: '科特迪瓦', ALG: '阿尔及利亚', TUN: '突尼斯', MLI: '马里', RSA: '南非',
  GHA: '加纳', ZIM: '津巴布韦', MOZ: '莫桑比克', UGA: '乌干达', TAN: '坦桑尼亚',
  // 亚洲
  JPN: '日本', KOR: '韩国', AUS: '澳大利亚', QAT: '卡塔尔', UZB: '乌兹别克',
  IRN: '伊朗', KSA: '沙特', CHN: '中国', IND: '印度', THA: '泰国',
  // 大洋洲
  NZL: '新西兰',
}

export function getFlagUrl(tla: string | null | undefined): string | null {
  if (!tla) return null
  const iso2 = TLA_TO_ISO2[tla.toUpperCase()]
  if (!iso2) return null
  return `https://flagcdn.com/w40/${iso2}.png`
}

export function getTeamDisplay(tla: string | null | undefined, fullName: string): string {
  if (!tla) return fullName
  return TLA_TO_ZH[tla.toUpperCase()] ?? fullName
}
