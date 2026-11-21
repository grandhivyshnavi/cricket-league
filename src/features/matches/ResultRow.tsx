import { Trophy } from 'lucide-react'
import { TeamCrest } from '@/components/brand/TeamCrest'
import { formatMatchDate } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import { useTournament } from '@/state/TournamentProvider'
import type { Match, Team } from '@/types/domain'

function Side({ team, winner, align }: { team: Team | undefined; winner: boolean; align: 'left' | 'right' }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', align === 'right' && 'flex-row-reverse text-right')}>
      <TeamCrest team={team} size="sm" />
      <span className={cn('truncate text-sm font-semibold', winner ? 'text-volt-300' : 'text-fog-200')}>
        {team?.name ?? 'TBD'}
      </span>
    </div>
  )
}

export function ResultRow({ match }: { match: Match }) {
  const { teamsById } = useTournament()
  return (
    <li className="grid gap-4 px-5 py-5 transition-colors hover:bg-white/[0.015] sm:px-6 md:grid-cols-[10rem_1fr_minmax(0,16rem)] md:items-center md:gap-6">
      <div className="text-xs text-fog-500">
        <p className="font-semibold text-fog-300">{formatMatchDate(match.scheduledAt)}</p>
        <p className="mt-0.5 truncate">{match.venue}</p>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Side team={teamsById.get(match.team1Id)} winner={match.winnerId === match.team1Id} align="left" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-fog-600">vs</span>
        <Side team={teamsById.get(match.team2Id)} winner={match.winnerId === match.team2Id} align="right" />
      </div>
      <p className="flex items-center gap-2 text-[13px] text-fog-300 md:justify-end md:text-right">
        <Trophy className="size-3.5 shrink-0 text-gold-400" aria-hidden />
        <span className="line-clamp-2">{match.resultSummary || 'Result to be announced'}</span>
      </p>
    </li>
  )
}
