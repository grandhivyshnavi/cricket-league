import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAuth } from '@/state/AuthProvider'
import { useTournament } from '@/state/TournamentProvider'
import type { Team } from '@/types/domain'
import { TeamFormDialog } from './TeamFormDialog'

type DialogState = { kind: 'create' } | { kind: 'edit' | 'delete'; team: Team } | null

interface TeamManager {
  openCreate(): void
  openEdit(team: Team): void
  openDelete(team: Team): void
}

const TeamManagerContext = createContext<TeamManager | null>(null)

export function TeamManagerProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  const { actions } = useTournament()
  const [dialog, setDialog] = useState<DialogState>(null)

  const api = useMemo<TeamManager>(
    () => ({
      openCreate: () => setDialog({ kind: 'create' }),
      openEdit: (team) => setDialog({ kind: 'edit', team }),
      openDelete: (team) => setDialog({ kind: 'delete', team }),
    }),
    [],
  )
  const close = (open: boolean) => !open && setDialog(null)

  return (
    <TeamManagerContext.Provider value={api}>
      {children}
      {isAdmin && dialog && (dialog.kind === 'create' || dialog.kind === 'edit') && (
        <TeamFormDialog
          key={dialog.kind === 'edit' ? dialog.team.id : 'new'}
          open
          onOpenChange={close}
          team={dialog.kind === 'edit' ? dialog.team : undefined}
        />
      )}
      {isAdmin && dialog?.kind === 'delete' && (
        <ConfirmDialog
          open
          onOpenChange={close}
          tone="danger"
          title={`Remove ${dialog.team.name}?`}
          description="The team and its leaderboard record will be permanently removed. Teams with scheduled or completed matches cannot be removed until those matches are deleted."
          confirmLabel="Remove team"
          successMessage="Team removed"
          onConfirm={() => actions.deleteTeam(dialog.team.id)}
        />
      )}
    </TeamManagerContext.Provider>
  )
}

export function useTeamManager() {
  const ctx = useContext(TeamManagerContext)
  if (!ctx) throw new Error('useTeamManager must be used within TeamManagerProvider')
  return ctx
}
