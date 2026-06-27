'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'

type FourthEntry = {
  team: string; tla: string | null
  pts: number; gf: number; ga: number; gd: number
  vsTeam: string | null; vsTla: string | null
}

type ThirdEntry = {
  group: string; team: string; tla: string | null
  pts: number; gf: number; ga: number; gd: number
  played: number; remaining: number
  vsTeam: string | null; vsTla: string | null
  fourth: FourthEntry | null
}

function Flag({ tla }: { tla: string | null | undefined }) {
  const url = getFlagUrl(tla)
  return url
    ? <img src={url} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
    : <span className="w-5 h-3.5 shrink-0" />
}

function GdBadge({ gd }: { gd: number }) {
  const color = gd > 0 ? 'text-green-600 dark:text-green-400' : gd < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'
  return <span className={color}>{gd > 0 ? `+${gd}` : gd}</span>
}

function TeamCell({ team, tla, onGroupClick, group }: {
  team: string; tla: string | null
  group: string; onGroupClick?: (g: string, l: string) => void
}) {
  const name = getTeamDisplay(tla, team)
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Flag tla={tla} />
      <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{name}</span>
      {onGroupClick ? (
        <button
          type="button"
          onClick={() => onGroupClick(`GROUP_${group}`, `小组赛 ${group}组`)}
          className="text-[10px] text-gray-400 dark:text-gray-500 underline decoration-dotted hover:text-amber-500 transition-colors shrink-0"
        >
          {group}组
        </button>
      ) : (
        <span className="text-[10px] text-gray-400 dark:text-gray-600 shrink-0">{group}组</span>
      )}
    </div>
  )
}

export default function ThirdPlaceModal({ onClose, onGroupClick }: {
  onClose: () => void
  onGroupClick?: (groupName: string, label: string) => void
}) {
  const [data, setData] = useState<ThirdEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/third-place-standings')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/10 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">第三名晋级推算</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">12组各取第3，积分最高8支晋级 · 点组别可查看剩余赛程</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100/70 dark:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-white/20 transition-all tap-scale">
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="text-sm text-gray-400 p-6 text-center">加载中...</div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                  <th className="px-3 py-2 text-left w-7">#</th>
                  <th className="px-2 py-2 text-left">球队</th>
                  <th className="px-2 py-2 text-center">积分</th>
                  <th className="px-2 py-2 text-center">净胜</th>
                  <th className="px-2 py-2 text-center">进球</th>
                  <th className="px-2 py-2 pr-3">最后一场</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const inTop8 = i < 8
                  const showDivider = i === 8

                  return (
                    <>
                      {/* 晋级线分隔 */}
                      {showDivider && (
                        <tr key="divider">
                          <td colSpan={6} className="px-3 py-1">
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                              <span className="shrink-0">── 晋级线 ──</span>
                              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* 第3名主行 */}
                      <tr key={row.group} className={`border-b border-black/[0.04] dark:border-white/[0.05] ${inTop8 ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-red-50/30 dark:bg-red-900/[0.07]'}`}>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold
                            ${inTop8 ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <TeamCell team={row.team} tla={row.tla} group={row.group} onGroupClick={onGroupClick} />
                        </td>
                        <td className="px-2 py-2.5 text-center font-bold text-gray-800 dark:text-gray-200">{row.pts}</td>
                        <td className="px-2 py-2.5 text-center"><GdBadge gd={row.gd} /></td>
                        <td className="px-2 py-2.5 text-center text-gray-600 dark:text-gray-400">{row.gf}</td>
                        <td className="px-2 py-2.5 pr-3">
                          {row.remaining > 0 && row.vsTeam ? (
                            <div className="flex items-center gap-1.5">
                              <Flag tla={row.vsTla} />
                              <span className="text-gray-500 dark:text-gray-400 text-[10px]">{getTeamDisplay(row.vsTla, row.vsTeam)}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-300 dark:text-gray-600">已完赛</span>
                          )}
                        </td>
                      </tr>

                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-black/[0.04] dark:border-white/[0.05] shrink-0">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            ⚠标记表示该组第4名赢球后可能超越第3名 · 净胜球相同时进球数多者优先 · 以官方公布为准
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
