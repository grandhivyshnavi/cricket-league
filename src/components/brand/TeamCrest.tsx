import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Team } from '@/types/domain'
import { useSvgId } from './useSvgId'

const sizes = {
  xs: 'size-7',
  sm: 'size-9',
  md: 'size-12',
  lg: 'size-16',
  xl: 'size-24',
} as const

function shade(hex: string, amount: number) {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  const ch = (shift: number) => Math.max(0, Math.min(255, ((n >> shift) & 0xff) + amount))
  return `rgb(${ch(16)} ${ch(8)} ${ch(0)})`
}

interface TeamCrestProps {
  team: Pick<Team, 'name' | 'shortName' | 'color' | 'logoUrl'> | undefined
  size?: keyof typeof sizes
  className?: string
}

/** Uses the uploaded team logo when available, otherwise a generated shield crest. */
export function TeamCrest({ team, size = 'md', className }: TeamCrestProps) {
  const g = useSvgId()
  const [logoFailed, setLogoFailed] = useState(false)
  const color = team?.color ?? '#4a5149'

  if (team?.logoUrl && !logoFailed) {
    return (
      <img
        src={team.logoUrl}
        alt={`${team.name} logo`}
        loading="lazy"
        onError={() => setLogoFailed(true)}
        className={cn(sizes[size], 'shrink-0 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]', className)}
      />
    )
  }

  return (
    <svg
      viewBox="0 0 64 72"
      className={cn(sizes[size], 'shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]', className)}
      role="img"
      aria-label={team ? `${team.name} crest` : 'Team crest'}
    >
      <defs>
        <linearGradient id={g('fill')} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={shade(color, 40)} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={shade(color, -90)} />
        </linearGradient>
        <linearGradient id={g('shine')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M32 2 L60 11 V35 C60 53 47 64 32 70 C17 64 4 53 4 35 V11 Z" fill={`url(#${g('fill')})`} />
      <path
        d="M32 7 L55 14.5 V35 C55 50 44 59.5 32 64.5 C20 59.5 9 50 9 35 V14.5 Z"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.28"
        strokeWidth="1.5"
      />
      <path d="M32 2 L60 11 V26 C44 22 20 22 4 26 V11 Z" fill={`url(#${g('shine')})`} opacity="0.55" />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontFamily="'Archivo Variable', Archivo, sans-serif"
        fontWeight="900"
        fontSize={(team?.shortName.length ?? 2) > 2 ? 17 : 21}
        letterSpacing="0.5"
        fill="#fff"
        style={{ fontStretch: '110%' }}
      >
        {team?.shortName.toUpperCase() ?? '?'}
      </text>
    </svg>
  )
}
