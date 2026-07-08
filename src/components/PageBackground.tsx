type Variant = 'auth' | 'home' | 'records' | 'members' | 'rules' | 'profile' | 'bracket'

function AuthBg() {
  return (
    <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" width="700" height="700" viewBox="0 0 700 700" fill="none">
      <circle cx="350" cy="350" r="220" stroke="#111827" strokeWidth="1.5"/>
      <circle cx="350" cy="350" r="8" fill="#111827"/>
      <line x1="350" y1="0" x2="350" y2="700" stroke="#111827" strokeWidth="1.5"/>
      <path d="M 200 700 A 180 180 0 0 1 500 700" stroke="#111827" strokeWidth="1" strokeDasharray="6 4"/>
    </svg>
  )
}

function HomeBg() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 900" fill="none" preserveAspectRatio="xMidYMid slice">
      {/* 中圈 */}
      <circle cx="400" cy="420" r="180" stroke="#111827" strokeWidth="1.5"/>
      <circle cx="400" cy="420" r="8" fill="#111827"/>
      {/* 中线 */}
      <line x1="0" y1="420" x2="800" y2="420" stroke="#111827" strokeWidth="1.5"/>
      {/* 外边框 */}
      <rect x="30" y="30" width="740" height="840" stroke="#111827" strokeWidth="1.5"/>
      {/* 上半场禁区 */}
      <rect x="230" y="30" width="340" height="120" stroke="#111827" strokeWidth="1"/>
      {/* 上半场小禁区 */}
      <rect x="310" y="30" width="180" height="55" stroke="#111827" strokeWidth="1"/>
      {/* 上半场点球点 */}
      <circle cx="400" cy="150" r="4" fill="#111827"/>
      {/* 上半场点球弧 */}
      <path d="M 320 120 A 90 90 0 0 1 480 120" stroke="#111827" strokeWidth="1" strokeDasharray="5 4"/>
      {/* 下半场禁区 */}
      <rect x="230" y="750" width="340" height="120" stroke="#111827" strokeWidth="1"/>
      {/* 下半场小禁区 */}
      <rect x="310" y="815" width="180" height="55" stroke="#111827" strokeWidth="1"/>
      {/* 下半场点球点 */}
      <circle cx="400" cy="720" r="4" fill="#111827"/>
      {/* 下半场点球弧 */}
      <path d="M 320 750 A 90 90 0 0 0 480 750" stroke="#111827" strokeWidth="1" strokeDasharray="5 4"/>
      {/* 左上角球旗弧 */}
      <path d="M 30 30 A 28 28 0 0 1 58 58" stroke="#111827" strokeWidth="1"/>
      {/* 右上角球旗弧 */}
      <path d="M 770 30 A 28 28 0 0 0 742 58" stroke="#111827" strokeWidth="1"/>
      {/* 左下角球旗弧 */}
      <path d="M 30 870 A 28 28 0 0 0 58 842" stroke="#111827" strokeWidth="1"/>
      {/* 右下角球旗弧 */}
      <path d="M 770 870 A 28 28 0 0 1 742 842" stroke="#111827" strokeWidth="1"/>
      {/* 左上球旗 */}
      <line x1="30" y1="10" x2="30" y2="50" stroke="#111827" strokeWidth="2"/>
      <path d="M 30 10 L 55 20 L 30 30" fill="#111827" opacity="0.5"/>
      {/* 右上球旗 */}
      <line x1="770" y1="10" x2="770" y2="50" stroke="#111827" strokeWidth="2"/>
      <path d="M 770 10 L 745 20 L 770 30" fill="#111827" opacity="0.5"/>
    </svg>
  )
}

function RecordsBg() {
  return (
    <svg className="absolute right-0 top-0 h-full" width="300" viewBox="0 0 300 800" fill="none" preserveAspectRatio="xMaxYMid slice">
      <defs>
        <pattern id="net-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 30" stroke="#111827" strokeWidth="0.6"/>
          <path d="M 0 0 L 30 30" stroke="#111827" strokeWidth="0.6"/>
        </pattern>
      </defs>
      <rect x="100" y="0" width="200" height="800" fill="url(#net-pattern)"/>
      <line x1="100" y1="0" x2="300" y2="0" stroke="#111827" strokeWidth="3"/>
      <line x1="100" y1="0" x2="100" y2="800" stroke="#111827" strokeWidth="3"/>
    </svg>
  )
}

