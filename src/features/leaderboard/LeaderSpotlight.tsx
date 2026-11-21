import { CalendarDays, Crown } from 'lucide-react'
import { TeamCrest } from '@/components/brand/TeamCrest'
import { TrophyArt } from '@/components/brand/TrophyArt'
import { formatDateRange, formatMatchDate, formatMatchTime } from '@/lib/datetime'
import { upcomingMatches } from '@/features/matches/selectors'
import { useTournament } from '@/state/TournamentProvider'
import type { RankedTeam } from './standings'

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-control border border-white/[0.06] bg-ink-900/60 px-3 py-3 text-center">
      <p className={`font-heading text-2xl tabular-nums ${accent ? 'text-volt-300' : 'text-fog-50'}`}>{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-fog-500">{label}</p>
    </div>
  )
}

/** Highlights the current table-topper, or the season start before results exist. */
export function LeaderSpotlight({ leader }: { leader: RankedTeam | null }) {
  const { settings, matches, teamsById } = useTournament()

  if (!leader) {
    const range = formatDateRange(settings.startDate, settings.endDate)
    return (
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-panel p-8 text-center surface">
        <TrophyArt className="w-32" />
        <p className="mt-6 font-heading text-xl uppercase text-fog-50">The race begins soon</p>
        <p className="mt-2 max-w-xs text-sm text-fog-400">Standings will appear here once the first results are in.</p>
        {range && (
          <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-volt-300">
            <CalendarDays className="size-4" /> {range}
          </p>
        )}
      </div>
    )
  }

  const next = upcomingMatches(matches).find((m) => m.team1Id === leader.id || m.team2Id === leader.id)

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-panel border border-volt-400/20 bg-linear-to-b from-ink-800 to-ink-900 p-7 shadow-card">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(195_240_60/0.22),transparent)]"
        aria-hidden
      />
      <p className="relative inline-flex items-center gap-2 self-start rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-400">
        <Crown className="size-3.5" /> Top of the table
      </p>
      <div className="relative mt-8 flex flex-col items-center text-center">
        <div className="relative">
          <span className="absolute inset-0 -z-10 scale-125 rounded-full bg-volt-400/25 blur-2xl" aria-hidden />
          <TeamCrest team={leader} size="xl" />
        </div>
        <h3 className="mt-5 font-heading text-2xl uppercase leading-tight text-fog-50">{leader.name}</h3>
        {leader.city && <p className="mt-1 text-sm text-fog-400">{leader.city}</p>}
      </div>
      {next && (
        <div className="relative mt-7 rounded-control border border-white/[0.06] bg-ink-950/40 px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-fog-500">Next fixture</p>
          <p className="mt-1.5 truncate text-sm font-semibold text-fog-100">
            vs {teamsById.get(next.team1Id === leader.id ? next.team2Id : next.team1Id)?.name ?? 'TBD'}
          </p>
          <p className="mt-0.5 text-xs text-fog-400">
            {formatMatchDate(next.scheduledAt)} · {formatMatchTime(next.scheduledAt)}
          </p>
        </div>
      )}
      <div className="relative mt-auto grid grid-cols-4 gap-2 pt-8">
        <Stat label="M" value={leader.played} />
        <Stat label="W" value={leader.won} />
        <Stat label="L" value={leader.lost} />
        <Stat label="Pts" value={leader.points} accent />
      </div>
    </div>
  )
}
