import { cn } from '@/lib/utils'
import { useSvgId } from './useSvgId'

const GRIP_RIDGES = Array.from({ length: 16 }, (_, i) => i)
const FLOODLIGHT_CELLS = Array.from({ length: 8 }, (_, i) => i)

function Floodlight({ x, y, scale = 1, glowId }: { x: number; y: number; scale?: number; glowId: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="28" cy="12" r="70" fill={`url(#${glowId})`} />
      <rect x="-2" y="-4" width="60" height="32" rx="4" fill="#0b100b" stroke="#2a332a" />
      {FLOODLIGHT_CELLS.map((i) => (
        <rect key={i} x={3 + (i % 4) * 13.5} y={i < 4 ? 1 : 14} width="10" height="9" rx="2" fill="#f6ffe3" />
      ))}
    </g>
  )
}

/**
 * Hero illustration: a bat that has just struck the ball, stumps behind,
 * under floodlights. Pure SVG so it stays crisp on every display.
 */
export function HeroArt({ className }: { className?: string }) {
  const g = useSvgId()
  const url = (n: string) => `url(#${g(n)})`

  return (
    <svg
      viewBox="0 0 600 560"
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label="Cricket bat striking a red ball beside the stumps under floodlights"
    >
      <defs>
        <radialGradient id={g('glow')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#c3f03c" stopOpacity="0.34" />
          <stop offset="0.45" stopColor="#c3f03c" stopOpacity="0.09" />
          <stop offset="1" stopColor="#c3f03c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g('lamp')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f3fed6" stopOpacity="0.55" />
          <stop offset="0.3" stopColor="#c3f03c" stopOpacity="0.14" />
          <stop offset="1" stopColor="#c3f03c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g('grass')} cx="50%" cy="25%" r="65%">
          <stop offset="0" stopColor="#3a5c14" />
          <stop offset="0.5" stopColor="#15240b" />
          <stop offset="1" stopColor="#050705" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g('blade')} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#9c6a33" />
          <stop offset="0.16" stopColor="#d4a462" />
          <stop offset="0.48" stopColor="#f4dba6" />
          <stop offset="0.8" stopColor="#d9ad6c" />
          <stop offset="1" stopColor="#8f5e2b" />
        </linearGradient>
        <linearGradient id={g('bladeShade')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={g('grip')} x1="0" x2="1">
          <stop offset="0" stopColor="#173d0d" />
          <stop offset="0.45" stopColor="#4c9c20" />
          <stop offset="1" stopColor="#123209" />
        </linearGradient>
        <radialGradient id={g('ball')} cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#ff8a72" />
          <stop offset="0.32" stopColor="#d81f2a" />
          <stop offset="0.72" stopColor="#8a0b14" />
          <stop offset="1" stopColor="#3d0408" />
        </radialGradient>
        <linearGradient id={g('trail')} x1="305" y1="262" x2="185" y2="175" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c3f03c" stopOpacity="0" />
          <stop offset="0.6" stopColor="#c3f03c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f3fed6" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={g('stump')} x1="0" x2="1">
          <stop offset="0" stopColor="#a8936a" />
          <stop offset="0.45" stopColor="#f7eed6" />
          <stop offset="1" stopColor="#8f7a52" />
        </linearGradient>
        <radialGradient id={g('flash')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="#e6fca8" stopOpacity="0.6" />
          <stop offset="1" stopColor="#c3f03c" stopOpacity="0" />
        </radialGradient>
        <clipPath id={g('gripClip')}>
          <rect x="-12" y="0" width="24" height="160" rx="11" />
        </clipPath>
        <clipPath id={g('ballClip')}>
          <circle r="56" />
        </clipPath>
        <filter id={g('blur8')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id={g('blur3')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Ambient light & floodlights */}
      <ellipse cx="320" cy="300" rx="300" ry="270" fill={url('glow')} />
      <g className="animate-pulse-glow">
        <Floodlight x={470} y={40} scale={0.9} glowId={g('lamp')} />
        <Floodlight x={548} y={118} scale={0.6} glowId={g('lamp')} />
      </g>
      <path d="M500 70 L250 520 L420 520 Z" fill="#e6fca8" opacity="0.035" />

      {/* Ground */}
      <ellipse cx="300" cy="492" rx="300" ry="72" fill={url('grass')} />
      <g fill="none" stroke="#c3f03c" strokeOpacity="0.06">
        <ellipse cx="300" cy="492" rx="230" ry="44" />
        <ellipse cx="300" cy="492" rx="150" ry="26" />
      </g>

      {/* Stumps */}
      <ellipse cx="465" cy="486" rx="56" ry="9" fill="#000" opacity="0.55" filter={url('blur3')} />
      {[430, 458, 486].map((x) => (
        <g key={x}>
          <rect x={x} y="262" width="14" height="224" rx="7" fill={url('stump')} />
          <rect x={x + 1} y="270" width="2" height="200" rx="1" fill="#c3f03c" opacity="0.45" />
        </g>
      ))}
      <rect x="428" y="253" width="31" height="8" rx="4" fill={url('stump')} />
      <rect x="459" y="253" width="43" height="8" rx="4" fill={url('stump')} />

      {/* Bat shadow */}
      <ellipse cx="180" cy="490" rx="64" ry="10" fill="#000" opacity="0.6" filter={url('blur3')} />

      {/* Bat */}
      <g transform="translate(430 70) rotate(33) scale(0.96)">
        <path
          d="M46 200 L46 478"
          stroke="#c3f03c"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.5"
          filter={url('blur3')}
        />
        <rect x="-12" y="0" width="24" height="160" rx="11" fill={url('grip')} />
        <g clipPath={url('gripClip')}>
          {GRIP_RIDGES.map((i) => (
            <path
              key={i}
              d={`M-14 ${8 + i * 9.5} L14 ${14 + i * 9.5}`}
              stroke="#0a2205"
              strokeOpacity="0.6"
              strokeWidth="2.2"
            />
          ))}
          <rect x="-6" y="0" width="4" height="160" fill="#fff" opacity="0.16" />
        </g>
        <ellipse cx="0" cy="2" rx="12" ry="4" fill="#245c12" />
        <path
          d="M-12 150 C-12 172 -44 176 -46 200 L-46 478 Q-46 501 -24 504 L24 504 Q46 501 46 478 L46 200 C44 176 12 172 12 150 Z"
          fill={url('blade')}
        />
        <path
          d="M-12 150 C-12 172 -44 176 -46 200 L-46 478 Q-46 501 -24 504 L24 504 Q46 501 46 478 L46 200 C44 176 12 172 12 150 Z"
          fill={url('bladeShade')}
        />
        <g stroke="#7a4c1f" strokeOpacity="0.16" strokeWidth="1.2">
          <path d="M-30 205 L-30 490" />
          <path d="M-18 200 L-18 496" />
          <path d="M18 200 L18 496" />
          <path d="M32 205 L32 490" />
        </g>
        <rect x="-10" y="210" width="12" height="270" rx="6" fill="#fff" opacity="0.14" filter={url('blur3')} />
        <path d="M-45 205 L-45 476" stroke="#fff" strokeOpacity="0.32" strokeWidth="1.5" />
        <rect x="-32" y="292" width="64" height="124" rx="8" fill="#0a0d0a" />
        <rect x="-32" y="282" width="64" height="4" rx="2" fill="#c3f03c" />
        <rect x="-32" y="422" width="64" height="4" rx="2" fill="#c3f03c" />
        <text
          transform="translate(8 354) rotate(-90)"
          textAnchor="middle"
          fontFamily="'Archivo Variable', Archivo, sans-serif"
          fontWeight="900"
          fontSize="26"
          letterSpacing="2"
          fill="#c3f03c"
          style={{ fontStretch: '115%' }}
        >
          SSCL
        </text>
        <text
          transform="translate(-14 354) rotate(-90)"
          textAnchor="middle"
          fontFamily="'Archivo Variable', Archivo, sans-serif"
          fontWeight="700"
          fontSize="11"
          letterSpacing="4"
          fill="#f6f8f5"
          opacity="0.75"
        >
          2027
        </text>
      </g>

      {/* Impact & ball trail */}
      <circle cx="305" cy="262" r="46" fill={url('flash')} />
      <polygon points="306.2,260.4 210.9,139.3 159.1,210.7 303.8,263.6" fill={url('trail')} />
      <g stroke="#e6fca8" strokeLinecap="round" opacity="0.5">
        <path d="M282 220 L238 188" strokeWidth="1.5" />
        <path d="M300 236 L262 208" strokeWidth="1" />
        <path d="M262 262 L222 233" strokeWidth="1" />
      </g>

      {/* Ball */}
      <g transform="translate(185 175)">
        <g className="animate-float" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <circle r="82" fill="#c3f03c" opacity="0.2" filter={url('blur8')} />
          <circle r="56" fill={url('ball')} />
          <g clipPath={url('ballClip')} transform="rotate(-28)">
            <path d="M-62 -8 C-30 18 30 18 62 -8" fill="none" stroke="#f3e2c0" strokeWidth="3" opacity="0.92" />
            <path
              d="M-62 -16 C-30 10 30 10 62 -16"
              fill="none"
              stroke="#f3e2c0"
              strokeWidth="3"
              strokeDasharray="0.1 6"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M-62 0 C-30 26 30 26 62 0"
              fill="none"
              stroke="#f3e2c0"
              strokeWidth="3"
              strokeDasharray="0.1 6"
              strokeLinecap="round"
              opacity="0.8"
            />
          </g>
          <ellipse cx="-19" cy="-23" rx="21" ry="12" fill="#fff" opacity="0.3" filter={url('blur3')} />
          <ellipse cx="-22" cy="-27" rx="7" ry="4" fill="#fff" opacity="0.75" />
          <path
            d="M50.7 -18.5 A54 54 0 0 1 -18.5 50.7"
            fill="none"
            stroke="#d4f86c"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.75"
          />
        </g>
      </g>

      {/* Sparkles */}
      <g fill="#e6fca8">
        <circle cx="110" cy="96" r="2" className="animate-twinkle" />
        <circle cx="262" cy="120" r="1.5" className="animate-twinkle [animation-delay:1.2s]" />
        <circle cx="360" cy="200" r="2" className="animate-twinkle [animation-delay:0.6s]" />
        <circle cx="92" cy="300" r="1.5" className="animate-twinkle [animation-delay:2s]" />
      </g>
    </svg>
  )
}
