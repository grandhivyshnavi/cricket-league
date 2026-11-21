import { useInView, useReducedMotion } from 'framer-motion'
import { CalendarDays, Swords, Trophy, Users, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { deriveTournamentStats } from '@/lib/tournament-stats'
import { useTournament } from '@/state/TournamentProvider'

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(0)
  const shown = useRef(0)

  useEffect(() => {
    if (!inView) return
    const from = shown.current
    if (reduce || from === value) {
      shown.current = value
      setDisplay(value)
      return
    }
    const duration = 1400
    let start: number | null = null
    let frame = 0
    const tick = (now: number) => {
      start ??= now
      const t = Math.min(1, (now - start) / duration)
      shown.current = Math.round(from + (value - from) * (1 - Math.pow(1 - t, 4)))
      setDisplay(shown.current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value, reduce])

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  )
}

interface StatItem {
  label: string
  icon: LucideIcon
  value: number | string | null
}

export function StatsPanel({ className }: { className?: string }) {
  const tournament = useTournament()
  const loading = tournament.status === 'loading'
  const stats = deriveTournamentStats(tournament)

  const items: StatItem[] = [
    { label: 'Elite Teams', icon: Users, value: stats.teams },
    { label: 'Matches', icon: Swords, value: stats.matches },
    { label: 'Days', icon: CalendarDays, value: stats.days },
    { label: 'Prize Pool', icon: Trophy, value: stats.prizePool },
  ]

  return (
    <div className={cn('relative overflow-hidden rounded-panel glass', className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-volt-400/50 to-transparent" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-40 w-3/4 -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(195_240_60/0.12),transparent)]" />
      <dl className="relative grid grid-cols-2 lg:grid-cols-4">
        {items.map(({ label, icon: Icon, value }, i) => (
          <div
            key={label}
            className={cn(
              'group flex flex-col items-center px-4 py-7 text-center sm:py-9',
              i % 2 === 1 && 'border-l border-white/[0.06]',
              i >= 2 && 'border-t border-white/[0.06] lg:border-t-0',
              i === 2 && 'lg:border-l',
            )}
          >
            <span className="grid size-11 place-items-center rounded-xl border border-volt-400/20 bg-volt-400/10 text-volt-400 transition-[box-shadow,transform] duration-500 group-hover:-translate-y-0.5 group-hover:shadow-glow-sm">
              <Icon className="size-5" aria-hidden />
            </span>
            <dt className="order-3 mt-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-fog-400">{label}</dt>
            <dd className="order-2 mt-4 font-heading text-4xl leading-none text-fog-50 sm:text-5xl">
              {loading ? (
                <span className="skeleton inline-block h-10 w-16 rounded-lg align-middle" />
              ) : typeof value === 'number' ? (
                <CountUp value={value} />
              ) : (
                (value ?? 'TBA')
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
