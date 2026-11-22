import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { Eyebrow } from '@/components/ui/badge'
import { ErrorState, Spinner } from '@/components/ui/states'
import { ADMIN_TABS, isAdminTab, type AdminTab } from '@/features/admin/adminTabs'
import { LeaderboardTab } from '@/features/admin/tabs/LeaderboardTab'
import { MatchesTab } from '@/features/admin/tabs/MatchesTab'
import { MembersTab } from '@/features/admin/tabs/MembersTab'
import { OverviewTab } from '@/features/admin/tabs/OverviewTab'
import { RegistrationsTab } from '@/features/admin/tabs/RegistrationsTab'
import { SettingsTab } from '@/features/admin/tabs/SettingsTab'
import { TeamsTab } from '@/features/admin/tabs/TeamsTab'
import { cn } from '@/lib/utils'
import { useTournament } from '@/state/TournamentProvider'

export default function AdminPage() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: AdminTab = isAdminTab(raw) ? raw : 'overview'
  const { status, error, reload } = useTournament()
  const go = (next: AdminTab) => setParams(next === 'overview' ? {} : { tab: next })

  return (
    <div className="container-page py-10 lg:py-14">
      <Eyebrow>Administration</Eyebrow>
      <h1 className="mt-4 font-poster text-5xl uppercase leading-none text-fog-50 sm:text-6xl">Control Room</h1>
      <p className="mt-3 max-w-xl text-sm text-fog-400">
        Manage registrations, teams, fixtures, standings and tournament information. Changes go live immediately.
      </p>

      <nav aria-label="Admin sections" className="no-scrollbar -mx-5 mt-10 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-1 border-b border-white/[0.06]">
          {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => go(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={cn(
                  'relative flex h-12 items-center gap-2 px-4 text-sm font-semibold transition-colors',
                  tab === id ? 'text-fog-50' : 'text-fog-500 hover:text-fog-200',
                )}
              >
                <Icon className={cn('size-4', tab === id && 'text-volt-400')} />
                {label}
                {tab === id && (
                  <motion.span layoutId="admin-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-volt-400 shadow-glow-sm" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8">
        {status === 'loading' ? (
          <Spinner label="Loading tournament data" className="py-24" />
        ) : status === 'error' ? (
          <ErrorState message={error ?? ''} onRetry={reload} />
        ) : (
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {tab === 'overview' && <OverviewTab onNavigate={go} />}
            {tab === 'registrations' && <RegistrationsTab />}
            {tab === 'teams' && <TeamsTab />}
            {tab === 'matches' && <MatchesTab />}
            {tab === 'leaderboard' && <LeaderboardTab />}
            {tab === 'members' && <MembersTab />}
            {tab === 'settings' && <SettingsTab />}
          </motion.div>
        )}
      </div>
    </div>
  )
}
