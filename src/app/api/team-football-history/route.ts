import { NextRequest, NextResponse } from 'next/server'

const WIKI_ZH = 'https://zh.wikipedia.org/w/api.php'
const UA = 'WorldCupPredictor/1.0 (zhou-qiaofeng@sysj.co.jp)'

const TLA_TO_WIKI: Record<string, string> = {
  ARG: '阿根廷国家足球队',
  BRA: '巴西国家足球队',
  FRA: '法国国家足球队',
  GER: '德国国家足球队',
  ENG: '英格兰国家足球队',
  ESP: '西班牙国家足球队',
  ITA: '意大利国家足球队',
  POR: '葡萄牙国家足球队',
  NED: '荷兰国家足球队',
  BEL: '比利时国家足球队',
  MEX: '墨西哥国家足球队',
  USA: '美国国家足球队',
  CAN: '加拿大男子国家足球队',
  URU: '乌拉圭国家足球队',
  URY: '乌拉圭国家足球队',
  COL: '哥伦比亚国家足球队',
  ECU: '厄瓜多尔国家足球队',
  CRO: '克罗地亚国家足球队',
  SRB: '塞尔维亚国家足球队',
  SUI: '瑞士国家足球队',
  DEN: '丹麦国家足球队',
  JPN: '日本国家足球队',
  KOR: '韩国国家足球队',
  MAR: '摩洛哥国家足球队',
  SEN: '塞内加尔国家足球队',
  NGA: '尼日利亚国家足球队',
  CMR: '喀麦隆国家足球队',
  GHA: '加纳国家足球队',
  IRN: '伊朗国家足球队',
  KSA: '沙特阿拉伯国家足球队',
  AUS: '澳大利亚国家足球队',
  QAT: '卡塔尔国家足球队',
  POL: '波兰国家足球队',
  TUR: '土耳其国家足球队',
  SVK: '斯洛伐克国家足球队',
  ROU: '罗马尼亚国家足球队',
  UKR: '乌克兰国家足球队',
  SCO: '苏格兰国家足球队',
  WAL: '威尔士国家足球队',
  AUT: '奥地利国家足球队',
  CZE: '捷克国家足球队',
  HUN: '匈牙利国家足球队',
  SVN: '斯洛文尼亚国家足球队',
  GEO: '格鲁吉亚国家足球队',
  ALG: '阿尔及利亚国家足球队',
  TUN: '突尼斯国家足球队',
  EGY: '埃及国家足球队',
  CIV: '科特迪瓦国家足球队',
  RSA: '南非国家足球队',
  MLI: '马里国家足球队',
  NZL: '新西兰国家足球队',
  PAR: '巴拉圭国家足球队',
  CHI: '智利国家足球队',
  CRC: '哥斯达黎加国家足球队',
  PAN: '巴拿马国家足球队',
  JAM: '牙买加国家足球队',
  NOR: '挪威国家足球队',
  SWE: '瑞典国家足球队',
  BOL: '玻利维亚国家足球队',
  VEN: '委内瑞拉国家足球队',
  PER: '秘鲁国家足球队',
  GRE: '希腊国家足球队',
}

interface ParsedSection { title: string; content: string }

function parseExtract(text: string): ParsedSection[] {
  const sections: ParsedSection[] = []
  const lines = text.split('\n')
  let title = '__intro__'
  let buf: string[] = []
  for (const line of lines) {
    const m = line.match(/^={2,4}\s*(.+?)\s*={2,4}$/)
    if (m) {
      sections.push({ title, content: buf.join('\n').trim() })
      title = m[1]
      buf = []
    } else {
      buf.push(line)
    }
  }
  sections.push({ title, content: buf.join('\n').trim() })
  return sections
}

function findSection(sections: ParsedSection[], keywords: string[]): string {
  for (const kw of keywords) {
    const s = sections.find(sec => sec.title.includes(kw))
    if (s?.content && s.content.length > 30) return s.content
  }
  return ''
}

interface RawPlayer { name: string; description: string }

const STOP_WORDS = new Set([
  '历史', '球员', '成就', '著名', '知名', '出场', '进球', '年代',
  '世界', '欧洲', '亚洲', '美洲', '非洲', '联赛', '国家', '足球',
  '赛事', '冠军', '球队', '以下', '注意', '参见', '参考', '外部',
])

function extractPlayers(legendText: string): RawPlayer[] {
  if (!legendText) return []
  const players: RawPlayer[] = []
  const seen = new Set<string>()

  // Strategy 1: paragraph blocks (name on its own line then description)
  const blocks = legendText.split(/\n{2,}/).filter(b => b.trim().length > 5)
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.replace(/^[\s*•·\-\d.]+/, '').trim()).filter(Boolean)
    if (!lines[0]) continue
    const m = lines[0].match(/^([一-鿿·]{2,10})(?:[（(：:\s]|$)/)
    if (!m || STOP_WORDS.has(m[1])) continue
    const name = m[1]
    if (seen.has(name)) continue
    seen.add(name)
    const rest = lines[0].slice(m[0].length) + ' ' + lines.slice(1).join(' ')
    players.push({ name, description: rest.trim().slice(0, 220) })
  }

  // Strategy 2: bullet/list lines
  if (players.length < 5) {
    for (const line of legendText.split('\n')) {
      const raw = line.replace(/^[\s*•·\-\d.]+/, '').trim()
      if (!raw) continue
      const m = raw.match(/^([一-鿿·]{2,10})[（(](.+?)[)）](.{0,100})/)
      if (m) {
        const name = m[1]
        if (seen.has(name) || STOP_WORDS.has(name)) continue
        seen.add(name)
        const desc = `${m[2]} ${m[3]}`.trim().slice(0, 220)
        players.push({ name, description: desc })
      }
    }
  }

  return players.slice(0, 20)
}

