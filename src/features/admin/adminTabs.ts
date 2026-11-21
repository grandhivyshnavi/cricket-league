import { Gauge, ListOrdered, Settings, Shield, Swords, Users, type LucideIcon } from 'lucide-react'

export const ADMIN_TABS = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'teams', label: 'Teams', icon: Shield },
  { id: 'matches', label: 'Matches', icon: Swords },
  { id: 'leaderboard', label: 'Leaderboard', icon: ListOrdered },
  { id: 'members', label: 'User Management', icon: Users },
  { id: 'settings', label: 'Tournament info', icon: Settings },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[]

export type AdminTab = (typeof ADMIN_TABS)[number]['id']

export function isAdminTab(value: string | null): value is AdminTab {
  return ADMIN_TABS.some((t) => t.id === value)
}
