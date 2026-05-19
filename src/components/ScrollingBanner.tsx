'use client'

// tk.png 1697×927，横线在 y≈530（57%），角色 x≈560–1110（中心≈835）
// 以 420px 宽展示（scale≈0.247），backgroundPosition 裁出角色区域
const CHAR_STYLE: React.CSSProperties = {
  backgroundImage: 'url(/tk1.png)',
  backgroundSize: '420px auto',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: '-115px -125px', // x: 从左手开始；y: 从横线下方开始
}

export default function ScrollingBanner({ items, peek = true }: { items: string[]; peek?: boolean }) {
  const text = items.join('   ·   ') + '   ·   '

  return (
    <div className="relative">
      <div className="overflow-hidden bg-amber-50 border-b border-amber-100 h-8 flex items-center select-none">
        <div className="animate-marquee whitespace-nowrap text-xs text-amber-700/50 font-medium tracking-wide">
          <span>{text}</span>
          <span>{text}</span>
        </div>
      </div>
      {/* 偷看人物：用 background-image 精确裁剪，只露出手和头顶 */}
      {peek && (
        <div
          className="absolute top-full right-4 md:right-10 pointer-events-none z-10 animate-peekaboo"
          style={{ width: 160, height: 100, marginTop: -1, ...CHAR_STYLE }}
        />
      )}
    </div>
  )
}
