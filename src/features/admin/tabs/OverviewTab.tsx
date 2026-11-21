import { CalendarClock, CircleCheck, ListOrdered, Plus, Settings, Shield, Swords, type LucideIcon } from 'lucide-react'
import { TeamCrest } from '@/components/brand/TeamCrest'
import { Button } from '@/components/ui/button'
import { useMatchManager } from '@/features/matches/MatchManager'
import { completedMatches, upcomingMatches } from '@/features/matches/selectors'
import { useTeamManager } from '@/features/teams/TeamManager'
import { formatMatchDate, formatMatchTime } from '@/lib/datetime'
import { useTournament } from '@/state/TournamentProvider'
import { AdminPanel } from '../ui'
import type { AdminTab } from '../adminTabs'

function Metric({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone?: 'warn' }) {
  return (
    <div className="rounded-card p-5 surface">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fog-500">{label}</p>
        <Icon className={tone === 'warn' && value > 0 ? 'size-4 text-gold-400' : 'size-4 text-volt-400'} aria-hidden />
      </div>
      <p className="mt-4 font-heading text-4xl tabular-nums text-fog-50">{value}</p>
    </div>
  )
}

export function OverviewTab({ onNavigate }: { onNavigate(tab: AdminTab): void }) {
  const { teams, matches, teamsById } = useTournament()
  const matchManager = useMatchManager()
  const teamManager = useTeamManager()
  const upcoming = upcomingMatches(matches)
  const now = Date.now()
  const awaiting = upcoming.filter((m) => Date.parse(m.scheduledAt) < now)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric icon={Shield} label="Teams" value={teams.length} />
        <Metric icon={CalendarClock} label="Upcoming" value={upcoming.length} />
        <Metric icon={CircleCheck} label="Completed" value={completedMatches(matches).length} />
        <Metric icon={Swords} label="Awaiting result" value={awaiting.length} tone="warn" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <AdminPanel
          title="Awaiting confirmation"
          description="Fixtures whose start time has passed but are still marked upcoming."
        >
          {awaiting.length === 0 ? (
            <p className="px-7 py-10 text-center text-sm text-fog-400">All caught up — no matches need confirming.</p>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {awaiting.map((m) => {
                const t1 = teamsById.get(m.team1Id)
                const t2 = teamsById.get(m.team2Id)
                return (
                  <li key={m.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-7">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <TeamCrest team={t1} size="sm" />
                      <TeamCrest team={t2} size="sm" className="-ml-5" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-fog-50">
                          {t1?.name} vs {t2?.name}
                        </p>
                        <p className="text-xs text-fog-500">
                          {formatMatchDate(m.scheduledAt)} · {formatMatchTime(m.scheduledAt)}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => matchManager.openComplete(m)}>
                      <CircleCheck /> Confirm Match Completed
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title="Quick actions">
          <div className="grid gap-2 p-4">
            <Button variant="secondary" className="justify-start" onClick={teamManager.openCreate}>
              <Plus /> Add team
            </Button>
            <Button variant="secondary" className="justify-start" onClick={matchManager.openCreate}>
              <Plus /> Add match
            </Button>
            <Button variant="secondary" className="justify-start" onClick={() => onNavigate('leaderboard')}>
              <ListOrdered /> Update leaderboard
            </Button>
            <Button variant="secondary" className="justify-start" onClick={() => onNavigate('settings')}>
              <Settings /> Tournament info
            </Button>
          </div>
        </AdminPanel>
      </div>
    </div>
  )
}