export async function GET(req: NextRequest) {
  const tla = req.nextUrl.searchParams.get('tla')?.toUpperCase()
  if (!tla) return NextResponse.json({ error: 'Missing tla' }, { status: 400 })

  const wikiTitle = TLA_TO_WIKI[tla]
  if (!wikiTitle) return NextResponse.json({ error: 'No Wikipedia data for this team' }, { status: 404 })

  const wikiUrl = `https://zh.wikipedia.org/wiki/${encodeURIComponent(wikiTitle)}`
  const headers = { 'User-Agent': UA }

  try {
    // 1. Fetch full article extract + team main image
    const articleUrl = `${WIKI_ZH}?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=extracts|pageimages&format=json&explaintext=1&exlimit=1&pithumbsize=400&redirects=1`
    const articleResp = await fetch(articleUrl, { headers, next: { revalidate: 86400 } })
    const articleData = await articleResp.json()

    const pages = articleData?.query?.pages ?? {}
    const page = Object.values(pages)[0] as any
    if (!page || page.missing) {
      return NextResponse.json({ error: 'Wikipedia page not found' }, { status: 404 })
    }

    const fullText: string = page.extract ?? ''
    const teamImageUrl: string | undefined = page.thumbnail?.source

    // 2. Parse sections
    const sections = parseExtract(fullText)
    const intro = sections.find(s => s.title === '__intro__')?.content ?? ''
    const historyText = findSection(sections, ['历史', '队史', '发展历史'])
    const legendsText = findSection(sections, ['著名球员', '知名球员', '著名球星', '历史著名', '代表性球员', '球员荣誉'])
    const worldCupText = findSection(sections, ['世界杯', '世界杯历史', '世界杯战绩', '历届赛事', '国际大赛成绩', '赛事成绩', '历届成绩'])

    // 3. Extract players from legends section (fall back to history if needed)
    let rawPlayers = extractPlayers(legendsText)
    if (rawPlayers.length < 3) rawPlayers = extractPlayers(historyText)

    // 4. Batch fetch player images from Wikipedia zh
    const playerImages: Record<string, string> = {}
    if (rawPlayers.length > 0) {
      const titles = rawPlayers.map(p => p.name).join('|')
      const imgUrl = `${WIKI_ZH}?action=query&titles=${encodeURIComponent(titles)}&prop=pageimages&format=json&pithumbsize=200&redirects=1`
      try {
        const imgResp = await fetch(imgUrl, { headers, next: { revalidate: 86400 } })
        const imgData = await imgResp.json()
        const imgPages: any[] = Object.values(imgData?.query?.pages ?? {})
        for (const p of imgPages) {
          if (p.thumbnail?.source) playerImages[p.title] = p.thumbnail.source
        }
      } catch {
        // Images are optional – continue without them
      }

      // For players without images, try appending disambiguation suffix
      const missing = rawPlayers.filter(p => !playerImages[p.name])
      if (missing.length > 0) {
        const disambigTitles = missing.map(p => `${p.name}（足球运动员）`).join('|')
        try {
          const d2Url = `${WIKI_ZH}?action=query&titles=${encodeURIComponent(disambigTitles)}&prop=pageimages&format=json&pithumbsize=200&redirects=1`
          const d2Resp = await fetch(d2Url, { headers, next: { revalidate: 86400 } })
          const d2Data = await d2Resp.json()
          const d2Pages: any[] = Object.values(d2Data?.query?.pages ?? {})
          for (const p of d2Pages) {
            if (p.thumbnail?.source) {
              // Map back to original player name
              const origName = p.title.replace(/（足球运动员）$/, '')
              playerImages[origName] = p.thumbnail.source
            }
          }
        } catch { /* ignore */ }
      }
    }

    const players = rawPlayers.map(p => ({
      name: p.name,
      description: p.description,
      imageUrl: playerImages[p.name],
      wikiUrl: `https://zh.wikipedia.org/wiki/${encodeURIComponent(p.name)}`,
    }))

    // 5. Trim text lengths for API response size
    const trimIntro = (s: string, maxLen: number) =>
      s.length <= maxLen ? s : s.slice(0, maxLen).replace(/[^一-鿿。！？，\w]+$/, '') + '……'

    return NextResponse.json({
      intro: trimIntro(intro, 800),
      historyText: trimIntro(historyText, 1200),
      legendsText: trimIntro(legendsText, 300),
      worldCupText: trimIntro(worldCupText, 1000),
      players,
      teamImageUrl,
      wikiTitle,
      wikiUrl,
    }, {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' }
    })
  } catch (err) {
    console.error('[team-football-history]', err)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
