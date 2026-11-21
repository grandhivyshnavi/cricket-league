import { CalendarDays, Pencil, Trash } from 'lucide-react'
import { TeamCrest } from '@/components/brand/TeamCrest'
import { Button } from '@/components/ui/button'
import { formatMatchDate } from '@/lib/datetime'
import { useAuth } from '@/state/AuthProvider'
import { useTournament } from '@/state/TournamentProvider'
import type { Match } from '@/types/domain'
import type { RankedTeam } from '../leaderboard/standings'
import { useTeamManager } from './TeamManager'

export function TeamCard({ team, nextMatch, showRank }: { team: RankedTeam; nextMatch?: Match; showRank: boolean }) {
  const { isAdmin } = useAuth()
  const { teamsById } = useTournament()
  const manager = useTeamManager()
  const opponentId = nextMatch && (nextMatch.team1Id === team.id ? nextMatch.team2Id : nextMatch.team1Id)
  const opponent = opponentId ? teamsById.get(opponentId) : undefined

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-card p-6 surface transition-[transform,border-color] duration-500 ease-out-expo hover:-translate-y-1 hover:border-volt-400/25">
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-45"
        style={{ backgroundColor: team.color }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <TeamCrest team={team} size="lg" className="transition-transform duration-500 ease-out-expo group-hover:scale-105" />
        <div className="flex items-center gap-1">
          {isAdmin && (
            <>
              <Button variant="ghost" size="icon-sm" onClick={() => manager.openEdit(team)} aria-label={`Edit ${team.name}`}>
                <Pencil />
              </Button>
              <Button variant="danger-ghost" size="icon-sm" onClick={() => manager.openDelete(team)} aria-label={`Remove ${team.name}`}>
                <Trash />
              </Button>
            </>
          )}
          {showRank && (
            <span className="ml-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold tabular-nums text-fog-300">
              #{team.rank}
            </span>
          )}
        </div>
      </div>
      <h3 className="relative mt-5 font-heading text-xl uppercase leading-tight text-fog-50">{team.name}</h3>
      <p className="relative mt-1 text-sm text-fog-500">{team.city ?? '\u00a0'}</p>

      <dl className="relative mt-6 grid grid-cols-4 gap-2 border-t border-white/[0.06] pt-5 text-center">
        {(
          [
            ['M', team.played],
            ['W', team.won],
            ['L', team.lost],
            ['Pts', team.points],
          ] as const
        ).map(([label, v]) => (
          <div key={label}>
            <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-fog-500">{label}</dt>
            <dd className={`mt-1 font-heading text-lg tabular-nums ${label === 'Pts' ? 'text-volt-300' : 'text-fog-100'}`}>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="relative mt-auto pt-5">
        <div className="flex min-h-14 items-center gap-3 rounded-control border border-white/[0.05] bg-ink-900/60 px-3.5 py-2.5 text-xs leading-relaxed text-fog-400">
          <CalendarDays className="size-3.5 shrink-0 text-volt-400" aria-hidden />
          {nextMatch && opponent ? (
            <span className="min-w-0">
              <span className="block truncate font-semibold text-fog-200">Next: vs {opponent.name}</span>
              <span className="block truncate">{formatMatchDate(nextMatch.scheduledAt)}</span>
            </span>
          ) : (
            <span>No upcoming fixture</span>
          )}
        </div>
      </div>
    </article>
  )
}
