import { Pencil, Plus, Shield, Trash } from 'lucide-react'
import { TeamCrest } from '@/components/brand/TeamCrest'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/states'
import { useTeamManager } from '@/features/teams/TeamManager'
import { useTournament } from '@/state/TournamentProvider'
import { AdminPanel, td, th, tr } from '../ui'

export function TeamsTab() {
  const { teams, matches } = useTournament()
  const manager = useTeamManager()
  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name))
  const fixtureCount = (id: string) => matches.filter((m) => m.team1Id === id || m.team2Id === id).length

  return (
    <AdminPanel
      title="Teams"
      description={`${teams.length} registered ${teams.length === 1 ? 'team' : 'teams'}`}
      actions={
        <Button size="sm" onClick={manager.openCreate}>
          <Plus /> Add team
        </Button>
      }
    >
      {sorted.length === 0 ? (
        <EmptyState icon={Shield} title="No teams yet" description="Add the first team to get started." className="m-5 border-0" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem]">
            <thead>
              <tr>
                <th className={th}>Team</th>
                <th className={th}>Short</th>
                <th className={th}>City</th>
                <th className={th}>Fixtures</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.id} className={tr}>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <TeamCrest team={t} size="sm" />
                      <span className="font-semibold text-fog-50">{t.name}</span>
                    </div>
                  </td>
                  <td className={`${td} font-mono text-xs text-fog-300`}>{t.shortName}</td>
                  <td className={`${td} text-fog-400`}>{t.city ?? '—'}</td>
                  <td className={`${td} tabular-nums text-fog-300`}>{fixtureCount(t.id)}</td>
                  <td className={td}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => manager.openEdit(t)} aria-label={`Edit ${t.name}`}>
                        <Pencil />
                      </Button>
                      <Button variant="danger-ghost" size="icon-sm" onClick={() => manager.openDelete(t)} aria-label={`Remove ${t.name}`}>
                        <Trash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPanel>
  )
}
