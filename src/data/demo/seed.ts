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
      startDate: '2026-12-26',
      endDate: '2027-01-15',
      teamsCountOverride: null,
      matchesCountOverride: null,
      daysOverride: null,
      prizePool: '₹1 LAKH',
      promoVideoUrl: null,
      registrationOpens: '2026-12-01',
      registrationCloses: '2026-12-25',
      updatedAt: new Date().toISOString(),
    },
  }
}
