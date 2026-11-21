import { ArrowUpRight, ListOrdered, Settings } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { ROUTES } from '@/config/site'
import { LeaderboardSkeleton, LeaderboardTable } from '@/features/leaderboard/LeaderboardTable'
import { LeaderSpotlight } from '@/features/leaderboard/LeaderSpotlight'
import { hasStandings, rankTeams } from '@/features/leaderboard/standings'
import { useAuth } from '@/state/AuthProvider'
import { useTournament } from '@/state/TournamentProvider'

const HOME_LIMIT = 8

export function LeaderboardSection() {
  const { teams, status, error, reload } = useTournament()
  const { isAdmin } = useAuth()
  const ranked = rankTeams(teams)
  const highlight = hasStandings(teams)
  const visible = ranked.slice(0, HOME_LIMIT)

  return (
    <section id="leaderboard" className="container-page section-y scroll-mt-24" aria-labelledby="leaderboard-title">
      <Reveal>
        <SectionHeading
          eyebrow="Standings"
          title={<span id="leaderboard-title">Leaderboard</span>}
          description="Every win counts. Track how each side stacks up in the race for the trophy."
          actions={
            <>
              {isAdmin && (
                <ButtonLink to={`${ROUTES.admin}?tab=leaderboard`} variant="ghost" size="sm">
                  <Settings /> Manage
                </ButtonLink>
              )}
              <ButtonLink to={ROUTES.stats} variant="secondary" size="sm">
                Full stats <ArrowUpRight />
              </ButtonLink>
            </>
          }
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-10 grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="overflow-hidden rounded-panel surface">
          {status === 'loading' ? (
            <LeaderboardSkeleton />
          ) : status === 'error' ? (
            <ErrorState message={error ?? ''} onRetry={reload} className="m-4 border-0" />
          ) : ranked.length === 0 ? (
            <EmptyState
              icon={ListOrdered}
              title="No teams yet"
              description="The leaderboard will appear as soon as teams are announced."
              className="m-4 border-0"
            />
          ) : (
            <LeaderboardTable teams={visible} highlight={highlight} caption="Tournament leaderboard" editable={isAdmin} />
          )}
          {ranked.length > HOME_LIMIT && (
            <div className="border-t border-white/[0.05] px-6 py-4 text-center">
              <ButtonLink to={ROUTES.stats} variant="ghost" size="sm">
                View all {ranked.length} teams <ArrowUpRight />
              </ButtonLink>
            </div>
          )}
        </div>
        {status === 'loading' ? (
          <div className="skeleton min-h-80 rounded-panel" />
        ) : (
          status === 'ready' && ranked.length > 0 && <LeaderSpotlight leader={highlight ? ranked[0] : null} />
        )}
      </Reveal>
    </section>
  )
}
