import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PageBackground from '@/components/PageBackground'
import ChampionButton from '@/components/ChampionButton'

function IconCheck() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 20, height: 20, flexShrink: 0 }}>
      <circle cx="10" cy="10" r="8.5" fill="#DCFCE7"/>
      <path d="M6 10.5l3 3 5-5.5" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconStar() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 20, height: 20, flexShrink: 0 }}>
      <path d="M10 2l2.1 4.3 4.7.7-3.4 3.3.8 4.7L10 12.5l-4.2 2.5.8-4.7L3.2 7l4.7-.7z" fill="#FCD34D" stroke="#D97706" strokeWidth="0.8" strokeLinejoin="round"/>
    </svg>
  )
}
function IconClock() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 20, height: 20, flexShrink: 0 }}>
      <circle cx="10" cy="10" r="7.5" stroke="#94A3B8" strokeWidth="1.8"/>
      <path d="M10 6.5V10.5l2.5 1.5" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconGoal() {
  return (
    <svg viewBox="0 0 22 17" fill="none" style={{ width: 22, height: 17, flexShrink: 0 }}>
      <rect x="1" y="1" width="20" height="11" rx="1" stroke="#94A3B8" strokeWidth="1.8"/>
      <line x1="1" y1="4.5" x2="21" y2="4.5" stroke="#94A3B8" strokeWidth="0.9"/>
      <line x1="1" y1="8" x2="21" y2="8" stroke="#94A3B8" strokeWidth="0.9"/>
      <line x1="7" y1="1" x2="7" y2="12" stroke="#94A3B8" strokeWidth="0.9"/>
      <line x1="11" y1="1" x2="11" y2="12" stroke="#94A3B8" strokeWidth="0.9"/>
      <line x1="15" y1="1" x2="15" y2="12" stroke="#94A3B8" strokeWidth="0.9"/>
      <path d="M1 12l2 4M21 12l-2 4" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function IconWarning() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 20, height: 20, flexShrink: 0 }}>
      <path d="M10 2L18.5 17H1.5L10 2z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M10 8.5v3.5" stroke="#B45309" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="10" cy="14.5" r="1" fill="#B45309"/>
    </svg>
  )
}
function IconTrophy() {
  return (
    <svg viewBox="0 0 22 22" fill="none" style={{ width: 22, height: 22, flexShrink: 0 }}>
      <path d="M7 3h8v7a4 4 0 01-8 0V3z" fill="#FCD34D" stroke="#D97706" strokeWidth="1.4"/>
      <path d="M4 5H7M15 5h3" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M11 14v3.5M8 17.5h6" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function IconLock() {
  return (
    <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', flexShrink: 0 }}>
      <rect x="2" y="7" width="12" height="8" rx="2" fill="#94A3B8"/>
      <path d="M5 7V5.5a3 3 0 016 0V7" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="8" cy="11" r="1.1" fill="white"/>
    </svg>
  )
}
function IconGroup() {
  return (
    <svg viewBox="0 0 18 14" fill="none" style={{ width: 16, height: 14, display: 'inline', verticalAlign: 'middle', flexShrink: 0 }}>
      <circle cx="6" cy="4" r="3" fill="#94A3B8"/>
      <path d="M0 14a6 6 0 0112 0" fill="#94A3B8"/>
      <circle cx="13" cy="4.5" r="2.5" fill="#CBD5E1"/>
      <path d="M10 14a4 4 0 018 0" fill="#CBD5E1"/>
    </svg>
  )
}
function IconRefresh() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 20, height: 20, flexShrink: 0 }}>
      <path d="M3.5 10A6.5 6.5 0 0116 7" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M16.5 10A6.5 6.5 0 014 13" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M15 4.5l1.5 2.5-2.5.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 15.5l-1.5-2.5 2.5-.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

type RuleIcon = 'check' | 'star' | 'clock' | 'goal'
function RuleIconComponent({ type }: { type: RuleIcon }) {
  if (type === 'check') return <IconCheck />
  if (type === 'star') return <IconStar />
  if (type === 'clock') return <IconClock />
  return <IconGoal />
}

