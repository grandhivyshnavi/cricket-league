export const TOURNAMENT = {
  name: 'Sankranthi Super Cricket League 2027',
  shortName: 'SSCL 2027',
  year: '2027',
  district: 'Kadapa',
} as const

/** Default tournament dates (YYYY-MM-DD).
 *  These are the fallback values used in demo mode and the seed data.
 *  The live values are stored in the `tournament_settings` table. */
export const TOURNAMENT_DATES = {
  startDate: '2026-12-26',
  endDate: '2027-01-15',
} as const

/** Registration window (IST dates).
 *  Used for client-side display and gating. The backend RPC also enforces
 *  this window independently of the frontend. */
export const REGISTRATION_WINDOW = {
  /** First day registrations are accepted (inclusive, IST date). */
  opensDate: '2026-12-01',
  /** Last day registrations are accepted (inclusive, IST date). */
  closesDate: '2026-12-25',
} as const

export const ROUTES = {
  home: '/',
  teams: '/teams',
  schedule: '/schedule',
  stats: '/stats',
  about: '/about',
  register: '/register',
  adminLogin: '/admin/login',
  admin: '/admin',
} as const

export const NAV_ITEMS = [
  { label: 'Home', to: ROUTES.home },
  { label: 'Teams', to: ROUTES.teams },
  { label: 'Schedule', to: ROUTES.schedule },
  { label: 'Stats', to: ROUTES.stats },
  { label: 'About', to: ROUTES.about },
] as const

/** All fixture times are entered and displayed in Indian Standard Time. */
export const TIME_ZONE = 'Asia/Kolkata'
export const TIME_ZONE_LABEL = 'IST'
