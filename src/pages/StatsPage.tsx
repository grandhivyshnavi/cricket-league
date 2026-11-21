import { ListOrdered, Trophy } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { LeaderboardSkeleton, LeaderboardTable } from '@/features/leaderboard/LeaderboardTable'
import { LeaderSpotlight } from '@/features/leaderboard/LeaderSpotlight'
import { hasStandings, rankTeams } from '@/features/leaderboard/standings'
import { ResultRow } from '@/features/matches/ResultRow'
import { completedMatches } from '@/features/matches/selectors'
import { useTournament } from '@/state/TournamentProvider'

export default function StatsPage() {
  const { teams, matches, status, error, reload } = useTournament()
  const ranked = rankTeams(teams)
  const highlight = hasStandings(teams)
  const results = completedMatches(matches)

  return (
    <>
      <PageHeader
        eyebrow="Stats"
        title="Season Statistics"
        description="The full leaderboard, headline numbers and every recorded result of the season."
      />
      <div className="container-page space-y-20 pb-16 lg:space-y-28">
        <section aria-labelledby="table-title">
          <Reveal>
            <SectionHeading eyebrow="Standings" title={<span id="table-title">Leaderboard</span>} />
          </Reveal>
          <Reveal delay={0.1} className="mt-10 grid gap-5 lg:grid-cols-[1fr_22rem]">
            <div className="overflow-hidden rounded-panel surface">
              {status === 'loading' ? (
                <LeaderboardSkeleton rows={8} />
              ) : status === 'error' ? (
                <ErrorState message={error ?? ''} onRetry={reload} className="m-4 border-0" />
              ) : ranked.length === 0 ? (
                <EmptyState icon={ListOrdered} title="No teams yet" className="m-4 border-0" />
              ) : (
                <LeaderboardTable teams={ranked} highlight={highlight} caption="Full tournament leaderboard" />
              )}
            </div>
            {status === 'ready' && ranked.length > 0 && <LeaderSpotlight leader={highlight ? ranked[0] : null} />}
          </Reveal>
        </section>

        <section aria-labelledby="results-title">
          <Reveal>
            <SectionHeading eyebrow="Match history" title={<span id="results-title">Results</span>} />
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            {status === 'ready' && results.length === 0 ? (
              <EmptyState icon={Trophy} title="No results yet" description="Completed matches will be recorded here." />
            ) : status === 'ready' ? (
              <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-panel surface">
                {results.map((m) => (
                  <ResultRow key={m.id} match={m} />
                ))}
              </ul>
            ) : status === 'loading' ? (
              <div className="skeleton h-64 rounded-panel" />
            ) : null}
          </Reveal>
        </section>
      </div>
    </>
  )
}
