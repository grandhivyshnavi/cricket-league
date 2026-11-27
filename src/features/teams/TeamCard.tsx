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
    <article className="group relative flex h-[200px] min-w-0 flex-col overflow-hidden rounded-card surface transition-[transform,border-color] duration-500 ease-out-expo hover:-translate-y-1 hover:border-volt-400/25">
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-35"
        style={{ backgroundColor: team.color }}
        aria-hidden
      />

      <div className="relative flex flex-1 gap-4 p-4">
        {/* Left: identity */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="flex items-start gap-3">
            <TeamCrest team={team} size="md" className="shrink-0 transition-transform duration-500 ease-out-expo group-hover:scale-105" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-heading text-lg uppercase leading-tight text-fog-50">{team.name}</h3>
                {showRank && (
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold tabular-nums text-fog-300">
                    #{team.rank}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm text-fog-500">{team.city ?? '\u00a0'}</p>
            </div>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-fog-500">
              <Users className="size-3 text-volt-400" aria-hidden />
              Squad · {team.playerCount} player{team.playerCount === 1 ? '' : 's'}
            </p>
            {team.playerCount > 0 && (
              <p className="mt-1 line-clamp-1 text-sm text-fog-300">
                {team.playerNames.slice(0, 4).join(', ')}
                {team.playerNames.length > 4 && (
                  <span className="text-fog-500"> +{team.playerNames.length - 4}</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Right: stats */}
        <div className="flex shrink-0 flex-col items-end justify-between">
          {isAdmin && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => manager.openEdit(team)} aria-label={`Edit ${team.name}`}>
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="danger-ghost" size="icon-sm" onClick={() => manager.openDelete(team)} aria-label={`Remove ${team.name}`}>
                <Trash className="size-3.5" />
              </Button>
            </div>
          )}

          <dl className="grid grid-cols-4 gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center">
            {(
              [
                ['M', team.played],
                ['W', team.won],
                ['L', team.lost],
                ['Pts', team.points],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="min-w-[2.25rem]">
                <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-fog-500">{label}</dt>
                <dd className={`mt-0.5 font-heading text-base tabular-nums ${label === 'Pts' ? 'text-volt-300' : 'text-fog-100'}`}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Bottom: fixture */}
      <div className="relative flex min-h-[2.75rem] items-center gap-2 border-t border-white/[0.06] bg-white/[0.015] px-4 text-xs text-fog-400">
        <CalendarDays className="size-3.5 shrink-0 text-volt-400" aria-hidden />
        {nextMatch && opponent ? (
          <span className="min-w-0 truncate">
            <span className="font-semibold text-fog-200">Next:</span> vs {opponent.name} · {formatMatchDate(nextMatch.scheduledAt)}
          </span>
        ) : (
          <span>No upcoming fixture</span>
        )}
      </div>
    </article>
  )
}
