import type { Match } from '@/types/domain'

export function upcomingMatches(matches: Match[]) {
  return matches
    .filter((m) => m.status === 'upcoming')
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
}

export function completedMatches(matches: Match[]) {
  return matches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => Date.parse(b.completedAt ?? b.scheduledAt) - Date.parse(a.completedAt ?? a.scheduledAt))
}
