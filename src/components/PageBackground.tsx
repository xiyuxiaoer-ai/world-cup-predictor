type Variant =
  | 'auth'
  | 'home'
  | 'records'
  | 'members'
  | 'rules'
  | 'profile'
  | 'bracket'

type BackgroundPlacement = {
  position: string
  size: string
  opacity: number
}

type BackgroundConfig = {
  src: string
  mobile: BackgroundPlacement
  desktop: BackgroundPlacement
}

const BG_ILLUSTRATIONS: Record<Variant, BackgroundConfig> = {
  auth: {
    src: '/backgrounds/bg-auth-center-circle.png',
    mobile: {
      position: 'center center',
      size: 'cover',
      opacity: 0.26,
    },
    desktop: {
      position: 'center center',
      size: '60% auto',
      opacity: 0.22,
    },
  },

  home: {
    src: '/backgrounds/bg-home-pitch-overview.png',
    mobile: {
      position: 'center center',
      size: 'cover',
      opacity: 0.18,
    },
    desktop: {
      position: 'center center',
      size: 'cover',
      opacity: 0.10,
    },
  },

  records: {
    src: '/backgrounds/bg-records-goal-sketch.png',
    mobile: {
      position: 'right center',
      size: '70% auto',
      opacity: 0.20,
    },
    desktop: {
      position: 'right center',
      size: '36% auto',
      opacity: 0.15,
    },
  },

  members: {
    src: '/backgrounds/bg-members-trophy.png',
    mobile: {
      position: 'right 58%',
      size: '58% auto',
      opacity: 0.22,
    },
    desktop: {
      position: 'right 58%',
      size: '32% auto',
      opacity: 0.18,
    },
  },

  rules: {
    src: '/backgrounds/bg-rules-tactics.png',
    mobile: {
      position: 'right bottom',
      size: '72% auto',
      opacity: 0.20,
    },
    desktop: {
      position: 'right bottom',
      size: '40% auto',
      opacity: 0.16,
    },
  },

  profile: {
    src: '/backgrounds/bg-profile-jersey10.png',
    mobile: {
      position: 'right bottom',
      size: '68% auto',
      opacity: 0.20,
    },
    desktop: {
      position: 'right bottom',
      size: '36% auto',
      opacity: 0.16,
    },
  },

  bracket: {
    src: '/backgrounds/bg-bracket-knockout.png',
    mobile: {
      position: 'center center',
      size: 'cover',
      opacity: 0.16,
    },
    desktop: {
      position: 'center center',
      size: 'cover',
      opacity: 0.08,
    },
  },
}

function BackgroundImageLayer({
  src,
  placement,
  className,
}: {
  src: string
  placement: BackgroundPlacement
  className: string
}) {
  return (
    <div
      className={`absolute inset-0 bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundPosition: placement.position,
        backgroundSize: placement.size,
        opacity: placement.opacity,
      }}
    />
  )
}

function IllustrationLayer({ variant }: { variant: Variant }) {
  const cfg = BG_ILLUSTRATIONS[variant]

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none z-0 dark:hidden"
      aria-hidden
    >
      <BackgroundImageLayer
        src={cfg.src}
        placement={cfg.mobile}
        className="sm:hidden"
      />

      <BackgroundImageLayer
        src={cfg.src}
        placement={cfg.desktop}
        className="hidden sm:block"
      />
    </div>
  )
}

export default function PageBackground({ variant }: { variant: Variant }) {
  return (
    <>
      {/* 环境光晕色斑：保留现有高级玻璃所需的背景色彩层次 */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none z-0"
        aria-hidden
      >
        <div
          className="absolute -top-1/4 -right-1/5 w-[80vw] h-[80vw] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(214,168,79,0.24) 0%, rgba(214,168,79,0.08) 45%, transparent 70%)',
          }}
        />

        <div
          className="absolute -bottom-1/4 -left-1/5 w-[70vw] h-[70vw] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(15,118,110,0.18) 0%, rgba(56,189,248,0.07) 45%, transparent 70%)',
          }}
        />

        <div
          className="absolute top-[24%] left-[12%] w-[48vw] h-[48vw] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 64%)',
          }}
        />
      </div>

      {/* 新的铅笔素描 + 淡水彩插画背景层：只在 light mode 显示 */}
      <IllustrationLayer variant={variant} />
    </>
  )
}
