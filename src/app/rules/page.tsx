import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PageBackground from '@/components/PageBackground'


const STAGE_RULES = [
  {
    title: '小组赛', subtitle: '共 72 场', color: 'border-gray-200 dark:border-gray-700', badge: null,
    rules: [
      { icon: '✓', label: '猜对胜负平', points: '+3分' },
      { icon: '⭐', label: '猜对精确比分（含结果）', points: '+2分' },
    ],
    max: '单场最高 5分',
  },
  {
    title: '淘汰赛 · 32强 & 16强', subtitle: '共 24 场', color: 'border-gray-200 dark:border-gray-700', badge: null,
    rules: [
      { icon: '✓', label: '猜对90分钟内胜负平', points: '+4分' },
      { icon: '⭐', label: '猜对精确比分（含结果）', points: '+2分' },
      { icon: '⏱', label: '预测90分钟平且实际平 → 猜对加时赛胜者', points: '+2分' },
      { icon: '🥅', label: '预测加时赛平且实际平 → 猜对点球胜者', points: '+2分' },
    ],
    max: '单场最高 10分',
  },
  {
    title: '双倍积分 · 8强 / 4强 / 季军赛 / 决赛', subtitle: '共 8 场 · 所有积分 ×2', color: 'border-amber-300', badge: '🔥 双倍',
    rules: [
      { icon: '✓', label: '猜对90分钟内胜负平', points: '+8分' },
      { icon: '⭐', label: '猜对精确比分（含结果）', points: '+4分' },
      { icon: '⏱', label: '预测90分钟平且实际平 → 猜对加时赛胜者', points: '+4分' },
      { icon: '🥅', label: '预测加时赛平且实际平 → 猜对点球胜者', points: '+4分' },
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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar username={profile?.username ?? ''} avatarUrl={profile?.avatar_url} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">积分规则</h1>

        {STAGE_RULES.map(stage => (
          <div key={stage.title} className={`bg-white dark:bg-gray-800 border ${stage.color} rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow`}>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-gray-100">{stage.title}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs text-gray-500 dark:text-gray-400">{stage.subtitle}</p>
                {stage.badge && (
                  <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 dark:border-amber-700/40 px-2 py-0.5 rounded-full font-medium">
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
                    <span className="text-sm text-gray-700 dark:text-gray-200">{rule.label}</span>
                  </div>
                  <span className="text-sm font-bold text-amber-500 shrink-0">{rule.points}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">{stage.max}</div>
          </div>
        ))}

        <div className="bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 rounded-2xl p-5 space-y-3 shadow-sm relative isolate overflow-visible">
          <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2"><span>⚠️</span> 漏猜惩罚</h2>
          <div className="space-y-2">
            {[
              { stage: '小组赛漏猜', pts: '-1分' },
              { stage: '32强 / 16强漏猜', pts: '-2分' },
              { stage: '8强及以后漏猜', pts: '-4分' },
            ].map(r => (
              <div key={r.stage} className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-200">{r.stage}</span>
                <span className="text-sm font-bold text-red-700 bg-white/90 dark:bg-gray-800/90 px-1.5 py-0.5 rounded">{r.pts}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">比赛开赛前1小时锁定，锁定后无法提交竞猜</p>
          {/* 踢球效果：腿（静止）+ 足球（旋转+漂浮），z:-1 在文字后面 */}
          <div className="absolute -bottom-10 -right-4 pointer-events-none"
               style={{ zIndex: -1, width: 290, position: 'absolute' }}>
            {/* 腿（静止，高透明度） */}
            <img src="/tq3.png" alt="" style={{ width: 290, height: 'auto', display: 'block', opacity: 0.88 }} />
            {/* 足球：外层漂浮 + 内层旋转，单独控制透明度 */}
            <div className="animate-ball-float" style={{ position: 'absolute', top: -28, right: 2, opacity: 0.88 }}>
              <img src="/tq2.png" alt="" className="animate-ball-spin" style={{ width: 74, height: 'auto' }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3 shadow-sm">
          <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2"><span>🔄</span> 数据更新说明</h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex gap-3">
              <span className="text-gray-400 dark:text-gray-500 shrink-0">自动更新</span>
              <span>系统每30分钟自动同步一次比赛结果和积分，无需手动操作。</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 dark:text-gray-500 shrink-0">手动更新</span>
              <span>想立即获取最新结果？点击主页或竞猜记录页顶部的「手动更新」按钮，比赛结果和积分将实时刷新。</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
