'use client'

import { useState } from 'react'
import { getFlagUrl, getTeamDisplay, getTeamJa } from '@/lib/flags'
import TeamHistoryModal from './TeamHistoryModal'

export interface GroupModalMatch {
  id: string
  home_team: string
  away_team: string
  home_tla: string
  away_tla: string
  kickoff_time: string
  status: string
  home_score_90: number | null
  away_score_90: number | null
  home_score_et?: number | null
  home_score_pen?: number | null
  away_score_et?: number | null
  away_score_pen?: number | null
  group_name?: string | null
  stage?: string
  userPrediction?: { pred_home_score: number | null; pred_away_score: number | null } | null
}

export default function GroupModal({
  label,
  matches,
  gameIds,
  onClose,
  onPredictionSaved,
}: {
  label: string
  matches: GroupModalMatch[]
  gameIds: string[]
  onClose: () => void
  onPredictionSaved?: () => void
}) {
  const [predictingMatch, setPredictingMatch] = useState<GroupModalMatch | null>(null)
  const [predHome, setPredHome] = useState('')
  const [predAway, setPredAway] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [localPredictions, setLocalPredictions] = useState<Record<string, { pred_home_score: number; pred_away_score: number }>>({})
  const [historyTeam, setHistoryTeam] = useState<{ tla: string; name: string } | null>(null)

  async function handleSave() {
    if (!predictingMatch || predHome === '' || predAway === '') return
    setSaving(true)
    setSaveError('')
    try {
      const body = {
        match_id: predictingMatch.id,
        pred_home_score: parseInt(predHome),
        pred_away_score: parseInt(predAway),
      }
      let anyOk = false
      let lastError = ''
      for (const gid of gameIds) {
        const res = await fetch('/api/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, game_id: gid }),
        })
        if (res.ok) { anyOk = true }
        else { const d = await res.json(); lastError = d.error || '保存失败' }
      }
      if (anyOk) {
        setLocalPredictions(prev => ({
          ...prev,
          [predictingMatch.id]: { pred_home_score: parseInt(predHome), pred_away_score: parseInt(predAway) },
        }))
        setPredictingMatch(null)
        onPredictionSaved?.()
      } else {
        setSaveError(lastError || '保存失败')
      }
    } catch {
      setSaveError('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  const standings = (() => {
    if (!matches[0]?.group_name) return []
    const tm: Record<string, { tla: string; name: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number }> = {}
    matches.forEach(m => {
      const hTla = m.home_tla || m.home_team
      const aTla = m.away_tla || m.away_team
      if (!tm[hTla]) tm[hTla] = { tla: hTla, name: getTeamDisplay(m.home_tla, m.home_team), played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 }
      if (!tm[aTla]) tm[aTla] = { tla: aTla, name: getTeamDisplay(m.away_tla, m.away_team), played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 }
      if (m.status === 'finished' && m.home_score_90 != null && m.away_score_90 != null) {
        const h = m.home_score_90; const a = m.away_score_90
        tm[hTla].played++; tm[aTla].played++
        tm[hTla].gf += h; tm[hTla].ga += a
        tm[aTla].gf += a; tm[aTla].ga += h
        if (h > a) { tm[hTla].won++; tm[hTla].pts += 3; tm[aTla].lost++ }
        else if (h === a) { tm[hTla].drawn++; tm[hTla].pts++; tm[aTla].drawn++; tm[aTla].pts++ }
        else { tm[aTla].won++; tm[aTla].pts += 3; tm[hTla].lost++ }
      }
    })
    return Object.values(tm).sort((a, b) =>
      b.pts !== a.pts ? b.pts - a.pts :
      (b.gf - b.ga) !== (a.gf - a.ga) ? (b.gf - b.ga) - (a.gf - a.ga) :
      b.gf - a.gf
    )
  })()

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md glass rounded-2xl overflow-hidden max-h-[80vh] flex flex-col animate-spring-in" onClick={e => e.stopPropagation()}>

        {/* 猜分浮层 */}
        {predictingMatch && (
          <div className="absolute inset-0 z-10 flex flex-col rounded-2xl" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <button onClick={() => { setPredictingMatch(null); setSaveError('') }} className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">← 返回</button>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">猜比分</span>
              <div className="w-12" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
              {/* 队名 + 国旗 */}
              <div className="flex items-center justify-center gap-3 w-full">
                <div className="flex flex-col items-center gap-1 flex-1">
                  {getFlagUrl(predictingMatch.home_tla) && (
                    <img src={getFlagUrl(predictingMatch.home_tla)!} alt="" className="w-8 h-5.5 object-cover rounded-sm" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center">{getTeamDisplay(predictingMatch.home_tla, predictingMatch.home_team)}</span>
                </div>
                <span className="text-gray-300 dark:text-gray-600 text-sm font-bold shrink-0">vs</span>
                <div className="flex flex-col items-center gap-1 flex-1">
                  {getFlagUrl(predictingMatch.away_tla) && (
                    <img src={getFlagUrl(predictingMatch.away_tla)!} alt="" className="w-8 h-5.5 object-cover rounded-sm" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center">{getTeamDisplay(predictingMatch.away_tla, predictingMatch.away_team)}</span>
                </div>
              </div>

              {/* 比分输入 */}
              <div className="flex items-center gap-4">
                <input
                  type="number" min="0" max="20" value={predHome}
                  onChange={e => setPredHome(e.target.value)}
                  placeholder="0"
                  className="w-18 h-16 text-center text-2xl font-bold border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-amber-500 focus:outline-none"
                />
                <span className="text-gray-400 dark:text-gray-500 text-2xl font-bold">–</span>
                <input
                  type="number" min="0" max="20" value={predAway}
                  onChange={e => setPredAway(e.target.value)}
                  placeholder="0"
                  className="w-18 h-16 text-center text-2xl font-bold border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {saveError && <p className="text-red-500 text-xs">{saveError}</p>}

              <button
                onClick={handleSave}
                disabled={saving || predHome === '' || predAway === ''}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white disabled:text-gray-400 rounded-xl font-semibold transition-colors"
              >
                {saving ? '保存中...' : '确认猜测'}
              </button>
            </div>
          </div>
        )}

        {/* 弹窗主内容 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/40 dark:border-white/10">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{label} · 全部比赛</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
        </div>

        {standings.length > 0 && (
          <div className="px-5 py-3 border-b border-white/40 dark:border-white/10 bg-white/30 dark:bg-white/5">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 dark:text-gray-500">
                  <th className="text-left pb-1.5 font-medium w-4">#</th>
                  <th className="pb-1.5 w-6"></th>
                  <th className="text-center pb-1.5 font-medium w-8">赛</th>
                  <th className="text-center pb-1.5 font-medium w-8">胜</th>
                  <th className="text-center pb-1.5 font-medium w-8">平</th>
                  <th className="text-center pb-1.5 font-medium w-8">负</th>
                  <th className="text-center pb-1.5 font-medium w-12">进/失</th>
                  <th className="text-center pb-1.5 font-medium w-8">积分</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, idx) => {
                  const flagUrl = getFlagUrl(team.tla)
                  return (
                    <tr key={team.tla} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-1.5 text-gray-400 dark:text-gray-500 text-xs">{idx + 1}</td>
                      <td className="py-1.5">
                        {flagUrl && <img src={flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm" />}
                      </td>
                      <td className="py-1.5 text-center text-gray-500 dark:text-gray-400">{team.played}</td>
                      <td className="py-1.5 text-center text-gray-500 dark:text-gray-400">{team.won}</td>
                      <td className="py-1.5 text-center text-gray-500 dark:text-gray-400">{team.drawn}</td>
                      <td className="py-1.5 text-center text-gray-500 dark:text-gray-400">{team.lost}</td>
                      <td className="py-1.5 text-center text-gray-500 dark:text-gray-400">{team.gf}/{team.ga}</td>
                      <td className="py-1.5 text-center font-bold text-gray-900 dark:text-gray-100">{team.pts}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="overflow-y-auto flex-1 divide-y divide-white/30 dark:divide-white/10">
          {matches.map(m => {
            const homeTla = getTeamDisplay(m.home_tla, m.home_team)
            const awayTla = getTeamDisplay(m.away_tla, m.away_team)
            const homeFlagUrl = getFlagUrl(m.home_tla)
            const awayFlagUrl = getFlagUrl(m.away_tla)
            const homeJa = getTeamJa(m.home_tla)
            const awayJa = getTeamJa(m.away_tla)
            const kickoff = new Date(m.kickoff_time)
            const finished = m.status === 'finished'
            const effectivePrediction = m.userPrediction || localPredictions[m.id] || null
            return (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                <div className="text-xs text-gray-400 dark:text-gray-500 w-14 shrink-0 text-center">
                  {finished ? (
                    <span>已结束</span>
                  ) : (
                    <>
                      <div>{kickoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</div>
                      <div>{kickoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </>
                  )}
                </div>
                <div className="relative flex items-start flex-1 min-w-0">
                  <div className="w-1/2 flex flex-col pr-8">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button type="button" onClick={() => m.home_tla && setHistoryTeam({ tla: m.home_tla, name: m.home_team })} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-amber-500 transition-colors">{homeTla}</button>
                      {homeFlagUrl && <img src={homeFlagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />}
                    </div>
                    {homeJa && <span className="w-full text-[10px] font-normal text-gray-400 dark:text-gray-500 text-right pr-[26px]">{homeJa}</span>}
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 text-center top-1/2 -translate-y-1/2 flex flex-col items-center">
                    {finished ? (
                      <>
                        <span className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">{m.home_score_90} – {m.away_score_90}</span>
                        {m.home_score_et != null && m.home_score_pen == null && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 leading-tight mt-0.5">延 {m.home_score_et}–{m.away_score_et}</span>
                        )}
                        {m.home_score_pen != null && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 leading-tight mt-0.5">点球 {m.home_score_pen}–{m.away_score_pen}</span>
                        )}
                        {effectivePrediction && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5 whitespace-nowrap">我猜: {effectivePrediction.pred_home_score}–{effectivePrediction.pred_away_score}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-gray-300 dark:text-gray-600 text-sm font-bold leading-tight">vs</span>
                        {effectivePrediction ? (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5 whitespace-nowrap">我猜: {effectivePrediction.pred_home_score}–{effectivePrediction.pred_away_score}</span>
                        ) : (
                          <button
                            onClick={() => { setPredictingMatch(m); setPredHome(''); setPredAway(''); setSaveError('') }}
                            className="text-xs text-amber-500 hover:text-amber-400 font-medium whitespace-nowrap leading-tight mt-0.5"
                          >
                            待猜球
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="w-1/2 flex flex-col pl-8">
                    <div className="flex items-center gap-1.5">
                      {awayFlagUrl && <img src={awayFlagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />}
                      <button type="button" onClick={() => m.away_tla && setHistoryTeam({ tla: m.away_tla, name: m.away_team })} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-amber-500 transition-colors">{awayTla}</button>
                    </div>
                    {awayJa && <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 pl-[26px]">{awayJa}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>

    {historyTeam && (
      <TeamHistoryModal tla={historyTeam.tla} teamName={historyTeam.name} onClose={() => setHistoryTeam(null)} />
    )}
    </>
  )
}
