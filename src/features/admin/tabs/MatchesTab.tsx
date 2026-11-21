import { CalendarClock, CircleCheck, Pencil, Plus, RotateCcw, Trash } from 'lucide-react'
import { useState } from 'react'
import { TeamCrest } from '@/components/brand/TeamCrest'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { EmptyState } from '@/components/ui/states'
import { useMatchManager } from '@/features/matches/MatchManager'
import { completedMatches, upcomingMatches } from '@/features/matches/selectors'
import { formatMatchDate, formatMatchTime } from '@/lib/datetime'
import { useTournament } from '@/state/TournamentProvider'
import { AdminPanel, td, th, tr } from '../ui'

export function MatchesTab() {
  const { matches, teamsById } = useTournament()
  const manager = useMatchManager()
  const [view, setView] = useState<'upcoming' | 'completed'>('upcoming')
  const upcoming = upcomingMatches(matches)
  const completed = completedMatches(matches)
  const list = view === 'upcoming' ? upcoming : completed

  return (
    <AdminPanel
      title="Matches"
      description="Schedule fixtures and confirm completion once a match has finished."
      actions={
        <Button size="sm" onClick={manager.openCreate}>
          <Plus /> Add match
        </Button>
      }
    >
      <div className="px-5 pt-5 sm:px-7">
        <Segmented
          label="Match status"
          value={view}
          onChange={setView}
          options={[
            { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { value: 'completed', label: 'Completed', count: completed.length },
          ]}
        />
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={view === 'upcoming' ? 'No upcoming matches' : 'No completed matches'}
          className="m-5 border-0"
        />
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[52rem]">
            <thead>
              <tr>
                <th className={th}>Fixture</th>
                <th className={th}>Date &amp; time</th>
                <th className={th}>Venue</th>
                <th className={th}>{view === 'upcoming' ? 'Status' : 'Result'}</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => {
                const t1 = teamsById.get(m.team1Id)
                const t2 = teamsById.get(m.team2Id)
                return (
                  <tr key={m.id} className={tr}>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <div className="flex">
                          <TeamCrest team={t1} size="sm" />
                          <TeamCrest team={t2} size="sm" className="-ml-3" />
                        </div>
                        <span className="font-semibold text-fog-50">
                          {t1?.name ?? 'TBD'} <span className="text-fog-500">vs</span> {t2?.name ?? 'TBD'}
                        </span>
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap text-fog-300`}>
                      {formatMatchDate(m.scheduledAt)}
                      <span className="block text-xs text-fog-500">{formatMatchTime(m.scheduledAt)}</span>
                    </td>
                    <td className={`${td} max-w-56 truncate text-fog-400`}>{m.venue}</td>
                    <td className={td}>
                      {m.status === 'upcoming' ? (
                        <Badge tone="volt">Upcoming</Badge>
                      ) : (
                        <span className="text-xs text-fog-300">
                          {m.winnerId ? (teamsById.get(m.winnerId)?.name ?? '—') + ' won' : 'Completed'}
                        </span>
                      )}
                    </td>
                    <td className={td}>
                      <div className="flex items-center justify-end gap-1">
                        {m.status === 'upcoming' ? (
                          <Button size="sm" variant="secondary" onClick={() => manager.openComplete(m)} className="mr-1 [&_svg]:text-volt-400">
                            <CircleCheck /> Confirm Match Completed
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => manager.openReopen(m)} aria-label="Move back to upcoming" title="Move back to upcoming">
                            <RotateCcw />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => manager.openEdit(m)} aria-label="Edit match">
                          <Pencil />
                        </Button>
                        <Button variant="danger-ghost" size="icon-sm" onClick={() => manager.openDelete(m)} aria-label="Remove match">
                          <Trash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminPanel>
  )
}
