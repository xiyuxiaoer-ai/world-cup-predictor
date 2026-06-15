const TLA_TO_ISO2: Record<string, string> = {
  // Americas
  MEX: 'mx', USA: 'us', CAN: 'ca', BRA: 'br', ARG: 'ar',
  COL: 'co', URU: 'uy', URY: 'uy', ECU: 'ec', PAR: 'py', BOL: 'bo',
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
  NZL: 'nz', FIJ: 'fj', PNG: 'pg', SOL: 'sb', VAN: 'vu', NCL: 'nc',
  // Europe (extra)
  NOR: 'no', BIH: 'ba', MKD: 'mk', ALB: 'al', MNE: 'me', ISL: 'is',
  FIN: 'fi', LUX: 'lu', KVX: 'xk', ARM: 'am', IRL: 'ie', CYP: 'cy',
  // Asia (extra)
  JOR: 'jo', IRQ: 'iq', SYR: 'sy', LBN: 'lb', BHR: 'bh', OMA: 'om',
  KUW: 'kw', YEM: 'ye', PAL: 'ps', IDN: 'id', VIE: 'vn', PHI: 'ph',
  MYA: 'mm', PRK: 'kp', TJK: 'tj', KGZ: 'kg', TKM: 'tm', AFG: 'af',
  // Africa (extra)
  COD: 'cd', ZAM: 'zm', CPV: 'cv', GUI: 'gn', KEN: 'ke', ANG: 'ao',
  COM: 'km', BEN: 'bj', BFA: 'bf', GAB: 'ga', EQG: 'gq', LBR: 'lr',
  SLE: 'sl', GNB: 'gw', NIG: 'ne', CHA: 'td', ETH: 'et', SOM: 'so',
  // Americas (extra)
  CUB: 'cu', TRI: 'tt', HAI: 'ht', SUR: 'sr', GUY: 'gy', CUW: 'cw',
  GUA: 'gt', NCA: 'ni', DOM: 'do', PUR: 'pr', MTQ: 'mq', CUR: 'cw', SWE: 'se',
}

const TLA_TO_ZH: Record<string, string> = {
  // 美洲
  MEX: '墨西哥', USA: '美国', CAN: '加拿大', BRA: '巴西', ARG: '阿根廷',
  COL: '哥伦比亚', URU: '乌拉圭', URY: '乌拉圭', ECU: '厄瓜多尔', PAR: '巴拉圭', BOL: '玻利维亚',
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
  NZL: '新西兰', FIJ: '斐济', PNG: '巴布亚新几内亚', SOL: '所罗门群岛', VAN: '瓦努阿图',
  // 欧洲（补充）
  NOR: '挪威', BIH: '波黑', MKD: '北马其顿', ALB: '阿尔巴尼亚', MNE: '黑山',
  ISL: '冰岛', FIN: '芬兰', LUX: '卢森堡', KVX: '科索沃', ARM: '亚美尼亚',
  IRL: '爱尔兰', CYP: '塞浦路斯',
  // 亚洲（补充）
  JOR: '约旦', IRQ: '伊拉克', SYR: '叙利亚', LBN: '黎巴嫩', BHR: '巴林',
  OMA: '阿曼', KUW: '科威特', IDN: '印度尼西亚', VIE: '越南', PHI: '菲律宾',
  MYA: '缅甸', PRK: '朝鲜', TJK: '塔吉克', KGZ: '吉尔吉斯', TKM: '土库曼',
  // 非洲（补充）
  COD: '刚果金', ZAM: '赞比亚', CPV: '佛得角', GUI: '几内亚', KEN: '肯尼亚',
  ANG: '安哥拉', COM: '科摩罗', BEN: '贝宁', BFA: '布基纳法索', GAB: '加蓬',
  EQG: '赤道几内亚', NIG: '尼日尔', ETH: '埃塞俄比亚',
  // 美洲（补充）
  CUB: '古巴', TRI: '特多', HAI: '海地', SUR: '苏里南', GUY: '圭亚那',
  GUA: '危地马拉', NCA: '尼加拉瓜', DOM: '多米尼加', CUR: '库拉索', SWE: '瑞典',
}

