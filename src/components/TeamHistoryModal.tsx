'use client'

import React, { useEffect, useState } from 'react'
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

type TabType = 'history' | 'legend' | 'squad' | 'news'

const TAB_LABELS: Record<TabType, string> = {
  history: '历史战绩',
  legend: '传奇历史',
  squad: '世界杯名单',
  news: '最新动态',
}

function resultTag(isHome: boolean, homeScore: number, awayScore: number) {
  const won = isHome ? homeScore > awayScore : awayScore > homeScore
  const lost = isHome ? homeScore < awayScore : awayScore < homeScore
  if (won) return <span className="text-xs font-bold text-green-500 w-4 shrink-0">W</span>
  if (lost) return <span className="text-xs font-bold text-red-400 w-4 shrink-0">L</span>
  return <span className="text-xs font-bold text-gray-400 w-4 shrink-0">D</span>
}

/* ─── Shimmer Skeleton ─── */
function ShimmerLine({ w = 'w-full' }: { w?: string }) {
  return (
    <div
      className={`h-3 rounded-full ${w} bg-gradient-to-r from-gray-200/60 via-gray-100/90 to-gray-200/60 dark:from-gray-700/60 dark:via-gray-600/80 dark:to-gray-700/60`}
      style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s ease-in-out infinite',
      }}
    />
  )
}

