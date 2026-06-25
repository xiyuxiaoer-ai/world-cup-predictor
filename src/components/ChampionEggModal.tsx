'use client'

export default function ChampionEggModal({
  currentBonus,
  onPredict,
  onDismiss,
}: {
  currentBonus: number
  onPredict: () => void
  onDismiss: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-sm animate-spring-in">
        <div className="flex items-start justify-between mb-4">
          <div className="text-amber-500 dark:text-amber-400">
            <svg viewBox="0 0 32 32" width="36" height="36" fill="none">
              <path d="M7 4H4a2 2 0 0 0-2 2v2a5 5 0 0 0 5 5M25 4h3a2 2 0 0 1 2 2v2a5 5 0 0 1-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 4h16v8a8 8 0 0 1-16 0V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 20v5M11 28h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <button onClick={onDismiss} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100/70 dark:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-white/20 transition-all tap-scale">
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">彩蛋：猜冠军！</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          猜对本届世界杯冠军，可获得额外积分。越早猜积分越高！
        </p>
        <div className="glass-sm rounded-xl px-4 py-3 mb-5 text-center" style={{ background: 'rgba(255,237,213,0.5)', border: '0.5px solid rgba(245,158,11,0.25)' }}>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-0.5">现在猜可得</p>
          <p className="text-3xl font-bold text-amber-500">+{currentBonus} 分</p>
          <p className="text-xs text-amber-500/70 mt-0.5">每天递减，越晚越少</p>
        </div>
        <div className="space-y-2">
          <a
            href="/rules"
            onClick={() => sessionStorage.setItem('egg_dismissed', '1')}
            className="block w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm text-center"
          >
            查看彩蛋规则
          </a>
          <button
            onClick={onDismiss}
            className="w-full text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 py-2 transition-colors"
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  )
}
