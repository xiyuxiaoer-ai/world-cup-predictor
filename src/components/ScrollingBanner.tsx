'use client'

function PeekingCharacter() {
  return (
    <svg width="88" height="52" viewBox="0 0 88 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 左手扒着边缘 */}
      <path d="M2 10 L8 2 L22 4 L24 16 L12 20 Z" fill="#FBBF24" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round"/>
      <line x1="14" y1="4" x2="12" y2="15" stroke="#111827" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="3" x2="17" y2="14" stroke="#111827" strokeWidth="1.5" strokeLinecap="round"/>
      {/* 右手扒着边缘 */}
      <path d="M86 10 L80 2 L66 4 L64 16 L76 20 Z" fill="#FBBF24" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round"/>
      <line x1="74" y1="4" x2="76" y2="15" stroke="#111827" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="70" y1="3" x2="71" y2="14" stroke="#111827" strokeWidth="1.5" strokeLinecap="round"/>
      {/* 头（只露出上半部分） */}
      <ellipse cx="44" cy="54" rx="26" ry="28" fill="#FBBF24" stroke="#111827" strokeWidth="2.5"/>
      {/* 头发 */}
      <path d="M20 46 Q24 28 44 26 Q64 28 68 46 L65 48 Q57 33 44 32 Q31 33 23 48 Z" fill="#111827"/>
      {/* 眉毛上扬（惊讶） */}
      <path d="M32 40 L38 36" stroke="#111827" strokeWidth="2" strokeLinecap="round"/>
      <path d="M50 36 L56 40" stroke="#111827" strokeWidth="2" strokeLinecap="round"/>
      {/* 大眼睛往上看 */}
      <ellipse cx="36" cy="44" rx="5" ry="6" fill="white" stroke="#111827" strokeWidth="1.5"/>
      <ellipse cx="52" cy="44" rx="5" ry="6" fill="white" stroke="#111827" strokeWidth="1.5"/>
      <circle cx="37" cy="43" r="2.5" fill="#111827"/>
      <circle cx="53" cy="43" r="2.5" fill="#111827"/>
      <circle cx="38" cy="42" r="1" fill="white"/>
      <circle cx="54" cy="42" r="1" fill="white"/>
    </svg>
  )
}

export default function ScrollingBanner({ items }: { items: string[] }) {
  const text = items.join('   ·   ') + '   ·   '

  return (
    <div className="relative">
      <div className="overflow-hidden bg-amber-50 border-b border-amber-100 h-8 flex items-center select-none">
        <div className="animate-marquee whitespace-nowrap text-xs text-amber-700/50 font-medium tracking-wide">
          <span>{text}</span>
          <span>{text}</span>
        </div>
      </div>
      {/* 偷看的球员 */}
      <div className="absolute top-full right-12 md:right-16 pointer-events-none z-0 block">
        <PeekingCharacter />
      </div>
    </div>
  )
}
