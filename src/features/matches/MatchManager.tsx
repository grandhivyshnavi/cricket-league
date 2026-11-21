import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAuth } from '@/state/AuthProvider'
import { useTournament } from '@/state/TournamentProvider'
import type { Match } from '@/types/domain'
import { CompleteMatchDialog } from './CompleteMatchDialog'
import { MatchFormDialog } from './MatchFormDialog'

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit' | 'complete' | 'delete' | 'reopen'; match: Match }
  | null

interface MatchManager {
  openCreate(): void
  openEdit(match: Match): void
  openComplete(match: Match): void
  openDelete(match: Match): void
  openReopen(match: Match): void
}

const MatchManagerContext = createContext<MatchManager | null>(null)

/** Hosts all admin match dialogs so any card or table can trigger them. */
export function MatchManagerProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  const { teamsById, actions } = useTournament()
  const [dialog, setDialog] = useState<DialogState>(null)

  const api = useMemo<MatchManager>(
    () => ({
      openCreate: () => setDialog({ kind: 'create' }),
      openEdit: (match) => setDialog({ kind: 'edit', match }),
      openComplete: (match) => setDialog({ kind: 'complete', match }),
      openDelete: (match) => setDialog({ kind: 'delete', match }),
      openReopen: (match) => setDialog({ kind: 'reopen', match }),
    }),
    [],
  )

  const close = (open: boolean) => !open && setDialog(null)
  const label = (m: Match) => `${teamsById.get(m.team1Id)?.name ?? 'TBD'} vs ${teamsById.get(m.team2Id)?.name ?? 'TBD'}`

  return (
    <MatchManagerContext.Provider value={api}>
      {children}
      {isAdmin && dialog && (
        <>
          {(dialog.kind === 'create' || dialog.kind === 'edit') && (
            <MatchFormDialog
              key={dialog.kind === 'edit' ? dialog.match.id : 'new'}
              open
              onOpenChange={close}
              match={dialog.kind === 'edit' ? dialog.match : undefined}
            />
          )}
          {dialog.kind === 'complete' && (
            <CompleteMatchDialog key={dialog.match.id} open onOpenChange={close} match={dialog.match} />
          )}
          {dialog.kind === 'delete' && (
            <ConfirmDialog
              open
              onOpenChange={close}
              tone="danger"
              title="Remove this match?"
              description={`${label(dialog.match)} will be permanently removed from the schedule.`}
              confirmLabel="Remove match"
              successMessage="Match removed"
              onConfirm={() => actions.deleteMatch(dialog.match.id)}
            />
          )}
          {dialog.kind === 'reopen' && (
            <ConfirmDialog
              open
              onOpenChange={close}
              title="Move back to upcoming?"
              description={`${label(dialog.match)} will return to Upcoming Matches and its recorded result will be cleared.`}
              confirmLabel="Move to upcoming"
              successMessage="Match moved back to upcoming"
              onConfirm={() => actions.reopenMatch(dialog.match.id)}
            />
          )}
        </>
      )}
    </MatchManagerContext.Provider>
  )
}

export function useMatchManager() {
  const ctx = useContext(MatchManagerContext)
  if (!ctx) throw new Error('useMatchManager must be used within MatchManagerProvider')
  return ctx
}