const STAGE_RULES: { title: string; subtitle: string; color: string; badge: string | null; rules: { iconType: RuleIcon; label: string; points: string }[]; max: string }[] = [
  {
    title: '小组赛', subtitle: '共 72 场', color: 'border-gray-200 dark:border-gray-700', badge: null,
    rules: [
      { iconType: 'check', label: '猜对胜负平', points: '+3分' },
      { iconType: 'star',  label: '猜对精确比分（含结果）', points: '+2分' },
    ],
    max: '单场最高 5分',
  },
  {
    title: '淘汰赛 · 32强 & 16强', subtitle: '共 24 场', color: 'border-gray-200 dark:border-gray-700', badge: null,
    rules: [
      { iconType: 'check', label: '猜对90分钟内胜负平', points: '+4分' },
      { iconType: 'star',  label: '猜对精确比分（含结果）', points: '+2分' },
      { iconType: 'clock', label: '预测90分钟平且实际平 → 猜对加时赛胜者', points: '+2分' },
      { iconType: 'goal',  label: '预测加时赛平且实际平 → 猜对点球胜者', points: '+2分' },
    ],
    max: '单场最高 10分',
  },
  {
    title: '双倍积分 · 8强 / 4强 / 季军赛 / 决赛', subtitle: '共 8 场 · 所有积分 ×2', color: 'border-amber-300', badge: '双倍 ×2',
    rules: [
      { iconType: 'check', label: '猜对90分钟内胜负平', points: '+8分' },
      { iconType: 'star',  label: '猜对精确比分（含结果）', points: '+4分' },
      { iconType: 'clock', label: '预测90分钟平且实际平 → 猜对加时赛胜者', points: '+4分' },
      { iconType: 'goal',  label: '预测加时赛平且实际平 → 猜对点球胜者', points: '+4分' },
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

        {/* 彩蛋：猜冠军额外奖励 */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-300 dark:border-amber-600/40 rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2"><IconTrophy />彩蛋：猜冠军</h2>
              <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40 px-2 py-0.5 rounded-full font-medium">额外奖励</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">猜对本届世界杯冠军，可获得额外积分 · 越早猜、积分越高</p>
          </div>
          <div className="space-y-2">
            {[
              { stage: '小组赛期间猜', range: '37–50 分' },
              { stage: '32强期间猜',   range: '29–34 分' },
              { stage: '16强期间猜',   range: '22–26 分' },
              { stage: '8强期间猜',    range: '8–10 分' },
              { stage: '4强期间猜',    range: '4–6 分' },
            ].map(r => (
              <div key={r.stage} className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-200">{r.stage}</span>
                <span className="text-sm font-bold text-amber-500 shrink-0">{r.range}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 border-t border-amber-100 dark:border-amber-800/30 pt-3 space-y-1.5">
            <p>积分每天自动递减，约少 1–2 分 · 距决赛越远得分越高</p>
            <p className="flex items-center gap-1.5"><IconLock /> 每人只能猜一次，决赛开始后锁定</p>
            <p className="flex items-center gap-1.5"><IconGroup /> 所有人的猜测结果可在「成员」页面查看</p>
          </div>
          <ChampionButton />
        </div>

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
                    <RuleIconComponent type={rule.iconType} />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{rule.label}</span>
                  </div>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400 shrink-0">{rule.points}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">{stage.max}</div>
          </div>
        ))}

        <div className="bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 rounded-2xl p-5 space-y-3 shadow-sm relative isolate overflow-visible">
          <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2"><IconWarning /> 漏猜惩罚</h2>
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
          {/* 踢球效果：腿（静止）+ 足球（旋转+漂浮） */}
          <div className="absolute -bottom-6 -right-2 pointer-events-none"
               style={{ zIndex: -1, width: 180, position: 'absolute' }}>
            <img src="/tq3.png" alt="" style={{ width: 180, height: 'auto', display: 'block', opacity: 0.72 }} />
            <div className="animate-ball-float" style={{ position: 'absolute', top: -16, right: 2, opacity: 0.72 }}>
              <img src="/tq2.png" alt="" className="animate-ball-spin" style={{ width: 46, height: 'auto' }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3 shadow-sm">
          <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2"><IconRefresh /> 数据更新说明</h2>
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
