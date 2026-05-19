'use client'

export default function ScrollingBanner({ items }: { items: string[] }) {
  const text = items.join('   ·   ') + '   ·   '

  return (
    <div className="overflow-hidden bg-amber-50 border-b border-amber-100 h-8 flex items-center select-none">
      <div className="animate-marquee whitespace-nowrap text-xs text-amber-700/50 font-medium tracking-wide">
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  )
}
