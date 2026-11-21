import type { Match, Team, TournamentSnapshot } from '@/types/domain'

/**
 * PLACEHOLDER DATA — used only in demo mode (no Supabase credentials).
 * Team names, venues, fixtures and standings are illustrative and should be
 * replaced by the organisers through the admin panel.
 */
const created = '2026-11-01T00:00:00.000Z'

const team = (
  id: string,
  name: string,
  shortName: string,
  city: string,
  color: string,
  played: number,
  won: number,
  lost: number,
  points: number,
): Team => ({ id, name, shortName, city, color, played, won, lost, points, logoUrl: null, manualRank: null, createdAt: created })

const teams: Team[] = [
  team('t-gt', 'Godavari Titans', 'GT', 'Rajahmundry', '#f59e0b', 2, 2, 0, 4),
  team('t-vw', 'Vizag Warriors', 'VW', 'Visakhapatnam', '#06b6d4', 2, 1, 1, 2),
  team('t-rr', 'Rajahmundry Royals', 'RR', 'Rajahmundry', '#8b5cf6', 1, 1, 0, 2),
  team('t-vl', 'Vijayawada Lions', 'VL', 'Vijayawada', '#10b981', 1, 1, 0, 2),
  team('t-kk', 'Krishna Kings', 'KK', 'Machilipatnam', '#3b82f6', 1, 0, 1, 0),
  team('t-gc', 'Guntur Chargers', 'GC', 'Guntur', '#ef4444', 1, 0, 1, 0),
  team('t-nh', 'Nellore Hawks', 'NH', 'Nellore', '#f97316', 1, 0, 1, 0),
  team('t-kb', 'Kakinada Blasters', 'KB', 'Kakinada', '#ec4899', 1, 0, 1, 0),
]

const VENUES = {
  godavari: 'Godavari Grounds, Rajahmundry',
  riverside: 'Riverside Oval, Vijayawada',
  coastal: 'Coastal Cricket Ground, Visakhapatnam',
}

const ist = (date: string, time: string) => new Date(`${date}T${time}:00+05:30`).toISOString()

const match = (
  id: string,
  team1Id: string,
  team2Id: string,
  scheduledAt: string,
  venue: string,
  result?: { winnerId: string; summary: string },
): Match => ({
  id,
  team1Id,
  team2Id,
  scheduledAt,
  venue,
  status: result ? 'completed' : 'upcoming',
  winnerId: result?.winnerId ?? null,
  resultSummary: result?.summary ?? null,
  completedAt: result ? scheduledAt : null,
  createdAt: created,
})

const matches: Match[] = [
  match('m-01', 't-gt', 't-kk', ist('2027-01-10', '15:30'), VENUES.godavari, { winnerId: 't-gt', summary: 'Godavari Titans won by 18 runs' }),
  match('m-02', 't-vw', 't-gc', ist('2027-01-10', '19:30'), VENUES.coastal, { winnerId: 't-vw', summary: 'Vizag Warriors won by 5 wickets' }),
  match('m-03', 't-rr', 't-nh', ist('2027-01-11', '15:30'), VENUES.godavari, { winnerId: 't-rr', summary: 'Rajahmundry Royals won by 22 runs' }),
  match('m-04', 't-vl', 't-kb', ist('2027-01-11', '19:30'), VENUES.riverside, { winnerId: 't-vl', summary: 'Vijayawada Lions won by 7 wickets' }),
  match('m-05', 't-gt', 't-vw', ist('2027-01-12', '15:30'), VENUES.coastal, { winnerId: 't-gt', summary: 'Godavari Titans won by 3 wickets' }),
  match('m-06', 't-kk', 't-gc', ist('2027-01-12', '19:30'), VENUES.riverside),
  match('m-07', 't-rr', 't-vl', ist('2027-01-13', '15:30'), VENUES.godavari),
  match('m-08', 't-nh', 't-kb', ist('2027-01-13', '19:30'), VENUES.coastal),
  match('m-09', 't-gt', 't-rr', ist('2027-01-14', '19:30'), VENUES.godavari),
  match('m-10', 't-vw', 't-vl', ist('2027-01-15', '15:30'), VENUES.riverside),
  match('m-11', 't-kk', 't-nh', ist('2027-01-15', '19:30'), VENUES.coastal),
]

export function createDemoSeed(): TournamentSnapshot {
  return structuredClone({
    teams,
    matches,
    settings: {
      tagline: 'Season 2027 · Sankranthi Edition',
      description:
        'The festive-season cricket showdown. Top local sides, floodlit fixtures and a championship trophy — experience every six, wicket and victory this Sankranthi.',
      startDate: '2027-01-10',
      endDate: '2027-01-16',
      teamsCountOverride: null,
      matchesCountOverride: null,
      daysOverride: null,
      prizePool: '₹5L',
      promoVideoUrl: null,
      updatedAt: created,
    },
  })
}
