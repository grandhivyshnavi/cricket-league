import type { TournamentSnapshot } from '@/types/domain'
import { inclusiveDays } from './datetime'

export interface TournamentStats {
  teams: number
  matches: number
  days: number | null
  prizePool: string | null
}

/**
 * Headline numbers for the stats panel. Values are derived from live data
 * unless an administrator has configured an explicit override.
 */
export function deriveTournamentStats({ teams, matches, settings }: TournamentSnapshot): TournamentStats {
  const derivedDays =
    settings.startDate && settings.endDate ? inclusiveDays(settings.startDate, settings.endDate) : null
  return {
    teams: settings.teamsCountOverride ?? teams.length,
    matches: settings.matchesCountOverride ?? matches.length,
    days: settings.daysOverride ?? derivedDays,
    prizePool: settings.prizePool?.trim() || null,
  }
}
