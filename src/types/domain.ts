export type AppRole = 'admin' | 'user'
export type MatchStatus = 'upcoming' | 'completed'

export interface Team {
  id: string
  name: string
  shortName: string
  city: string | null
  logoUrl: string | null
  /** Hex colour used for the generated crest when no logo is uploaded. */
  color: string
  played: number
  won: number
  lost: number
  points: number
  /** Optional admin override that pins a team to a leaderboard position. */
  manualRank: number | null
  createdAt: string
}

export interface Match {
  id: string
  team1Id: string
  team2Id: string
  /** ISO-8601 timestamp (UTC). */
  scheduledAt: string
  venue: string
  status: MatchStatus
  winnerId: string | null
  resultSummary: string | null
  completedAt: string | null
  createdAt: string
}

export interface TournamentSettings {
  tagline: string | null
  description: string | null
  /** YYYY-MM-DD */
  startDate: string | null
  /** YYYY-MM-DD */
  endDate: string | null
  teamsCountOverride: number | null
  matchesCountOverride: number | null
  daysOverride: number | null
  prizePool: string | null
  promoVideoUrl: string | null
  updatedAt: string | null
}

export interface TournamentSnapshot {
  teams: Team[]
  matches: Match[]
  settings: TournamentSettings
}

export type TeamInput = Pick<Team, 'name' | 'shortName' | 'city' | 'logoUrl' | 'color'>
export type StandingsInput = Pick<Team, 'played' | 'won' | 'lost' | 'points' | 'manualRank'>

export interface MatchInput {
  team1Id: string
  team2Id: string
  scheduledAt: string
  venue: string
}

export interface MatchCompletion {
  winnerId: string | null
  resultSummary: string | null
}

export type SettingsInput = Omit<TournamentSettings, 'updatedAt'>

export interface AuthUser {
  id: string
  email: string
  role: AppRole
}

export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface RegistrationPlayer {
  /** Roster position, 1–13. */
  playerNo: number
  fullName: string
  phone: string
}

export interface TeamRegistration {
  id: string
  teamName: string
  email: string
  contactPhone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  pinCode: string
  /** Object path in the private `team-photos` bucket. */
  photoPath: string | null
  /** True while the photo upload has not been confirmed (incomplete submission). */
  awaitingPhoto: boolean
  status: RegistrationStatus
  createdAt: string
  players: RegistrationPlayer[]
}
