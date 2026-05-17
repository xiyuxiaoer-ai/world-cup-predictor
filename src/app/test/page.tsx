'use client'

import { useState, useEffect } from 'react'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  SCHEDULED:  { label: '待开赛', color: 'text-zinc-400' },
  TIMED:      { label: '待开赛', color: 'text-zinc-400' },
  IN_PLAY:    { label: '进行中', color: 'text-emerald-400 animate-pulse' },
  PAUSED:     { label: '中场',   color: 'text-yellow-400' },
  FINISHED:   { label: '已结束', color: 'text-zinc-500' },
  POSTPONED:  { label: '延期',   color: 'text-red-400' },
  CANCELLED:  { label: '取消',   color: 'text-red-400' },
}

export default function TestPage() {
  const [matchday, setMatchday] = useState(37)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)

  async function fetchData(md = matchday) {
    setLoading(true)
    const res = await fetch(`/api/test-pl?matchday=${md}`)
    const json = await res.json()
    setData(json)
    setFetchedAt(json.fetchedAt)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const matches = data?.matches || []

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">英超 API 实时测试</h1>
          {fetchedAt && (
            <p className="text-xs text-zinc-500 mt-1">
              数据获取时间：{new Date(fetchedAt).toLocaleString('zh-CN')}
            </p>
          )}
        </div>
        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
          刷新
        </button>
      </div>

      {/* 轮次选择 */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {[35, 36, 37, 38].map(md => (
          <button
            key={md}
            onClick={() => { setMatchday(md); fetchData(md) }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${matchday === md ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white border border-zinc-700'}`}
          >
            第{md}轮
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500">加载中...</p>
      ) : matches.length === 0 ? (
        <p className="text-zinc-500">暂无数据</p>
      ) : (
        <div className="space-y-2">
          {matches.map((m: any) => {
            const status = STATUS_LABEL[m.status] || { label: m.status, color: 'text-zinc-400' }
            const kickoff = new Date(m.utcDate)
            const isFinished = m.status === 'FINISHED'
            const isLive = m.status === 'IN_PLAY' || m.status === 'PAUSED'

            return (
              <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <div className="flex justify-between text-xs text-zinc-500 mb-2">
                  <span className={status.color}>{status.label}</span>
                  <span>
                    {kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    {' '}
                    {kickoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-right flex-1">{m.homeTeam.shortName || m.homeTeam.name}</span>
                  <div className="text-center shrink-0 w-20">
                    {isFinished || isLive ? (
                      <span className={`font-bold ${isLive ? 'text-emerald-400' : 'text-white'}`}>
                        {m.score.fullTime.home ?? m.score.halfTime.home ?? '-'}
                        {' – '}
                        {m.score.fullTime.away ?? m.score.halfTime.away ?? '-'}
                      </span>
                    ) : (
                      <span className="text-zinc-600">vs</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-left flex-1">{m.awayTeam.shortName || m.awayTeam.name}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
