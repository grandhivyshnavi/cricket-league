import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/field'
import { TIME_ZONE_LABEL } from '@/config/site'
import { istPartsToIso, isoToIstParts } from '@/lib/datetime'
import { getErrorMessage } from '@/lib/utils'
import { useTournament } from '@/state/TournamentProvider'
import type { Match } from '@/types/domain'

interface FormState {
  team1Id: string
  team2Id: string
  date: string
  time: string
  venue: string
}

type Errors = Partial<Record<keyof FormState, string>>

function validate(f: FormState): Errors {
  const e: Errors = {}
  if (!f.team1Id) e.team1Id = 'Select the first team.'
  if (!f.team2Id) e.team2Id = 'Select the second team.'
  if (f.team1Id && f.team1Id === f.team2Id) e.team2Id = 'Choose a different opponent.'
  if (!f.date) e.date = 'Enter the match date.'
  if (!f.time) e.time = 'Enter the start time.'
  const venue = f.venue.trim()
  if (venue.length < 2) e.venue = 'Enter the venue.'
  else if (venue.length > 120) e.venue = 'Keep the venue under 120 characters.'
  return e
}

function initialState(match?: Match): FormState {
  if (!match) return { team1Id: '', team2Id: '', date: '', time: '', venue: '' }
  const { date, time } = isoToIstParts(match.scheduledAt)
  return { team1Id: match.team1Id, team2Id: match.team2Id, date, time, venue: match.venue }
}

interface Props {
  open: boolean
  onOpenChange(open: boolean): void
  match?: Match
}

export function MatchFormDialog({ open, onOpenChange, match }: Props) {
  const { teams, matches, actions } = useTournament()
  const [form, setForm] = useState<FormState>(() => initialState(match))
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState(false)
  const editing = Boolean(match)

  const sortedTeams = useMemo(() => [...teams].sort((a, b) => a.name.localeCompare(b.name)), [teams])
  const venues = useMemo(() => [...new Set(matches.map((m) => m.venue))].sort(), [matches])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    setPending(true)
    try {
      const input = {
        team1Id: form.team1Id,
        team2Id: form.team2Id,
        scheduledAt: istPartsToIso(form.date, form.time),
        venue: form.venue.trim(),
      }
      if (match) await actions.updateMatch(match.id, input)
      else await actions.createMatch(input)
      toast.success(editing ? 'Match updated' : 'Match added to the schedule')
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  const notEnoughTeams = teams.length < 2

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent
        title={editing ? 'Edit match' : 'Add a new match'}
        description={`Fixture details appear instantly on the schedule. Times are in ${TIME_ZONE_LABEL}.`}
      >
        {notEnoughTeams ? (
          <p className="rounded-control border border-white/10 bg-white/[0.03] p-4 text-sm text-fog-300">
            Add at least two teams before scheduling a match.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="m-team1" label="Team 1" error={errors.team1Id}>
                <Select
                  id="m-team1"
                  value={form.team1Id}
                  onChange={(e) => set('team1Id', e.target.value)}
                  aria-invalid={Boolean(errors.team1Id)}
                >
                  <option value="">Select team</option>
                  {sortedTeams.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === form.team2Id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="m-team2" label="Team 2" error={errors.team2Id}>
                <Select
                  id="m-team2"
                  value={form.team2Id}
                  onChange={(e) => set('team2Id', e.target.value)}
                  aria-invalid={Boolean(errors.team2Id)}
                >
                  <option value="">Select team</option>
                  {sortedTeams.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === form.team1Id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="m-date" label="Match date" error={errors.date}>
                <Input
                  id="m-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  aria-invalid={Boolean(errors.date)}
                />
              </Field>
              <Field id="m-time" label={`Start time (${TIME_ZONE_LABEL})`} error={errors.time}>
                <Input
                  id="m-time"
                  type="time"
                  value={form.time}
                  onChange={(e) => set('time', e.target.value)}
                  aria-invalid={Boolean(errors.time)}
                />
              </Field>
            </div>
            <Field id="m-venue" label="Venue" error={errors.venue}>
              <Input
                id="m-venue"
                list="m-venue-options"
                placeholder="Ground name, city"
                value={form.venue}
                maxLength={120}
                onChange={(e) => set('venue', e.target.value)}
                aria-invalid={Boolean(errors.venue)}
              />
              <datalist id="m-venue-options">
                {venues.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </Field>
            <DialogFooter className="mt-3">
              <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                {editing ? 'Save changes' : 'Save match'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