function MembersBg() {
  return (
    <svg className="absolute right-4 top-1/2 -translate-y-1/2 opacity-80" width="220" height="320" viewBox="0 0 220 320" fill="none">
      <path d="M 65 30 L 155 30 L 165 110 C 170 155 190 175 190 210 L 30 210 C 30 175 50 155 55 110 Z" stroke="#111827" strokeWidth="1.5"/>
      <path d="M 55 60 Q 20 80 25 120 Q 28 145 55 150" stroke="#111827" strokeWidth="1.5" fill="none"/>
      <path d="M 165 60 Q 200 80 195 120 Q 192 145 165 150" stroke="#111827" strokeWidth="1.5" fill="none"/>
      <rect x="75" y="210" width="70" height="18" rx="2" stroke="#111827" strokeWidth="1.5"/>
      <rect x="55" y="228" width="110" height="14" rx="2" stroke="#111827" strokeWidth="1.5"/>
      <text x="110" y="175" textAnchor="middle" fill="#111827" fontSize="36" fontFamily="system-ui">★</text>
      <line x1="20" y1="310" x2="200" y2="310" stroke="#111827" strokeWidth="1" strokeDasharray="5 3"/>
    </svg>
  )
}

function RulesBg() {
  return (
    <svg className="absolute bottom-10 left-4" width="280" height="200" viewBox="0 0 280 200" fill="none">
      <circle cx="70" cy="130" r="55" stroke="#111827" strokeWidth="1.5"/>
      <circle cx="70" cy="130" r="15" stroke="#111827" strokeWidth="1"/>
      <line x1="70" y1="115" x2="55" y2="106" stroke="#111827" strokeWidth="0.8"/>
      <line x1="70" y1="115" x2="85" y2="106" stroke="#111827" strokeWidth="0.8"/>
      <line x1="70" y1="145" x2="55" y2="154" stroke="#111827" strokeWidth="0.8"/>
      <line x1="70" y1="145" x2="85" y2="154" stroke="#111827" strokeWidth="0.8"/>
      <path d="M 125 130 Q 190 20 275 50" stroke="#111827" strokeWidth="1.5" strokeDasharray="8 5"/>
      <circle cx="275" cy="50" r="5" fill="#111827" opacity="0.5"/>
    </svg>
  )
}

function ProfileBg() {
  return (
    <svg className="absolute bottom-0 right-0" width="250" height="300" viewBox="0 0 250 300" fill="none">
      <path d="M 80 20 L 40 60 L 70 75 L 70 250 L 180 250 L 180 75 L 210 60 L 170 20 Q 150 40 125 40 Q 100 40 80 20 Z"
        stroke="#111827" strokeWidth="1.5"/>
      <text x="125" y="170" textAnchor="middle" fill="#111827" fontSize="48" fontFamily="system-ui" fontWeight="bold" opacity="0.4">10</text>
      <path d="M 80 20 Q 100 50 125 50 Q 150 50 170 20" stroke="#111827" strokeWidth="1.5" fill="none"/>
    </svg>
  )
}

function BracketBg() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="qfPitchLine" x1="0" y1="0" x2="1200" y2="800">
          <stop stopColor="currentColor" stopOpacity="0.55" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      <rect x="90" y="120" width="1020" height="560" rx="28" stroke="url(#qfPitchLine)" strokeWidth="1.4" />
      <line x1="600" y1="120" x2="600" y2="680" stroke="url(#qfPitchLine)" strokeWidth="1.2" />
      <circle cx="600" cy="400" r="116" stroke="url(#qfPitchLine)" strokeWidth="1.2" />
      <circle cx="600" cy="400" r="5" fill="currentColor" opacity="0.28" />

      <rect x="90" y="270" width="160" height="260" rx="18" stroke="url(#qfPitchLine)" strokeWidth="1.1" />
      <rect x="950" y="270" width="160" height="260" rx="18" stroke="url(#qfPitchLine)" strokeWidth="1.1" />

      <path d="M250 320 C320 350 320 450 250 480" stroke="url(#qfPitchLine)" strokeWidth="1" strokeDasharray="8 8" />
      <path d="M950 320 C880 350 880 450 950 480" stroke="url(#qfPitchLine)" strokeWidth="1" strokeDasharray="8 8" />

      <path d="M160 170 L300 230 L160 290" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
      <path d="M1040 170 L900 230 L1040 290" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
    </svg>
  )
}

export default function PageBackground({ variant }: { variant: Variant }) {
  return (
    <>
      {/* 环境光晕色斑（为毛玻璃提供背景色彩层次） */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
        <div className="absolute -top-1/4 -right-1/5 w-[80vw] h-[80vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(214,168,79,0.24) 0%, rgba(214,168,79,0.08) 45%, transparent 70%)' }} />
        <div className="absolute -bottom-1/4 -left-1/5 w-[70vw] h-[70vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(15,118,110,0.18) 0%, rgba(56,189,248,0.07) 45%, transparent 70%)' }} />
        <div className="absolute top-[24%] left-[12%] w-[48vw] h-[48vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 64%)' }} />
      </div>
      {/* 足球场 SVG 纹理 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-[0.08] text-slate-900 dark:text-white">
        {variant === 'auth'    && <AuthBg />}
        {variant === 'home'    && <HomeBg />}
        {variant === 'records' && <RecordsBg />}
        {variant === 'members' && <MembersBg />}
        {variant === 'rules'   && <RulesBg />}
        {variant === 'profile' && <ProfileBg />}
        {variant === 'bracket' && <BracketBg />}
      </div>
    </>
  )
}
