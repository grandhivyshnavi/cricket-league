import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field, Input, Select } from '@/components/ui/field'
import { useTournament } from '@/state/TournamentProvider'
import type { Match } from '@/types/domain'

interface Props {
  open: boolean
  onOpenChange(open: boolean): void
  match: Match
}

/**
 * Explicit admin confirmation that a match has finished. Winner and summary
 * are optional records; standings are never changed automatically.
 */
export function CompleteMatchDialog({ open, onOpenChange, match }: Props) {
  const { teamsById, actions } = useTournament()
  const [winnerId, setWinnerId] = useState('')
  const [summary, setSummary] = useState('')
  const t1 = teamsById.get(match.team1Id)
  const t2 = teamsById.get(match.team2Id)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm match completed"
      description={
        <>
          <strong className="text-fog-100">
            {t1?.name ?? 'TBD'} vs {t2?.name ?? 'TBD'}
          </strong>{' '}
          will move from Upcoming Matches to Results. Leaderboard points are not changed automatically — update them
          from Admin → Leaderboard.
        </>
      }
      confirmLabel="Confirm Match Completed"
      successMessage="Match marked as completed"
      onConfirm={() =>
        actions.completeMatch(match.id, { winnerId: winnerId || null, resultSummary: summary.trim() || null })
      }
    >
      <div className="grid gap-5">
        <Field id="c-winner" label="Winner" optional>
          <Select id="c-winner" value={winnerId} onChange={(e) => setWinnerId(e.target.value)}>
            <option value="">Not recorded</option>
            {t1 && <option value={t1.id}>{t1.name}</option>}
            {t2 && <option value={t2.id}>{t2.name}</option>}
          </Select>
        </Field>
        <Field id="c-summary" label="Result summary" optional hint="Shown on the result card, e.g. “Won by 6 wickets”.">
          <Input id="c-summary" value={summary} maxLength={200} onChange={(e) => setSummary(e.target.value)} />
        </Field>
      </div>
    </ConfirmDialog>
  )
}
