import { CalendarDays, Pencil, Trash, Users } from 'lucide-react'
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
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-card surface transition-[transform,border-color] duration-500 ease-out-expo hover:-translate-y-1 hover:border-volt-400/25">
      {/* Top section: crest + identity */}
      <div className="relative flex items-start gap-4 border-b border-white/[0.06] p-5">
        <div
          className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-35"
          style={{ backgroundColor: team.color }}
          aria-hidden
        />
        <TeamCrest team={team} size="lg" className="relative shrink-0 transition-transform duration-500 ease-out-expo group-hover:scale-105" />
        <div className="relative min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-heading text-xl uppercase leading-tight text-fog-50">{team.name}</h3>
            {showRank && (
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold tabular-nums text-fog-300">
                #{team.rank}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm text-fog-500">{team.city ?? '\u00a0'}</p>
        </div>
        {isAdmin && (
          <div className="relative ml-auto flex shrink-0 gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => manager.openEdit(team)} aria-label={`Edit ${team.name}`}>
              <Pencil />
            </Button>
            <Button variant="danger-ghost" size="icon-sm" onClick={() => manager.openDelete(team)} aria-label={`Remove ${team.name}`}>
              <Trash />
            </Button>
          </div>
        )}
      </div>

      {/* Middle section: squad */}
      <div className="flex-1 px-5 py-4">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-fog-500">
          <Users className="size-3 text-volt-400" aria-hidden />
          Squad · {team.playerCount} player{team.playerCount === 1 ? '' : 's'}
        </p>
        {team.playerCount > 0 && (
          <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-fog-300">
            {team.playerNames.slice(0, 5).join(', ')}
            {team.playerNames.length > 5 && (
              <span className="text-fog-500"> +{team.playerNames.length - 5} more</span>
            )}
          </p>
        )}
      </div>

      {/* Bottom section: stats + fixture */}
      <div className="px-5 pb-5">
        <dl className="grid grid-cols-4 gap-2 rounded-control border border-white/[0.06] bg-white/[0.02] py-3 text-center">
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

        <div className="mt-3 flex min-h-12 items-center gap-3 rounded-control border border-white/[0.05] bg-ink-900/60 px-3.5 py-2.5 text-xs leading-relaxed text-fog-400">
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
