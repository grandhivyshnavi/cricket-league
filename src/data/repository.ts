import type {
  MatchCompletion,
  MatchInput,
  SettingsInput,
  StandingsInput,
  TeamInput,
  TournamentSettings,
  TournamentSnapshot,
} from '@/types/domain'

export type DataMode = 'supabase' | 'demo'

/**
 * Single contract for all tournament data access. UI code never talks to
 * Supabase (or the demo store) directly, which keeps presentation and data
 * concerns separate and makes the backend swappable.
 */
export interface TournamentRepository {
  readonly mode: DataMode
  load(): Promise<TournamentSnapshot>

  createTeam(input: TeamInput): Promise<void>
  updateTeam(id: string, input: TeamInput): Promise<void>
  updateStandings(id: string, input: StandingsInput): Promise<void>
  deleteTeam(id: string): Promise<void>

  createMatch(input: MatchInput): Promise<void>
  updateMatch(id: string, input: MatchInput): Promise<void>
  deleteMatch(id: string): Promise<void>
  completeMatch(id: string, completion: MatchCompletion): Promise<void>
  reopenMatch(id: string): Promise<void>

  updateSettings(input: SettingsInput): Promise<void>

  /** Notifies when data changes elsewhere (other tabs, other admins). */
  subscribe(onChange: () => void): () => void
}

export const EMPTY_SETTINGS: TournamentSettings = {
  tagline: null,
  description: null,
  startDate: null,
  endDate: null,
  teamsCountOverride: null,
  matchesCountOverride: null,
  daysOverride: null,
  prizePool: null,
  promoVideoUrl: null,
  updatedAt: null,
}
