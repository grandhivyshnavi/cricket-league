import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { TeamCrest } from '@/components/brand/TeamCrest'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/field'
import { cn, getErrorMessage } from '@/lib/utils'
import { useTournament } from '@/state/TournamentProvider'
import type { Team, TeamInput } from '@/types/domain'

const SWATCHES = ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#c3f03c', '#f97316', '#64748b']
const HEX = /^#[0-9a-f]{6}$/i

interface FormState {
  name: string
  shortName: string
  city: string
  color: string
  logoUrl: string
}
type Errors = Partial<Record<keyof FormState, string>>

function validate(f: FormState): Errors {
  const e: Errors = {}
  const name = f.name.trim()
  if (name.length < 2) e.name = 'Enter the team name.'
  else if (name.length > 60) e.name = 'Keep the name under 60 characters.'
  if (!/^[a-z0-9]{2,4}$/i.test(f.shortName.trim())) e.shortName = 'Use 2–4 letters or numbers.'
  if (!HEX.test(f.color)) e.color = 'Use a hex colour like #3B82F6.'
  if (f.logoUrl.trim()) {
    try {
      if (new URL(f.logoUrl.trim()).protocol !== 'https:') e.logoUrl = 'Logo URL must start with https://'
    } catch {
      e.logoUrl = 'Enter a valid image URL.'
    }
  }
  return e
}

interface Props {
  open: boolean
  onOpenChange(open: boolean): void
  team?: Team
}

export function TeamFormDialog({ open, onOpenChange, team }: Props) {
  const { actions } = useTournament()
  const [form, setForm] = useState<FormState>({
    name: team?.name ?? '',
    shortName: team?.shortName ?? '',
    city: team?.city ?? '',
    color: team?.color ?? SWATCHES[4],
    logoUrl: team?.logoUrl ?? '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    const input: TeamInput = {
      name: form.name.trim(),
      shortName: form.shortName.trim().toUpperCase(),
      city: form.city.trim() || null,
      color: form.color.toLowerCase(),
      logoUrl: form.logoUrl.trim() || null,
    }
    setPending(true)
    try {
      if (team) await actions.updateTeam(team.id, input)
      else await actions.createTeam(input)
      toast.success(team ? 'Team updated' : 'Team added')
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  const preview = { name: form.name || 'New team', shortName: form.shortName || '—', color: HEX.test(form.color) ? form.color : '#4a5149', logoUrl: form.logoUrl.trim() || null }

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent title={team ? 'Edit team' : 'Add a team'} description="Team details appear on the leaderboard, fixtures and team pages.">
        <form onSubmit={handleSubmit} noValidate className="grid gap-5">
          <div className="flex items-center gap-4 rounded-card border border-white/[0.06] bg-white/[0.02] p-4">
            <TeamCrest key={preview.logoUrl ?? 'crest'} team={preview} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-heading text-lg text-fog-50">{preview.name}</p>
              <p className="text-xs text-fog-500">Live preview</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
            <Field id="t-name" label="Team name" error={errors.name}>
              <Input id="t-name" value={form.name} maxLength={60} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(errors.name)} />
            </Field>
            <Field id="t-short" label="Short name" error={errors.shortName}>
              <Input
                id="t-short"
                value={form.shortName}
                maxLength={4}
                placeholder="e.g. GT"
                className="uppercase"
                onChange={(e) => set('shortName', e.target.value)}
                aria-invalid={Boolean(errors.shortName)}
              />
            </Field>
          </div>
          <Field id="t-city" label="City" optional>
            <Input id="t-city" value={form.city} maxLength={60} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field id="t-color" label="Crest colour" error={errors.color}>
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className={cn(
                    'size-8 rounded-full border-2 transition-transform hover:scale-110',
                    form.color.toLowerCase() === c ? 'border-fog-50' : 'border-transparent',
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Use colour ${c}`}
                  aria-pressed={form.color.toLowerCase() === c}
                />
              ))}
              <Input
                id="t-color"
                value={form.color}
                maxLength={7}
                onChange={(e) => set('color', e.target.value)}
                className="ml-auto h-9 w-28 font-mono text-xs uppercase"
                aria-invalid={Boolean(errors.color)}
              />
            </div>
          </Field>
          <Field id="t-logo" label="Logo image URL" optional error={errors.logoUrl} hint="Square PNG or SVG with transparent background works best.">
            <Input id="t-logo" type="url" inputMode="url" placeholder="https://…" value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} aria-invalid={Boolean(errors.logoUrl)} />
          </Field>
          <DialogFooter className="mt-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {team ? 'Save changes' : 'Add team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
