import { useMemo } from 'react'
import { cn, seededRandom } from '@/lib/utils'
import { TrophyArt } from './TrophyArt'
import { useSvgId } from './useSvgId'

const CONFETTI_COLORS = ['#f4c94e', '#c3f03c', '#f6f8f5', '#e6fca8']

function useCrowd() {
  return useMemo(() => {
    const rand = seededRandom(2027)
    const people = Array.from({ length: 26 }, (_, i) => {
      const x = i * 26 + rand() * 12 - 6
      const head = 11 + rand() * 4
      const y = 418 + rand() * 26
      return { x, y, head, armUp: rand() > 0.62, armSide: rand() > 0.5 ? 1 : -1 }
    })
    const confetti = Array.from({ length: 46 }, () => ({
      x: rand() * 640,
      y: 30 + rand() * 300,
      r: rand() * 180,
      w: 3 + rand() * 4,
      c: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)],
      d: `${(rand() * 3).toFixed(2)}s`,
    }))
    const standLights = Array.from({ length: 70 }, () => ({
      x: rand() * 640,
      y: 214 + rand() * 46,
      d: `${(rand() * 3).toFixed(2)}s`,
    }))
    return { people, confetti, standLights }
  }, [])
}

/** Floodlit stadium with a celebrating crowd and the trophy centre-stage. */
export function StadiumScene({ className }: { className?: string }) {
  const g = useSvgId()
  const url = (n: string) => `url(#${g(n)})`
  const { people, confetti, standLights } = useCrowd()

  return (
    <div className={cn('relative isolate overflow-hidden bg-ink-950', className)}>
      <svg viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id={g('sky')} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#0c160c" />
            <stop offset="0.55" stopColor="#060906" />
            <stop offset="1" stopColor="#050705" />
          </linearGradient>
          <radialGradient id={g('lamp')} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="0.18" stopColor="#f3fed6" stopOpacity="0.4" />
            <stop offset="1" stopColor="#c3f03c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={g('field')} cx="50%" cy="20%" r="70%">
            <stop offset="0" stopColor="#3d6414" />
            <stop offset="0.45" stopColor="#172a0b" />
            <stop offset="1" stopColor="#060906" />
          </radialGradient>
          <linearGradient id={g('beam')} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f3fed6" stopOpacity="0.18" />
            <stop offset="1" stopColor="#f3fed6" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="640" height="480" fill={url('sky')} />

        {/* Light beams */}
        <path d="M70 70 L180 420 L340 420 Z" fill={url('beam')} />
        <path d="M570 70 L300 420 L460 420 Z" fill={url('beam')} />

        {/* Floodlight towers */}
        {[70, 570].map((x) => (
          <g key={x}>
            <path d={`M${x} 90 L${x} 260`} stroke="#151c15" strokeWidth="4" />
            <circle cx={x} cy="70" r="110" fill={url('lamp')} className="animate-pulse-glow" />
            <rect x={x - 30} y="56" width="60" height="28" rx="4" fill="#0e140e" />
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x={x - 26 + (i % 4) * 13.5} y={i < 4 ? 60 : 72} width="10" height="8" rx="2" fill="#fbfff0" />
            ))}
          </g>
        ))}

        {/* Stands */}
        <path d="M0 210 Q320 160 640 210 V280 Q320 236 0 280 Z" fill="#0b120b" />
        <path d="M0 236 Q320 190 640 236" fill="none" stroke="#c3f03c" strokeOpacity="0.07" />
        <path d="M0 258 Q320 214 640 258" fill="none" stroke="#c3f03c" strokeOpacity="0.05" />
        {standLights.map((l, i) => (
          <circle key={i} cx={l.x} cy={l.y} r="1.2" fill="#f3fed6" className="animate-twinkle" style={{ animationDelay: l.d }} />
        ))}

        {/* Field */}
        <ellipse cx="320" cy="400" rx="400" ry="150" fill={url('field')} />
        <path d="M300 300 L340 300 L372 440 L268 440 Z" fill="#d8c79a" opacity="0.08" />

        {/* Confetti */}
        {confetti.map((c, i) => (
          <rect
            key={i}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.w * 0.45}
            fill={c.c}
            transform={`rotate(${c.r} ${c.x} ${c.y})`}
            className="animate-twinkle"
            style={{ animationDelay: c.d }}
          />
        ))}
      </svg>

      {/* Trophy */}
      <div className="absolute left-1/2 top-[16%] w-[34%] max-w-56 -translate-x-1/2">
        <TrophyArt />
      </div>

      {/* Celebrating crowd (foreground) */}
      <svg viewBox="0 0 640 480" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden>
        <g>
          {people.map((p, i) => (
            <g key={i}>
              <g fill="#c3f03c" opacity="0.18" transform="translate(0 -1.5)">
                <circle cx={p.x} cy={p.y} r={p.head} />
                <rect x={p.x - p.head * 2} y={p.y + p.head * 0.9} width={p.head * 4} height="120" rx={p.head * 1.4} />
              </g>
              {p.armUp && (
                <path
                  d={`M${p.x + p.armSide * p.head * 1.3} ${p.y + p.head * 1.5} L${p.x + p.armSide * p.head * 2.2} ${p.y - p.head * 2.6}`}
                  stroke="#030403"
                  strokeWidth={p.head * 0.75}
                  strokeLinecap="round"
                />
              )}
              <circle cx={p.x} cy={p.y} r={p.head} fill="#030403" />
              <rect x={p.x - p.head * 2} y={p.y + p.head * 0.9} width={p.head * 4} height="120" rx={p.head * 1.4} fill="#030403" />
            </g>
          ))}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-ink-950/80 to-transparent" />
    </div>
  )
}
