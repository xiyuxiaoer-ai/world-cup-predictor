import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PageBackground from '@/components/PageBackground'

const STAGE_RULES = [
  {
    title: '小组赛',
    subtitle: '共 72 场',
    color: 'border-zinc-700',
    badge: null,
    rules: [
      { icon: '✓', label: '猜对胜负平', points: '+3分' },
      { icon: '⭐', label: '猜对精确比分（含结果）', points: '+2分' },
    ],
    max: '单场最高 5分',
  },
  {
    title: '淘汰赛 · 32强 & 16强',
    subtitle: '共 24 场',
    color: 'border-zinc-700',
    badge: null,
    rules: [
      { icon: '✓', label: '猜对90分钟内胜负平', points: '+4分' },
      { icon: '⭐', label: '猜对精确比分（含结果）', points: '+2分' },
      { icon: '⏱', label: '预测90分钟平且实际平 → 猜对加时赛胜者', points: '+2分' },
      { icon: '🥅', label: '预测加时赛平且实际平 → 猜对点球胜者', points: '+2分' },
    ],
    max: '单场最高 10分',
  },
  {
    title: '双倍积分 · 8强 / 4强 / 季军赛 / 决赛',
    subtitle: '共 8 场 · 所有积分 ×2',
    color: 'border-emerald-500/50',
    badge: '🔥 双倍',
    rules: [
      { icon: '✓', label: '猜对90分钟内胜负平', points: '+8分' },
      { icon: '⭐', label: '猜对精确比分（含结果）', points: '+4分' },
      { icon: '⏱', label: '预测平且实际平 → 加时赛胜者', points: '+4分' },
      { icon: '🥅', label: '预测平且实际平 → 点球胜者', points: '+4分' },
    ],
    max: '单场最高 20分',
  },
]

export default async function RulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar username={profile?.username ?? ''} avatarUrl={profile?.avatar_url} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold">积分规则</h1>

        {STAGE_RULES.map(stage => (
          <div key={stage.title} className={`bg-zinc-900 border ${stage.color} rounded-2xl p-5 space-y-4`}>
            <div>
              <h2 className="font-bold text-base">{stage.title}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs text-zinc-500">{stage.subtitle}</p>
                {stage.badge && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {stage.badge}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {stage.rules.map(rule => (
                <div key={rule.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base w-5 text-center">{rule.icon}</span>
                    <span className="text-sm text-zinc-300">{rule.label}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 shrink-0">{rule.points}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-zinc-500 border-t border-zinc-800 pt-3">{stage.max}</div>
          </div>
        ))}

        <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-5 space-y-3">
          <h2 className="font-bold text-base flex items-center gap-2">
            <span>⚠️</span> 漏猜惩罚
          </h2>
          <div className="space-y-2">
            {[
              { stage: '小组赛漏猜', pts: '-1分' },
              { stage: '32强 / 16强漏猜', pts: '-2分' },
              { stage: '8强及以后漏猜', pts: '-4分' },
            ].map(r => (
              <div key={r.stage} className="flex justify-between items-center">
                <span className="text-sm text-zinc-300">{r.stage}</span>
                <span className="text-sm font-bold text-red-400">{r.pts}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 border-t border-zinc-800 pt-3">
            比赛开赛前1小时锁定，锁定后无法提交竞猜
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <h2 className="font-bold text-base flex items-center gap-2">
            <span>🔄</span> 数据更新说明
          </h2>
          <div className="space-y-3 text-sm text-zinc-400">
            <div className="flex gap-3">
              <span className="text-zinc-500 shrink-0">自动更新</span>
              <span>系统每30分钟自动同步一次比赛结果和积分，无需手动操作。</span>
            </div>
            <div className="flex gap-3">
              <span className="text-zinc-500 shrink-0">手动更新</span>
              <span>想立即获取最新结果？点击主页或竞猜记录页顶部的「手动更新」按钮，比赛结果和积分将实时刷新。</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
