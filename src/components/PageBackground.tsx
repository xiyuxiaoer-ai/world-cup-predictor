type Variant = 'auth' | 'home' | 'records' | 'members' | 'rules' | 'profile'

function AuthBg() {
  return (
    <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" width="700" height="700" viewBox="0 0 700 700" fill="none">
      {/* 中圈 */}
      <circle cx="350" cy="350" r="220" stroke="white" strokeWidth="1.5"/>
      {/* 中心点 */}
      <circle cx="350" cy="350" r="8" fill="white"/>
      {/* 中线 */}
      <line x1="350" y1="0" x2="350" y2="700" stroke="white" strokeWidth="1.5"/>
      {/* 点球弧 */}
      <path d="M 200 700 A 180 180 0 0 1 500 700" stroke="white" strokeWidth="1" strokeDasharray="6 4"/>
    </svg>
  )
}

function HomeBg() {
  return (
    <>
      {/* 右下角球旗 */}
      <svg className="absolute bottom-0 right-0" width="300" height="300" viewBox="0 0 300 300" fill="none">
        {/* 角球弧 */}
        <path d="M 300 300 A 200 200 0 0 0 100 300" stroke="white" strokeWidth="1.5" strokeDasharray="8 5"/>
        <path d="M 300 300 A 140 140 0 0 0 160 300" stroke="white" strokeWidth="1"/>
        {/* 角旗杆 */}
        <line x1="295" y1="300" x2="295" y2="200" stroke="white" strokeWidth="2"/>
        {/* 角旗 */}
        <path d="M 295 200 L 260 220 L 295 240" fill="white" opacity="0.6"/>
      </svg>
      {/* 左上角边线 */}
      <svg className="absolute top-0 left-0" width="200" height="200" viewBox="0 0 200 200" fill="none">
        <line x1="0" y1="40" x2="200" y2="40" stroke="white" strokeWidth="1"/>
        <line x1="40" y1="0" x2="40" y2="200" stroke="white" strokeWidth="1"/>
      </svg>
    </>
  )
}

function RecordsBg() {
  return (
    <svg className="absolute right-0 top-0 h-full" width="300" viewBox="0 0 300 800" fill="none" preserveAspectRatio="xMaxYMid slice">
      {/* 球门网格 */}
      <defs>
        <pattern id="net-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 30" stroke="white" strokeWidth="0.6"/>
          <path d="M 0 0 L 30 30" stroke="white" strokeWidth="0.6"/>
        </pattern>
      </defs>
      <rect x="100" y="0" width="200" height="800" fill="url(#net-pattern)"/>
      {/* 球门横梁和立柱 */}
      <line x1="100" y1="0" x2="300" y2="0" stroke="white" strokeWidth="3"/>
      <line x1="100" y1="0" x2="100" y2="800" stroke="white" strokeWidth="3"/>
    </svg>
  )
}

function MembersBg() {
  return (
    <svg className="absolute right-4 top-1/2 -translate-y-1/2 opacity-80" width="220" height="320" viewBox="0 0 220 320" fill="none">
      {/* 奖杯主体 */}
      <path d="M 65 30 L 155 30 L 165 110 C 170 155 190 175 190 210 L 30 210 C 30 175 50 155 55 110 Z" stroke="white" strokeWidth="1.5"/>
      {/* 奖杯把手 */}
      <path d="M 55 60 Q 20 80 25 120 Q 28 145 55 150" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M 165 60 Q 200 80 195 120 Q 192 145 165 150" stroke="white" strokeWidth="1.5" fill="none"/>
      {/* 奖杯底座 */}
      <rect x="75" y="210" width="70" height="18" rx="2" stroke="white" strokeWidth="1.5"/>
      <rect x="55" y="228" width="110" height="14" rx="2" stroke="white" strokeWidth="1.5"/>
      {/* 星星 */}
      <text x="110" y="175" textAnchor="middle" fill="white" fontSize="36" fontFamily="system-ui">★</text>
      {/* 底部线条装饰 */}
      <line x1="20" y1="310" x2="200" y2="310" stroke="white" strokeWidth="1" strokeDasharray="5 3"/>
    </svg>
  )
}

function RulesBg() {
  return (
    <svg className="absolute bottom-10 left-4" width="280" height="200" viewBox="0 0 280 200" fill="none">
      {/* 足球圆形 */}
      <circle cx="70" cy="130" r="55" stroke="white" strokeWidth="1.5"/>
      {/* 足球花纹（简化五边形） */}
      <circle cx="70" cy="130" r="15" stroke="white" strokeWidth="1"/>
      <line x1="70" y1="115" x2="55" y2="106" stroke="white" strokeWidth="0.8"/>
      <line x1="70" y1="115" x2="85" y2="106" stroke="white" strokeWidth="0.8"/>
      <line x1="70" y1="145" x2="55" y2="154" stroke="white" strokeWidth="0.8"/>
      <line x1="70" y1="145" x2="85" y2="154" stroke="white" strokeWidth="0.8"/>
      {/* 弹道弧线 */}
      <path d="M 125 130 Q 190 20 275 50" stroke="white" strokeWidth="1.5" strokeDasharray="8 5"/>
      {/* 弧线终点 */}
      <circle cx="275" cy="50" r="5" fill="white" opacity="0.5"/>
    </svg>
  )
}

function ProfileBg() {
  return (
    <svg className="absolute bottom-0 right-0" width="250" height="300" viewBox="0 0 250 300" fill="none">
      {/* 球衣轮廓 */}
      <path d="M 80 20 L 40 60 L 70 75 L 70 250 L 180 250 L 180 75 L 210 60 L 170 20 Q 150 40 125 40 Q 100 40 80 20 Z"
        stroke="white" strokeWidth="1.5"/>
      {/* 球衣号码 */}
      <text x="125" y="170" textAnchor="middle" fill="white" fontSize="48" fontFamily="system-ui" fontWeight="bold" opacity="0.4">10</text>
      {/* 领口 */}
      <path d="M 80 20 Q 100 50 125 50 Q 150 50 170 20" stroke="white" strokeWidth="1.5" fill="none"/>
    </svg>
  )
}

export default function PageBackground({ variant }: { variant: Variant }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-[0.04]">
      {variant === 'auth'    && <AuthBg />}
      {variant === 'home'    && <HomeBg />}
      {variant === 'records' && <RecordsBg />}
      {variant === 'members' && <MembersBg />}
      {variant === 'rules'   && <RulesBg />}
      {variant === 'profile' && <ProfileBg />}
    </div>
  )
}