function LegendSkeleton() {
  return (
    <div className="p-5 space-y-5">
      <div className="h-28 rounded-xl bg-gray-100/60 dark:bg-gray-700/40" style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.6s ease-in-out infinite' }} />
      <div className="space-y-2">
        <ShimmerLine w="w-1/3" />
        <ShimmerLine />
        <ShimmerLine w="w-5/6" />
        <ShimmerLine w="w-4/5" />
        <ShimmerLine w="w-3/4" />
      </div>
      <div className="space-y-2">
        <ShimmerLine w="w-1/4" />
        <ShimmerLine />
        <ShimmerLine w="w-5/6" />
      </div>
      <div className="space-y-2">
        <ShimmerLine w="w-1/3" />
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 py-2">
              <div className="w-16 h-16 rounded-xl bg-gray-200/70 dark:bg-gray-700/50" style={{ animation: `shimmer 1.6s ease-in-out ${i * 0.1}s infinite` }} />
              <div className="h-2.5 rounded-full w-12 bg-gray-200/70 dark:bg-gray-700/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Player Card ─── */
function PlayerCard({ player, index }: { player: any; index: number }) {
  const [imgError, setImgError] = useState(false)
  return (
    <a
      href={player.baiduUrl || player.wikiUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl hover:bg-white/40 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 group animate-stagger-in"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="relative w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-xl overflow-hidden shrink-0 ring-1 ring-white/40 dark:ring-white/10 shadow-md">
        {!imgError && player.imageUrl ? (
          <img
            src={player.imageUrl}
            alt={player.name}
            className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-100/80 to-orange-100/60 dark:from-amber-900/40 dark:to-orange-900/20 flex items-center justify-center text-amber-400 dark:text-amber-500">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
              <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M16 3v5M16 24v5M3 16h5M24 16h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.35"/>
              <path d="M16 7 L20 11 L18.5 16 L13.5 16 L12 11 Z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.15"/>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      </div>

      <span className="text-[11px] font-medium text-gray-800 dark:text-gray-200 text-center leading-tight line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
        {player.name}
      </span>
      {player.era && (
        <span className="text-[9px] text-amber-500/80 dark:text-amber-400/70 text-center leading-tight">
          {player.era}
        </span>
      )}
    </a>
  )
}

/* ─── ReadMore ─── */
function ReadMoreText({ text, maxLen }: { text: string; maxLen: number }) {
  const [expanded, setExpanded] = useState(false)
  const needsMore = text.length > maxLen
  const shown = expanded || !needsMore ? text : text.slice(0, maxLen).replace(/[^一-鿿。！？，\w]+$/, '') + '……'
  return (
    <div>
      <p className="text-[13px] sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
        {shown}
      </p>
      {needsMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-1.5 text-[11px] text-amber-500 hover:text-amber-400 font-medium transition-colors"
        >
          {expanded ? '收起 ↑' : '展开全文 ↓'}
        </button>
      )}
    </div>
  )
}

/* ─── Section Block ─── */
function SectionBlock({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-0">
      <div className="px-4 sm:px-5 pt-4 pb-2 flex items-center gap-2">
        {icon && <span className="text-amber-500 dark:text-amber-400 shrink-0">{icon}</span>}
        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</span>
        <div className="flex-1 h-px bg-gray-200/60 dark:bg-white/10" />
      </div>
      <div className="px-4 sm:px-5">{children}</div>
    </div>
  )
}

/* ─── Football Legend Tab ─── */
function FootballLegendTab({ data, teamName }: { data: any; teamName: string }) {
  const { intro, worldCupRecord, goal2026, players } = data

  return (
    <div className="pb-6">
      {intro ? (
        <SectionBlock title="球队历史" icon={<svg viewBox="0 0 16 16" width="13" height="13" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 2v3M8 11v3M2 8h3M11 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/><path d="M8 4.5L10 6.5 9.2 9 6.8 9 6 6.5Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.2"/></svg>}>
          <ReadMoreText text={intro} maxLen={300} />
        </SectionBlock>
      ) : null}

      {worldCupRecord ? (
        <SectionBlock title="世界杯征程" icon={<svg viewBox="0 0 16 16" width="13" height="13" fill="none"><path d="M4 2h8v5a4 4 0 0 1-8 0V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M3 2H2a1 1 0 0 0-1 1v1a3 3 0 0 0 2.5 2.96M13 2h1a1 1 0 0 1 1 1v1a3 3 0 0 1-2.5 2.96" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M8 10v4M6 14h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}>
          <p className="text-[13px] sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{worldCupRecord}</p>
        </SectionBlock>
      ) : null}

      {players && players.length > 0 && (
        <SectionBlock title={`传奇球星（共 ${players.length} 位）`} icon={<svg viewBox="0 0 16 16" width="13" height="13" fill="none"><path d="M8 1.5l1.8 3.8 4.2.6-3 3 .7 4.1L8 11l-3.7 2 .7-4.1-3-3 4.2-.6L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/></svg>}>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 mt-0.5">
            {players.map((p: any, i: number) => (
              <PlayerCard key={p.name} player={p} index={i} />
            ))}
          </div>
          <div className="mt-3 space-y-3">
            {players.filter((p: any) => p.desc).map((p: any, i: number) => (
              <div key={i} className="flex gap-2 text-[11px] leading-snug">
                <span className="font-semibold text-amber-600 dark:text-amber-400 shrink-0 min-w-[5rem]">{p.name}</span>
                <span className="text-gray-600 dark:text-gray-400">{p.desc}</span>
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {goal2026 ? (
        <SectionBlock title="2026世界杯目标" icon={<svg viewBox="0 0 16 16" width="13" height="13" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>}>
          <p className="text-[13px] sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{goal2026}</p>
        </SectionBlock>
      ) : null}

      <div className="px-4 sm:px-5 pt-4">
        <a
          href={`https://baike.baidu.com/search/word?word=${encodeURIComponent(teamName + '国家足球队')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-[12px] font-medium text-gray-600 dark:text-gray-300 glass-sm hover:bg-white/50 dark:hover:bg-white/8 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className="shrink-0 text-gray-500 dark:text-gray-400"><path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9z" stroke="currentColor" strokeWidth="1.3"/><path d="M5 2v12M5 6h5M5 9h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          <span>在百度百科查看完整历史</span>
          <span className="ml-auto text-gray-400 group-hover:translate-x-0.5 transition-transform"><svg viewBox="0 0 12 12" width="10" height="10" fill="none"><path d="M7 1h4v4M11 1L5.5 6.5M5 3H2v7h7V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
        </a>
      </div>
    </div>
  )
}

/* ─── Main Modal ─── */
export default function TeamHistoryModal({
  tla,
  teamName,
  onClose,
  defaultTab = 'history',
}: {
  tla: string
  teamName: string
  onClose: () => void
  defaultTab?: TabType
}) {
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<TabType>(defaultTab)
  const [historyData, setHistoryData] = useState<{ wc: any[]; friendly: any[] } | null>(null)
  const [squadData, setSquadData] = useState<any[] | null>(null)
  const [newsData, setNewsData] = useState<any[] | null>(null)
  const [legendData, setLegendData] = useState<any | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [squadLoading, setSquadLoading] = useState(false)
  const [newsLoading, setNewsLoading] = useState(false)
  const [legendLoading, setLegendLoading] = useState(false)
  const [legendError, setLegendError] = useState(false)
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
    fetch(`/api/team-squad?tla=${tla}&_v=2`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setSquadData(Array.isArray(d) ? d : []); setSquadLoading(false) })
      .catch(() => { setSquadData([]); setSquadLoading(false) })
  }, [tab, tla, squadData])

  useEffect(() => {
    if (tab !== 'news' || newsData !== null) return
    setNewsLoading(true)
    fetch(`/api/team-news?name=${encodeURIComponent(getTeamDisplay(tla, teamName))}`)
      .then(r => r.json())
      .then(d => { setNewsData(Array.isArray(d) ? d : []); setNewsLoading(false) })
      .catch(() => { setNewsData([]); setNewsLoading(false) })
  }, [tab, tla, teamName, newsData])

  useEffect(() => {
    if (tab !== 'legend' || legendData !== null || legendError) return
    setLegendLoading(true)
    fetch(`/api/team-football-history?tla=${tla}&_v=3`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setLegendData(d); setLegendLoading(false) })
      .catch(() => { setLegendError(true); setLegendLoading(false) })
  }, [tab, tla, legendData, legendError])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-6 p-0 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Ambient glow ring behind modal */}
      <div className="relative w-full sm:max-w-xl">
        <div
          className="absolute -inset-6 rounded-[3rem] opacity-50 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(245,158,11,0.28) 0%, rgba(59,130,246,0.12) 50%, transparent 75%)',
            filter: 'blur(32px)',
          }}
        />

        {/* Modal panel — bottom sheet on mobile, centered card on sm+ */}
        <div
          className="
            relative w-full sm:max-w-xl
            glass rounded-t-3xl sm:rounded-3xl
            overflow-hidden
            min-h-[75vh] sm:min-h-0
            max-h-[92vh] sm:max-h-[88vh]
            flex flex-col
            animate-sheet-in
            shadow-2xl shadow-black/30
          "
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300/70 dark:bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/40 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              {flagUrl && (
                <div className="relative">
                  <img src={flagUrl} alt="" className="w-8 h-6 object-cover rounded shadow-sm" />
                  <div className="absolute inset-0 rounded ring-1 ring-black/10" />
                </div>
              )}
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">{displayName}</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100/70 dark:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-white/20 transition-all active:scale-90"
            >
              <svg viewBox="0 0 14 14" width="12" height="12" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/40 dark:border-white/10 shrink-0 relative">
            {(['history', 'legend', 'squad', 'news'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`
                  flex-1 py-2.5 text-[11px] font-medium transition-all duration-200 relative
                  ${tab === t
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}
                `}
              >
                {TAB_LABELS[t]}
                {tab === t && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-amber-500 dark:bg-amber-400"
                    style={{ boxShadow: '0 0 8px rgba(245,158,11,0.7)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content — key forces remount → animation replays on tab switch */}
          <div key={tab} className="overflow-y-auto flex-1 animate-fade-in-up scrollbar-none">
            {tab === 'history' && (
              historyLoading
                ? <div className="p-6 text-center text-gray-400 text-sm">加载中…</div>
                : (
                  <>
                    <Section title="2026世界杯" matches={historyData?.wc || []} tla={tla} isWC />
                    <Section title="热身赛" matches={historyData?.friendly || []} tla={tla} isWC={false} />
                  </>
                )
            )}

            {tab === 'legend' && (
              legendLoading
                ? <LegendSkeleton />
                : legendError
                  ? (
                    <div className="flex flex-col items-center gap-3 p-10 text-center">
                      <svg viewBox="0 0 48 48" width="48" height="48" fill="none" className="text-gray-300 dark:text-gray-600"><circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2"/><ellipse cx="24" cy="24" rx="8" ry="20" stroke="currentColor" strokeWidth="2"/><path d="M4 24h40M24 4a28 28 0 0 1 0 40M24 4a28 28 0 0 0 0 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400">暂无该球队的历史资料</p>
                      <button
                        onClick={() => setLegendError(false)}
                        className="mt-1 px-4 py-1.5 rounded-full text-[12px] font-medium text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-900/20 active:scale-95 transition-all"
                      >
                        重新加载
                      </button>
                    </div>
                  )
                  : legendData
                    ? <FootballLegendTab data={legendData} teamName={displayName} />
                    : null
            )}

            {tab === 'squad' && (
              squadLoading
                ? <div className="p-6 text-center text-gray-400 text-sm">加载中…</div>
                : !squadData || squadData.length === 0
                  ? <div className="p-6 text-center text-gray-400 text-sm">暂无名单数据</div>
                  : <SquadList squad={squadData} />
            )}

            {tab === 'news' && (
              newsLoading
                ? <div className="p-6 text-center text-gray-400 text-sm">加载中…</div>
                : !newsData || newsData.length === 0
                  ? <div className="p-6 text-center text-gray-400 text-sm">暂无新闻</div>
                  : <NewsList items={newsData} />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ─── Match History Section ─── */
function Section({ title, matches, tla, isWC }: { title: string; matches: any[]; tla: string; isWC: boolean }) {
  return (
    <div>
      <div className="px-5 py-2 border-b border-gray-200/60 dark:border-white/10">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      {matches.length === 0
        ? <div className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500">暂无记录</div>
        : (
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
                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100 shrink-0">{myScore}–{theirScore}</span>
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

/* ─── Time ago ─── */
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

/* ─── News List ─── */
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
          <span className="text-sm text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">{item.title}</span>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
            {item.source && <span className="font-medium text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{item.source}</span>}
            {item.source && item.pubDate && <span>·</span>}
            {item.pubDate && <span>{timeAgo(item.pubDate)}</span>}
            <span className="ml-auto shrink-0"><svg viewBox="0 0 12 12" width="10" height="10" fill="none"><path d="M7 1h4v4M11 1L5.5 6.5M5 3H2v7h7V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
          </div>
        </a>
      ))}
    </div>
  )
}

/* ─── Player Avatar ─── */
function PlayerAvatar({ photoUrl, name }: { photoUrl?: string | null; name: string }) {
  const [err, setErr] = React.useState(false)
  if (photoUrl && !err) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-gray-200/60 dark:ring-white/10 bg-gray-100 dark:bg-gray-800">
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover object-top"
          onError={() => setErr(true)}
        />
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200/60 dark:ring-white/10">
      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
        {name?.[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  )
}

/* ─── Squad List ─── */
function SquadList({ squad }: { squad: any[] }) {
  const hasPhotos = squad.some((p: any) => p.photo_url)
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
              <div key={idx} className="flex items-center gap-3 px-4 py-2">
                {p.shirt_number != null
                  ? <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">{p.shirt_number}</span>
                  : <span className="w-5 shrink-0" />}
                {hasPhotos && (
                  <PlayerAvatar photoUrl={p.photo_url} name={p.player_name_zh || p.player_name} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                    {p.player_name_zh || p.player_name}
                  </div>
                  {p.player_name_zh && p.player_name !== p.player_name_zh && (
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
                      {p.player_name}
                    </div>
                  )}
                  {p.club && (
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight truncate">
                      {p.club}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
