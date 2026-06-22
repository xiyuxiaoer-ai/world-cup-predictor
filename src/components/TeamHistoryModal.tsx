'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'

const STAGE_LABELS: Record<string, string> = {
  group: '小组赛', round_of_32: '32强', round_of_16: '16强',
  quarter_final: '八强', semi_final: '四强', third_place: '季军赛', final: '决赛',
}

const POSITION_LABELS: Record<string, string> = {
  GK: '门将', DEF: '后卫', MID: '中场', FWD: '前锋',
  HEAD_COACH: '主教练', ASST_COACH: '助理教练', COACH: '教练组',
}

const POSITION_ORDER = ['HEAD_COACH', 'ASST_COACH', 'COACH', 'GK', 'DEF', 'MID', 'FWD']

function resultTag(isHome: boolean, homeScore: number, awayScore: number) {
  const won = isHome ? homeScore > awayScore : awayScore > homeScore
  const lost = isHome ? homeScore < awayScore : awayScore < homeScore
  if (won) return <span className="text-xs font-bold text-green-500 w-4 shrink-0">W</span>
  if (lost) return <span className="text-xs font-bold text-red-400 w-4 shrink-0">L</span>
  return <span className="text-xs font-bold text-gray-400 w-4 shrink-0">D</span>
}

