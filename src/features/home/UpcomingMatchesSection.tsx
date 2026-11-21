import { ArrowUpRight, CalendarClock, Plus } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { ROUTES } from '@/config/site'
import { MatchCardSkeleton } from '@/features/matches/MatchCard'
import { CarouselControls, MatchTrack, useCarousel } from '@/features/matches/MatchCarousel'
import { useMatchManager } from '@/features/matches/MatchManager'
import { upcomingMatches } from '@/features/matches/selectors'
import { useAuth } from '@/state/AuthProvider'
import { useTournament } from '@/state/TournamentProvider'

export function UpcomingMatchesSection() {
  const { matches, status, error, reload } = useTournament()
  const { isAdmin } = useAuth()
  const manager = useMatchManager()
  const upcoming = upcomingMatches(matches)
  const carousel = useCarousel(upcoming.length)

  return (
    <section className="section-y overflow-hidden" aria-labelledby="upcoming-title">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow="Upcoming Matches"
            title={<span id="upcoming-title">Next Big Battles</span>}
            description="Floodlit fixtures, festive crowds and rivalries settled on the field."
            actions={
              <>
                {isAdmin && (
                  <Button size="sm" onClick={manager.openCreate}>
                    <Plus /> Add match
                  </Button>
                )}
                <ButtonLink to={ROUTES.schedule} variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Full schedule <ArrowUpRight />
                </ButtonLink>
                {upcoming.length > 0 && (
                  <CarouselControls
                    label="matches"
                    canPrev={carousel.canPrev}
                    canNext={carousel.canNext}
                    onScroll={carousel.scroll}
                  />
                )}
              </>
            }
          />
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          {status === 'loading' ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <MatchCardSkeleton />
              <div className="hidden sm:block">
                <MatchCardSkeleton />
              </div>
              <div className="hidden lg:block">
                <MatchCardSkeleton />
              </div>
            </div>
          ) : status === 'error' ? (
            <ErrorState message={error ?? ''} onRetry={reload} />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No upcoming fixtures"
              description="New matches will appear here as soon as they are scheduled."
              action={
                isAdmin ? (
                  <Button size="sm" onClick={manager.openCreate}>
                    <Plus /> Add match
                  </Button>
                ) : (
                  <ButtonLink to={ROUTES.schedule} variant="secondary" size="sm">
                    View results
                  </ButtonLink>
                )
              }
            />
          ) : (
            <MatchTrack matches={upcoming} carousel={carousel} />
          )}
        </Reveal>
      </div>
    </section>
  )
}
