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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl">🏆</div>
          <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none p-1">✕</button>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">彩蛋：猜冠军！</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          猜对本届世界杯冠军，可获得额外积分。越早猜积分越高！
        </p>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-3 mb-5 text-center">
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
