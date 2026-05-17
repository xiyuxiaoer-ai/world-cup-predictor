type Variant = 'auth' | 'home' | 'records' | 'members' | 'rules' | 'profile'

function AuthBg() {
  return (
    <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" width="700" height="700" viewBox="0 0 700 700" fill="none">
      <circle cx="350" cy="350" r="220" stroke="white" strokeWidth="1.5"/>
      <circle cx="350" cy="350" r="8" fill="white"/>
      <line x1="350" y1="0" x2="350" y2="700" stroke="white" strokeWidth="1.5"/>
      <path d="M 200 700 A 180 180 0 0 1 500 700" stroke="white" strokeWidth="1" strokeDasharray="6 4"/>
    </svg>
  )
}

function HomeBg() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 900" fill="none" preserveAspectRatio="xMidYMid slice">
      {/* 中圈 */}
      <circle cx="400" cy="420" r="180" stroke="white" strokeWidth="1.5"/>
      <circle cx="400" cy="420" r="8" fill="white"/>
      {/* 中线 */}
      <line x1="0" y1="420" x2="800" y2="420" stroke="white" strokeWidth="1.5"/>
      {/* 外边框 */}
      <rect x="30" y="30" width="740" height="840" stroke="white" strokeWidth="1.5"/>
      {/* 上半场禁区 */}
      <rect x="230" y="30" width="340" height="120" stroke="white" strokeWidth="1"/>
      {/* 上半场小禁区 */}
      <rect x="310" y="30" width="180" height="55" stroke="white" strokeWidth="1"/>
      {/* 上半场点球点 */}
      <circle cx="400" cy="150" r="4" fill="white"/>
      {/* 上半场点球弧 */}
      <path d="M 320 120 A 90 90 0 0 1 480 120" stroke="white" strokeWidth="1" strokeDasharray="5 4"/>
      {/* 下半场禁区 */}
      <rect x="230" y="750" width="340" height="120" stroke="white" strokeWidth="1"/>
      {/* 下半场小禁区 */}
      <rect x="310" y="815" width="180" height="55" stroke="white" strokeWidth="1"/>
      {/* 下半场点球点 */}
      <circle cx="400" cy="720" r="4" fill="white"/>
      {/* 下半场点球弧 */}
      <path d="M 320 750 A 90 90 0 0 0 480 750" stroke="white" strokeWidth="1" strokeDasharray="5 4"/>
      {/* 左上角球旗弧 */}
      <path d="M 30 30 A 28 28 0 0 1 58 58" stroke="white" strokeWidth="1"/>
      {/* 右上角球旗弧 */}
      <path d="M 770 30 A 28 28 0 0 0 742 58" stroke="white" strokeWidth="1"/>
      {/* 左下角球旗弧 */}
      <path d="M 30 870 A 28 28 0 0 0 58 842" stroke="white" strokeWidth="1"/>
      {/* 右下角球旗弧 */}
      <path d="M 770 870 A 28 28 0 0 1 742 842" stroke="white" strokeWidth="1"/>
      {/* 左上球旗 */}
      <line x1="30" y1="10" x2="30" y2="50" stroke="white" strokeWidth="2"/>
      <path d="M 30 10 L 55 20 L 30 30" fill="white" opacity="0.5"/>
      {/* 右上球旗 */}
      <line x1="770" y1="10" x2="770" y2="50" stroke="white" strokeWidth="2"/>
      <path d="M 770 10 L 745 20 L 770 30" fill="white" opacity="0.5"/>
    </svg>
  )
}

function RecordsBg() {
  return (
    <svg className="absolute right-0 top-0 h-full" width="300" viewBox="0 0 300 800" fill="none" preserveAspectRatio="xMaxYMid slice">
      <defs>
        <pattern id="net-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 30" stroke="white" strokeWidth="0.6"/>
          <path d="M 0 0 L 30 30" stroke="white" strokeWidth="0.6"/>
        </pattern>
      </defs>
      <rect x="100" y="0" width="200" height="800" fill="url(#net-pattern)"/>
      <line x1="100" y1="0" x2="300" y2="0" stroke="white" strokeWidth="3"/>
      <line x1="100" y1="0" x2="100" y2="800" stroke="white" strokeWidth="3"/>
    </svg>
  )
}

function MembersBg() {
  return (
    <svg className="absolute right-4 top-1/2 -translate-y-1/2 opacity-80" width="220" height="320" viewBox="0 0 220 320" fill="none">
      <path d="M 65 30 L 155 30 L 165 110 C 170 155 190 175 190 210 L 30 210 C 30 175 50 155 55 110 Z" stroke="white" strokeWidth="1.5"/>
      <path d="M 55 60 Q 20 80 25 120 Q 28 145 55 150" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M 165 60 Q 200 80 195 120 Q 192 145 165 150" stroke="white" strokeWidth="1.5" fill="none"/>
      <rect x="75" y="210" width="70" height="18" rx="2" stroke="white" strokeWidth="1.5"/>
      <rect x="55" y="228" width="110" height="14" rx="2" stroke="white" strokeWidth="1.5"/>
      <text x="110" y="175" textAnchor="middle" fill="white" fontSize="36" fontFamily="system-ui">★</text>
      <line x1="20" y1="310" x2="200" y2="310" stroke="white" strokeWidth="1" strokeDasharray="5 3"/>
    </svg>
  )
}

function RulesBg() {
  return (
    <svg className="absolute bottom-10 left-4" width="280" height="200" viewBox="0 0 280 200" fill="none">
      <circle cx="70" cy="130" r="55" stroke="white" strokeWidth="1.5"/>
      <circle cx="70" cy="130" r="15" stroke="white" strokeWidth="1"/>
      <line x1="70" y1="115" x2="55" y2="106" stroke="white" strokeWidth="0.8"/>
      <line x1="70" y1="115" x2="85" y2="106" stroke="white" strokeWidth="0.8"/>
      <line x1="70" y1="145" x2="55" y2="154" stroke="white" strokeWidth="0.8"/>
      <line x1="70" y1="145" x2="85" y2="154" stroke="white" strokeWidth="0.8"/>
      <path d="M 125 130 Q 190 20 275 50" stroke="white" strokeWidth="1.5" strokeDasharray="8 5"/>
      <circle cx="275" cy="50" r="5" fill="white" opacity="0.5"/>
    </svg>
  )
}

function ProfileBg() {
  return (
    <svg className="absolute bottom-0 right-0" width="250" height="300" viewBox="0 0 250 300" fill="none">
      <path d="M 80 20 L 40 60 L 70 75 L 70 250 L 180 250 L 180 75 L 210 60 L 170 20 Q 150 40 125 40 Q 100 40 80 20 Z"
        stroke="white" strokeWidth="1.5"/>
      <text x="125" y="170" textAnchor="middle" fill="white" fontSize="48" fontFamily="system-ui" fontWeight="bold" opacity="0.4">10</text>
      <path d="M 80 20 Q 100 50 125 50 Q 150 50 170 20" stroke="white" strokeWidth="1.5" fill="none"/>
    </svg>
  )
}

export default function PageBackground({ variant }: { variant: Variant }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
      {variant === 'auth'    && <AuthBg />}
      {variant === 'home'    && <HomeBg />}
      {variant === 'records' && <RecordsBg />}
      {variant === 'members' && <MembersBg />}
      {variant === 'rules'   && <RulesBg />}
      {variant === 'profile' && <ProfileBg />}
    </div>
  )
}
