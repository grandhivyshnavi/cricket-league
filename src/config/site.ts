export const TOURNAMENT = {
  name: 'Sankranthi Special Cricket League 2027',
  shortName: 'SSCL 2027',
  year: '2027',
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