const TLA_TO_JA: Record<string, string> = {
  // Americas
  MEX: 'メキシコ', USA: 'アメリカ', CAN: 'カナダ', BRA: 'ブラジル', ARG: 'アルゼンチン',
  COL: 'コロンビア', URU: 'ウルグアイ', URY: 'ウルグアイ', ECU: 'エクアドル', PAR: 'パラグアイ', BOL: 'ボリビア',
  VEN: 'ベネズエラ', CHI: 'チリ', PER: 'ペルー', CRC: 'コスタリカ', PAN: 'パナマ',
  JAM: 'ジャマイカ', HON: 'ホンジュラス', SLV: 'エルサルバドル',
  GUA: 'グアテマラ', NCA: 'ニカラグア', DOM: 'ドミニカ共和国', TRI: 'トリニダード・トバゴ',
  CUB: 'キューバ', HAI: 'ハイチ', SUR: 'スリナム', GUY: 'ガイアナ', CUR: 'キュラソー',
  // Europe
  FRA: 'フランス', GER: 'ドイツ', ESP: 'スペイン', ENG: 'イングランド', POR: 'ポルトガル',
  NED: 'オランダ', BEL: 'ベルギー', ITA: 'イタリア', CRO: 'クロアチア', SRB: 'セルビア',
  SUI: 'スイス', DEN: 'デンマーク', AUT: 'オーストリア', SVK: 'スロバキア', SCO: 'スコットランド',
  TUR: 'トルコ', POL: 'ポーランド', ROU: 'ルーマニア', UKR: 'ウクライナ', HUN: 'ハンガリー',
  SVN: 'スロベニア', GRE: 'ギリシャ', GEO: 'ジョージア', WAL: 'ウェールズ', NIR: '北アイルランド',
  CZE: 'チェコ', NOR: 'ノルウェー', BIH: 'ボスニア・ヘルツェゴビナ', MKD: '北マケドニア',
  ALB: 'アルバニア', MNE: 'モンテネグロ', ISL: 'アイスランド', FIN: 'フィンランド',
  LUX: 'ルクセンブルク', KVX: 'コソボ', ARM: 'アルメニア', IRL: 'アイルランド', CYP: 'キプロス',
  SWE: 'スウェーデン',
  // Africa
  MAR: 'モロッコ', SEN: 'セネガル', EGY: 'エジプト', CMR: 'カメルーン', NGA: 'ナイジェリア',
  CIV: 'コートジボワール', ALG: 'アルジェリア', TUN: 'チュニジア', MLI: 'マリ', RSA: '南アフリカ',
  GHA: 'ガーナ', ZIM: 'ジンバブエ', MOZ: 'モザンビーク', UGA: 'ウガンダ', TAN: 'タンザニア',
  COD: 'コンゴ民主共和国', ZAM: 'ザンビア', CPV: 'カーボベルデ', GUI: 'ギニア', KEN: 'ケニア',
  ANG: 'アンゴラ', GAB: 'ガボン', NIG: 'ニジェール', ETH: 'エチオピア',
  BEN: 'ベナン', BFA: 'ブルキナファソ', EQG: '赤道ギニア', COM: 'コモロ',
  // Asia
  JPN: '日本', KOR: '韓国', AUS: 'オーストラリア', QAT: 'カタール', UZB: 'ウズベキスタン',
  IRN: 'イラン', KSA: 'サウジアラビア', CHN: '中国', IND: 'インド', THA: 'タイ',
  JOR: 'ヨルダン', IRQ: 'イラク', KUW: 'クウェート', IDN: 'インドネシア', VIE: 'ベトナム',
  // Oceania
  NZL: 'ニュージーランド', FIJ: 'フィジー',
}

export function getTeamJa(tla: string | null | undefined): string | null {
  if (!tla) return null
  return TLA_TO_JA[tla.toUpperCase()] ?? null
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
