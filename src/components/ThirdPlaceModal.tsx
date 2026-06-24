'use client'

import { useEffect, useState } from 'react'
import { getFlagUrl, getTeamDisplay } from '@/lib/flags'

type ThirdEntry = {
  group: string; team: string; tla: string | null
  pts: number; gf: number; ga: number; gd: number
  played: number; remaining: number
}

function GdLabel({ gd }: { gd: number }) {
  const color = gd > 0 ? 'text-green-600 dark:text-green-400' : gd < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'
  return <span className={color}>{gd > 0 ? `+${gd}` : gd}</span>
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/10 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">第三名晋级推算</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">12组各取第3，积分最高8支晋级 · 排名1–8可出线</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none px-1">✕</button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="text-sm text-gray-400 p-6 text-center">加载中...</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-3 py-2 text-left w-7">#</th>
                  <th className="px-2 py-2 text-left">球队</th>
                  <th className="px-2 py-2 text-center">积分</th>
                  <th className="px-2 py-2 text-center">净胜</th>
                  <th className="px-2 py-2 text-center">进球</th>
                  <th className="px-2 py-2 text-right pr-3">剩余</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const inTop8 = i < 8
                  const flagUrl = getFlagUrl(row.tla)
                  const name = getTeamDisplay(row.tla, row.team)
                  const rowBg = inTop8
                    ? 'bg-green-50/60 dark:bg-green-900/10'
                    : 'bg-red-50/40 dark:bg-red-900/10'

                  return (
                    <tr key={row.group} className={`border-b border-black/[0.04] dark:border-white/[0.05] ${rowBg}`}>
                      {/* 排名 */}
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold
                          ${inTop8 ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                          {i + 1}
                        </span>
                      </td>
                      {/* 球队 */}
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {flagUrl
                            ? <img src={flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
                            : <span className="w-5 h-3.5 shrink-0" />
                          }
                          <span className="font-medium text-gray-800 dark:text-gray-200">{name}</span>
                          {onGroupClick ? (
                            <button
                              type="button"
                              onClick={() => onGroupClick(`GROUP_${row.group}`, `小组赛 ${row.group}组`)}
                              className="text-gray-400 dark:text-gray-500 underline decoration-dotted hover:text-amber-500 transition-colors"
                            >
                              {row.group}组
                            </button>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600">{row.group}组</span>
                          )}
                        </div>
                      </td>
                      {/* 积分 */}
                      <td className="px-2 py-2.5 text-center font-bold text-gray-800 dark:text-gray-200">{row.pts}</td>
                      {/* 净胜球 */}
                      <td className="px-2 py-2.5 text-center"><GdLabel gd={row.gd} /></td>
                      {/* 进球 */}
                      <td className="px-2 py-2.5 text-center text-gray-600 dark:text-gray-400">{row.gf}</td>
                      {/* 剩余场次 + 场景 */}
                      <td className="px-2 py-2.5 pr-3 text-right">
                        {row.remaining > 0 ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] text-amber-500 font-medium">剩{row.remaining}场</span>
                            <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight">
                              赢→{row.pts + 3}pt · 平→{row.pts + 1}pt
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 dark:text-gray-600">已完赛</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer 说明 */}
        <div className="px-4 py-2.5 border-t border-black/[0.04] dark:border-white/[0.05] shrink-0">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            ⚠ 基于已完成比赛实时计算 · 净胜球相同时进球数多者优先 · 小组赛结束后以官方公布为准
          </p>
        </div>
      </div>
    </div>
  )
}
