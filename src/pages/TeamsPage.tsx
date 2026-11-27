import { Plus, Shield } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { hasStandings, rankTeams } from '@/features/leaderboard/standings'
import { upcomingMatches } from '@/features/matches/selectors'
import { TeamCard } from '@/features/teams/TeamCard'
import { useTeamManager } from '@/features/teams/TeamManager'
import { useAuth } from '@/state/AuthProvider'
import { useTournament } from '@/state/TournamentProvider'

export default function TeamsPage() {
  const { teams, matches, status, error, reload } = useTournament()
  const { isAdmin } = useAuth()
  const manager = useTeamManager()
  const ranked = rankTeams(teams)
  const showRank = hasStandings(teams)
  const upcoming = upcomingMatches(matches)
  const nextFor = (id: string) => upcoming.find((m) => m.team1Id === id || m.team2Id === id)

  return (
    <>
      <PageHeader
        eyebrow="Teams"
        title="The Contenders"
        description="Meet the sides chasing Sankranthi glory — their form, standings and next assignment."
        actions={
          isAdmin && (
            <Button onClick={manager.openCreate}>
              <Plus /> Add team
            </Button>
          )
        }
      />
      <section className="container-page pb-16">
        {status === 'loading' ? (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-card" />
            ))}
          </div>
        ) : status === 'error' ? (
          <ErrorState message={error ?? ''} onRetry={reload} />
        ) : ranked.length === 0 ? (
          <EmptyState icon={Shield} title="Teams will be announced soon" description="Check back once registrations close." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {ranked.map((t, i) => (
              <Reveal key={t.id} delay={Math.min(i, 8) * 0.04} className="h-full min-w-0">
                <TeamCard team={t} nextMatch={nextFor(t.id)} showRank={showRank} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
