import type { TournamentSnapshot } from '@/types/domain'

/**
 * DEMO MODE — starts with empty teams and matches.
 * The admin adds everything through the Control Room.
 */
export function createDemoSeed(): TournamentSnapshot {
  return {
    teams: [],
    matches: [],
    settings: {
      tagline: 'Season 2027 · Sankranthi Edition',
      description:
        'The festive-season cricket showdown. Top local sides, floodlit fixtures and a championship trophy — experience every six, wicket and victory this Sankranthi.',
      startDate: '2027-01-10',
      endDate: '2027-01-16',
      teamsCountOverride: null,
      matchesCountOverride: null,
      daysOverride: null,
      prizePool: '₹1L',
      promoVideoUrl: null,
      updatedAt: new Date().toISOString(),
    },
  }
}