export default function TeamHistoryModal({
  tla,
  teamName,
  onClose,
  defaultTab = 'history',
}: {
  tla: string
  teamName: string
  onClose: () => void
  defaultTab?: 'history' | 'squad' | 'news'
}) {
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<'history' | 'squad' | 'news'>(defaultTab)
  const [historyData, setHistoryData] = useState<{ wc: any[]; friendly: any[] } | null>(null)
  const [squadData, setSquadData] = useState<any[] | null>(null)
  const [newsData, setNewsData] = useState<any[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [squadLoading, setSquadLoading] = useState(false)
  const [newsLoading, setNewsLoading] = useState(false)
  const flagUrl = getFlagUrl(tla)
  const displayName = getTeamDisplay(tla, teamName)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    setHistoryLoading(true)
    fetch(`/api/team-history?tla=${tla}`)
      .then(r => r.json())
      .then(d => { setHistoryData(d); setHistoryLoading(false) })
  }, [tla])

  useEffect(() => {
    if (tab !== 'squad' || squadData !== null) return
    setSquadLoading(true)
    fetch(`/api/team-squad?tla=${tla}`)
      .then(r => r.json())
      .then(d => { setSquadData(Array.isArray(d) ? d : []); setSquadLoading(false) })
  }, [tab, tla, squadData])

  useEffect(() => {
    if (tab !== 'news' || newsData !== null) return
    setNewsLoading(true)
    fetch(`/api/team-news?name=${encodeURIComponent(getTeamDisplay(tla, teamName))}`)
      .then(r => r.json())
      .then(d => { setNewsData(Array.isArray(d) ? d : []); setNewsLoading(false) })
      .catch(() => { setNewsData([]); setNewsLoading(false) })
  }, [tab, tla, teamName, newsData])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm glass rounded-2xl overflow-hidden max-h-[80vh] flex flex-col animate-spring-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/40 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            {flagUrl && <img src={flagUrl} alt="" className="w-8 h-6 object-cover rounded" />}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{displayName}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/40 dark:border-white/10">
          {(['history', 'squad', 'news'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-amber-500 border-b-2 border-amber-500'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t === 'history' ? '历史战绩' : t === 'squad' ? '世界杯名单' : '最新动态'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {tab === 'history' && (
            historyLoading ? (
              <div className="p-6 text-center text-gray-400 text-sm">加载中...</div>
            ) : (
              <>
                <Section title="2026世界杯" matches={historyData?.wc || []} tla={tla} isWC />
                <Section title="热身赛" matches={historyData?.friendly || []} tla={tla} isWC={false} />
              </>
            )
          )}

          {tab === 'squad' && (
            squadLoading ? (
              <div className="p-6 text-center text-gray-400 text-sm">加载中...</div>
            ) : !squadData || squadData.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">暂无名单数据</div>
            ) : (
              <SquadList squad={squadData} />
            )
          )}

          {tab === 'news' && (
            newsLoading ? (
              <div className="p-6 text-center text-gray-400 text-sm">加载中...</div>
            ) : !newsData || newsData.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">暂无新闻</div>
            ) : (
              <NewsList items={newsData} />
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function Section({ title, matches, tla, isWC }: { title: string; matches: any[]; tla: string; isWC: boolean }) {
  return (
    <div>
      <div className="px-5 py-2 border-b border-gray-200/70 dark:border-white/10">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      {matches.length === 0 ? (
        <div className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500">暂无记录</div>
      ) : (
        <div className="divide-y divide-white/30 dark:divide-white/10">
          {matches.map((m: any, idx: number) => {
            const isHome = m.home_tla?.toUpperCase() === tla
            const opponentTla = isHome ? m.away_tla : m.home_tla
            const opponentName = isHome ? m.away_team : m.home_team
            const opponent = getTeamDisplay(opponentTla, opponentName)
            const opponentFlag = getFlagUrl(opponentTla)
            const homeScore = isWC ? m.home_score_90 : m.home_score
            const awayScore = isWC ? m.away_score_90 : m.away_score
            const myScore = isHome ? homeScore : awayScore
            const theirScore = isHome ? awayScore : homeScore
            const dateStr = isWC
              ? new Date(m.kickoff_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
              : new Date(m.match_date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
            const stageLabel = isWC ? STAGE_LABELS[m.stage] || m.stage : m.competition

            return (
              <div key={idx} className="flex items-center gap-2.5 px-5 py-2.5">
                {resultTag(isHome, homeScore, awayScore)}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {opponentFlag && <img src={opponentFlag} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />}
                  <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{opponent}</span>
                </div>
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100 shrink-0">
                  {myScore}–{theirScore}
                </span>
                <div className="text-right shrink-0 w-16">
                  <div className="text-xs text-gray-400 dark:text-gray-500">{dateStr}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{stageLabel}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return '刚刚'
  if (h < 24) return `${h}小时前`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}天前`
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function NewsList({ items }: { items: any[] }) {
  return (
    <div className="divide-y divide-white/30 dark:divide-white/10">
      {items.map((item, idx) => (
        <a
          key={idx}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-1 px-5 py-3 hover:bg-white/20 dark:hover:bg-white/5 transition-colors tap-scale"
        >
          <span className="text-sm text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
            {item.title}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
            {item.source && (
              <span className="font-medium text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                {item.source}
              </span>
            )}
            {item.source && item.pubDate && <span>·</span>}
            {item.pubDate && <span>{timeAgo(item.pubDate)}</span>}
            <span className="ml-auto shrink-0">↗</span>
          </div>
        </a>
      ))}
    </div>
  )
}

function SquadList({ squad }: { squad: any[] }) {
  const grouped: Record<string, any[]> = {}
  for (const p of squad) {
    const pos = p.position || 'FWD'
    if (!grouped[pos]) grouped[pos] = []
    grouped[pos].push(p)
  }

  const sections = POSITION_ORDER.filter(pos => grouped[pos]?.length > 0)

  return (
    <div>
      {sections.map(pos => (
        <div key={pos}>
          <div className="px-5 py-2 border-b border-gray-200/70 dark:border-white/10">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {POSITION_LABELS[pos] || pos}
            </span>
          </div>
          <div className="divide-y divide-white/30 dark:divide-white/10">
            {grouped[pos].map((p: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 px-5 py-2.5">
                {p.shirt_number != null ? (
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">{p.shirt_number}</span>
                ) : (
                  <span className="w-5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {p.player_name_zh || p.player_name}
                  </span>
                  {p.player_name_zh && p.player_name !== p.player_name_zh && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">{p.player_name}</span>
                  )}
                </div>
                {p.club && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 truncate max-w-24">{p.club}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
