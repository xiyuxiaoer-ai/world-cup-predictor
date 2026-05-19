'use client'

export default function ScrollingBanner({ items }: { items: string[] }) {
  const text = items.join('   ·   ') + '   ·   '

  // tk.png: 1697×927px，线在 y≈490，角色 x≈500–1150
  // 显示比例 ~0.24x → 展示宽390px，角色从线下方开始裁剪
  return (
    <div className="relative">
      <div className="overflow-hidden bg-amber-50 border-b border-amber-100 h-8 flex items-center select-none">
        <div className="animate-marquee whitespace-nowrap text-xs text-amber-700/50 font-medium tracking-wide">
          <span>{text}</span>
          <span>{text}</span>
        </div>
      </div>
      {/* 偷看人物：overflow-hidden 裁掉线上方的空白，只露出手和头顶 */}
      <div
        className="absolute top-full right-4 md:right-10 pointer-events-none z-0 overflow-hidden"
        style={{ width: 155, height: 62, marginTop: -1 }}
      >
        <img
          src="/tk.png"
          alt=""
          style={{
            position: 'absolute',
            width: 395,
            height: 'auto',
            top: -113,
            left: -108,
          }}
        />
      </div>
    </div>
  )
}
