import { Link } from 'react-router-dom'
import { ROUTES, TOURNAMENT } from '@/config/site'
import { cn } from '@/lib/utils'
import { useSvgId } from './useSvgId'

/** Kite emblem — a nod to Sankranthi kite-flying, stitched like a cricket ball seam. */
export function KiteEmblem({ className }: { className?: string }) {
  const g = useSvgId()
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={g('k')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6fca8" />
          <stop offset="0.5" stopColor="#c3f03c" />
          <stop offset="1" stopColor="#82aa0c" />
        </linearGradient>
      </defs>
      <path d="M20 2 L35 16 L20 37 L5 16 Z" fill={`url(#${g('k')})`} />
      <path d="M20 2 L20 37 M5 16 L35 16" stroke="#050705" strokeOpacity="0.55" strokeWidth="1.4" />
      <path
        d="M9.5 21.5 C 15 17.5, 25 17.5, 30.5 21.5"
        fill="none"
        stroke="#050705"
        strokeWidth="1.6"
        strokeDasharray="1.4 2"
        strokeLinecap="round"
      />
      <path d="M20 2 L35 16 L20 37 L5 16 Z" fill="none" stroke="#f3fed6" strokeOpacity="0.5" strokeWidth="0.8" />
    </svg>
  )
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link
      to={ROUTES.home}
      className={cn('group inline-flex items-center gap-3 rounded-lg', className)}
      aria-label={`${TOURNAMENT.name} — home`}
    >
      <span className="relative grid size-10 place-items-center rounded-xl border border-volt-400/20 bg-ink-800 transition-colors duration-300 group-hover:border-volt-400/50">
        <span className="absolute inset-0 rounded-xl bg-volt-400/10 blur-md transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
        <KiteEmblem className="relative size-6" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-[13px] uppercase tracking-[0.04em] text-fog-50 sm:text-sm">
            Sankranthi Special
          </span>
          <span className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.3em] text-fog-400">
            Cricket League <span className="text-volt-400">{TOURNAMENT.year}</span>
          </span>
        </span>
      )}
    </Link>
  )
}
