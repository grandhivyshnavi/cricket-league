import { CalendarClock, Plus } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { Segmented } from '@/components/ui/segmented'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { TIME_ZONE_LABEL } from '@/config/site'
import { MatchCard, MatchCardSkeleton } from '@/features/matches/MatchCard'
import { useMatchManager } from '@/features/matches/MatchManager'
import { completedMatches, upcomingMatches } from '@/features/matches/selectors'
import { formatMatchDate, istDayKey } from '@/lib/datetime'
import { useAuth } from '@/state/AuthProvider'
import { useTournament } from '@/state/TournamentProvider'
import type { Match } from '@/types/domain'

type Filter = 'upcoming' | 'completed' | 'all'

function groupByDay(matches: Match[]) {
  const groups = new Map<string, Match[]>()
  for (const m of matches) {
    const key = istDayKey(m.scheduledAt)
    groups.set(key, [...(groups.get(key) ?? []), m])
  }
  return [...groups.entries()]
}

export default function SchedulePage() {
  const { matches, status, error, reload } = useTournament()
  const { isAdmin } = useAuth()
  const manager = useMatchManager()
  const [filter, setFilter] = useState<Filter>('upcoming')

  const upcoming = upcomingMatches(matches)
  const completed = completedMatches(matches)
  const list =
    filter === 'upcoming'
      ? upcoming
      : filter === 'completed'
        ? completed
        : [...matches].sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
  const groups = groupByDay(list)

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Fixtures & Results"
        description={`Every match of the season, day by day. All times are shown in ${TIME_ZONE_LABEL}.`}
        actions={
          isAdmin && (
            <Button onClick={manager.openCreate}>
              <Plus /> Add match
            </Button>
          )
        }
      />
      <section className="container-page pb-16">
        <Segmented
          label="Filter matches"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { value: 'completed', label: 'Completed', count: completed.length },
            { value: 'all', label: 'All', count: matches.length },
          ]}
        />

        <div className="mt-10">
          {status === 'loading' ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </div>
          ) : status === 'error' ? (
            <ErrorState message={error ?? ''} onRetry={reload} />
          ) : groups.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title={filter === 'completed' ? 'No results yet' : 'No fixtures scheduled'}
              description={
                filter === 'completed'
                  ? 'Completed matches and their results will be listed here.'
                  : 'The organisers will publish fixtures here shortly.'
              }
            />
          ) : (
            <div className="space-y-14">
              {groups.map(([day, dayMatches]) => (
                <Reveal key={day}>
                  <div className="mb-5 flex items-center gap-4">
                    <h2 className="font-heading text-lg uppercase text-fog-50 sm:text-xl">{formatMatchDate(dayMatches[0].scheduledAt)}</h2>
                    <span className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent" />
                    <span className="text-xs font-semibold text-fog-500">
                      {dayMatches.length} {dayMatches.length === 1 ? 'match' : 'matches'}
                    </span>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {dayMatches.map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
