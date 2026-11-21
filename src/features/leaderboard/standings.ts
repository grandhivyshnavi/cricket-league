import type { Team } from '@/types/domain'

export interface RankedTeam extends Team {
  rank: number
}

/**
 * Orders teams for the leaderboard. Admin-pinned positions (manualRank) take
 * precedence; the remaining teams follow points, then wins, then fewest losses.
 * Scoring itself is entered by administrators — nothing is computed here.
 */
export function rankTeams(teams: Team[]): RankedTeam[] {
  return [...teams]
    .sort(
      (a, b) =>
        (a.manualRank ?? Number.POSITIVE_INFINITY) - (b.manualRank ?? Number.POSITIVE_INFINITY) ||
        b.points - a.points ||
        b.won - a.won ||
        a.lost - b.lost ||
        a.name.localeCompare(b.name),
    )
    .map((team, index) => ({ ...team, rank: index + 1 }))
}

/** The season has a meaningful leader only once standings have been recorded. */
export function hasStandings(teams: Team[]) {
  return teams.some((t) => t.played > 0 || t.points !== 0 || t.manualRank !== null)
}
