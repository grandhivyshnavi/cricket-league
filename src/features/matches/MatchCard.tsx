import { CalendarDays, CalendarPlus, CircleCheck, Clock, MapPin, Pencil, RotateCcw, Trash, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import { TeamCrest } from '@/components/brand/TeamCrest'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatMatchDate, formatMatchTime } from '@/lib/datetime'
import { downloadIcs } from '@/lib/ics'
import { cn } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'
import { useTournament } from '@/state/TournamentProvider'
import type { Match, Team } from '@/types/domain'
import { useMatchManager } from './MatchManager'

function TeamSide({ team, isWinner }: { team: Team | undefined; isWinner: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-3 text-center">
      <div className="relative">
        {isWinner && <span className="absolute inset-0 -z-10 rounded-full bg-volt-400/30 blur-xl" aria-hidden />}
        <TeamCrest team={team} size="lg" className="transition-transform duration-500 ease-out-expo group-hover:scale-105" />
      </div>
      <p className={cn('line-clamp-2 min-h-10 text-sm font-bold leading-tight', isWinner ? 'text-volt-300' : 'text-fog-50')}>
        {team?.name ?? 'TBD'}
      </p>
    </div>
  )
}

function MetaRow({ icon: Icon, children }: { icon: typeof Clock; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-[13px] text-fog-300">
      <Icon className="size-4 shrink-0 text-volt-400/80" aria-hidden />
      <span className="truncate">{children}</span>
    </li>
  )
}

export function MatchCard({ match, className }: { match: Match; className?: string }) {
  const { teamsById } = useTournament()
  const { isAdmin } = useAuth()
  const manager = useMatchManager()
  const team1 = teamsById.get(match.team1Id)
  const team2 = teamsById.get(match.team2Id)
  const completed = match.status === 'completed'
  const title = `${team1?.name ?? 'TBD'} vs ${team2?.name ?? 'TBD'}`

  return (
    <article
      aria-label={title}
      className={cn(
        'group relative flex h-full min-w-0 flex-col rounded-card p-5 surface transition-[transform,border-color,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:border-volt-400/25 hover:shadow-[0_24px_60px_-30px_rgb(195_240_60/0.35)] sm:p-6',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-volt-400/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <header className="flex items-center justify-between gap-3">
        {completed ? (
          <Badge tone="neutral">
            <CircleCheck className="size-3" /> Completed
          </Badge>
        ) : (
          <Badge tone="volt">
            <span className="size-1.5 rounded-full bg-volt-400" /> Upcoming
          </Badge>
        )}
        {isAdmin && (
          <div className="-mr-1.5 flex items-center gap-0.5">
            {completed && (
              <Button variant="ghost" size="icon-sm" onClick={() => manager.openReopen(match)} aria-label={`Reopen ${title}`} title="Move back to upcoming">
                <RotateCcw />
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={() => manager.openEdit(match)} aria-label={`Edit ${title}`} title="Edit match">
              <Pencil />
            </Button>
            <Button variant="danger-ghost" size="icon-sm" onClick={() => manager.openDelete(match)} aria-label={`Remove ${title}`} title="Remove match">
              <Trash />
            </Button>
          </div>
        )}
      </header>

      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        <TeamSide team={team1} isWinner={completed && match.winnerId === match.team1Id} />
        <span className="mt-4 grid size-10 place-items-center rounded-full border border-white/10 bg-ink-900 font-poster text-xs italic text-volt-400 shadow-[0_0_20px_-4px_rgb(195_240_60/0.35)]">
          VS
        </span>
        <TeamSide team={team2} isWinner={completed && match.winnerId === match.team2Id} />
      </div>

      <div className="my-5 h-px bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.1)_0_6px,transparent_6px_12px)]" />

      <ul className="space-y-2.5">
        <MetaRow icon={CalendarDays}>{formatMatchDate(match.scheduledAt)}</MetaRow>
        <MetaRow icon={Clock}>{formatMatchTime(match.scheduledAt)}</MetaRow>
        <MetaRow icon={MapPin}>{match.venue}</MetaRow>
      </ul>

      <div className="mt-auto pt-6">
        {completed ? (
          <div className="flex min-h-11 items-center gap-2.5 rounded-control border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-[13px] text-fog-200">
            <Trophy className="size-4 shrink-0 text-gold-400" aria-hidden />
            <span className="line-clamp-2">{match.resultSummary || 'Result to be announced'}</span>
          </div>
        ) : isAdmin ? (
          <Button className="w-full" onClick={() => manager.openComplete(match)}>
            <CircleCheck /> Confirm Match Completed
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() =>
              downloadIcs(
                { uid: match.id, title: `${title} · SSCL 2027`, startIso: match.scheduledAt, location: match.venue },
                `sscl-2027-${(team1?.shortName ?? 'tbd').toLowerCase()}-vs-${(team2?.shortName ?? 'tbd').toLowerCase()}.ics`,
              )
            }
          >
            <CalendarPlus /> Add to Calendar
          </Button>
        )}
      </div>
    </article>
  )
}

export function MatchCardSkeleton() {
  return (
    <div className="flex h-[25rem] flex-col rounded-card p-6 surface" aria-hidden>
      <div className="skeleton h-6 w-24 rounded-full" />
      <div className="mt-8 flex items-center justify-between px-4">
        <div className="skeleton size-16 rounded-2xl" />
        <div className="skeleton size-10 rounded-full" />
        <div className="skeleton size-16 rounded-2xl" />
      </div>
      <div className="mt-10 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
      </div>
      <div className="skeleton mt-auto h-11 rounded-full" />
    </div>
  )
}
