import { cn } from '@/lib/utils'
import { useSvgId } from './useSvgId'

function Sparkle({ x, y, s = 1, delay = '0s' }: { x: number; y: number; s?: number; delay?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -9 C1 -2 2 -1 9 0 C2 1 1 2 0 9 C-1 2 -2 1 -9 0 C-2 -1 -1 -2 0 -9 Z"
      fill="#fff6d0"
      className="animate-twinkle"
      style={{ animationDelay: delay }}
    />
  )
}

/** Championship trophy illustration with a kite emblem on the cup. */
export function TrophyArt({ className, glow = true }: { className?: string; glow?: boolean }) {
  const g = useSvgId()
  const url = (n: string) => `url(#${g(n)})`

  return (
    <svg viewBox="0 0 240 320" className={cn('h-auto w-full', className)} role="img" aria-label="Championship trophy">
      <defs>
        <linearGradient id={g('gold')} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#6e4906" />
          <stop offset="0.22" stopColor="#d9a52c" />
          <stop offset="0.4" stopColor="#fff0b3" />
          <stop offset="0.6" stopColor="#efbf45" />
          <stop offset="1" stopColor="#7d5508" />
        </linearGradient>
        <linearGradient id={g('goldV')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffe9a0" />
          <stop offset="1" stopColor="#a8760e" />
        </linearGradient>
        <radialGradient id={g('halo')} cx="50%" cy="45%" r="50%">
          <stop offset="0" stopColor="#f4c94e" stopOpacity="0.45" />
          <stop offset="0.4" stopColor="#c3f03c" stopOpacity="0.16" />
          <stop offset="1" stopColor="#c3f03c" stopOpacity="0" />
        </radialGradient>
        <filter id={g('blur')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {glow && <ellipse cx="120" cy="140" rx="120" ry="150" fill={url('halo')} />}
      <ellipse cx="120" cy="312" rx="70" ry="7" fill="#000" opacity="0.6" filter={url('blur')} />

      {/* Handles */}
      <g fill="none" strokeLinecap="round" strokeWidth="9" stroke={url('goldV')}>
        <path d="M54 62 C16 60 14 120 70 142" />
        <path d="M186 62 C224 60 226 120 170 142" />
      </g>

      {/* Cup */}
      <path d="M50 42 H190 V92 C190 150 160 186 120 192 C80 186 50 150 50 92 Z" fill={url('gold')} />
      <path
        d="M76 54 C74 110 86 150 106 172"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="6"
        strokeLinecap="round"
        filter={url('blur')}
      />
      <ellipse cx="120" cy="42" rx="70" ry="8" fill="#ffe7a1" />
      <ellipse cx="120" cy="42.5" rx="63" ry="5" fill="#5c3d05" />

      {/* Emblem */}
      <g transform="translate(120 108)">
        <path d="M0 -24 L19 -6 L0 24 L-19 -6 Z" fill="#7d5508" opacity="0.55" />
        <path d="M0 -21 L16 -6 L0 20 L-16 -6 Z" fill="none" stroke="#fff4c4" strokeOpacity="0.8" strokeWidth="1.6" />
        <path d="M0 -21 V20 M-16 -6 H16" stroke="#fff4c4" strokeOpacity="0.5" strokeWidth="1" />
      </g>

      {/* Stem & base */}
      <path d="M107 190 H133 L128 222 H112 Z" fill={url('gold')} />
      <ellipse cx="120" cy="224" rx="22" ry="7" fill={url('goldV')} />
      <path d="M112 228 C112 246 92 250 88 262 H152 C148 250 128 246 128 228 Z" fill={url('gold')} />
      <rect x="78" y="262" width="84" height="12" rx="3" fill={url('goldV')} />
      <rect x="68" y="274" width="104" height="36" rx="6" fill="#111611" stroke="#f4c94e" strokeOpacity="0.35" />
      <rect x="92" y="285" width="56" height="14" rx="3" fill="#c3f03c" />
      <text
        x="120"
        y="296"
        textAnchor="middle"
        fontFamily="'Archivo Variable', Archivo, sans-serif"
        fontWeight="900"
        fontSize="10.5"
        letterSpacing="2"
        fill="#050705"
      >
        2027
      </text>

      <Sparkle x={34} y={40} s={0.9} />
      <Sparkle x={212} y={92} s={0.7} delay="1.1s" />
      <Sparkle x={196} y={20} s={0.5} delay="0.5s" />
      <Sparkle x={26} y={182} s={0.55} delay="1.8s" />
    </svg>
  )
}
