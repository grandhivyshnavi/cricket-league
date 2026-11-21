import { Hero } from '@/features/home/Hero'
import { JoinCta } from '@/features/home/JoinCta'
import { LeaderboardSection } from '@/features/home/LeaderboardSection'
import { TournamentInfo } from '@/features/home/TournamentInfo'
import { UpcomingMatchesSection } from '@/features/home/UpcomingMatchesSection'

export default function HomePage() {
  return (
    <>
      <Hero />
      <LeaderboardSection />
      <UpcomingMatchesSection />
      <TournamentInfo />
      <JoinCta />
    </>
  )
}
