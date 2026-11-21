import { RotateCcw, Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field, Input, Textarea } from '@/components/ui/field'
import { isDemoMode } from '@/data'
import { resetDemoData } from '@/data/demo/demoRepository'
import { createDemoSeed } from '@/data/demo/seed'
import { inclusiveDays } from '@/lib/datetime'
import { getErrorMessage } from '@/lib/utils'
import { resolveVideoSource } from '@/lib/video'
import { useTournament } from '@/state/TournamentProvider'
import type { SettingsInput, TournamentSettings } from '@/types/domain'
import { AdminPanel } from '../ui'

type Form = Record<keyof SettingsInput, string>
type Errors = Partial<Record<keyof SettingsInput, string>>

const toForm = (s: TournamentSettings): Form => ({
  tagline: s.tagline ?? '',
  description: s.description ?? '',
  startDate: s.startDate ?? '',
  endDate: s.endDate ?? '',
  teamsCountOverride: s.teamsCountOverride?.toString() ?? '',
  matchesCountOverride: s.matchesCountOverride?.toString() ?? '',
  daysOverride: s.daysOverride?.toString() ?? '',
  prizePool: s.prizePool ?? '',
  promoVideoUrl: s.promoVideoUrl ?? '',
})

const optionalText = (v: string) => v.trim() || null
const optionalInt = (v: string) => (v.trim() === '' ? null : Number(v))

function validate(f: Form): Errors {
  const e: Errors = {}
  for (const key of ['teamsCountOverride', 'matchesCountOverride', 'daysOverride'] as const) {
    if (f[key].trim() && !/^\d+$/.test(f[key].trim())) e[key] = 'Use a whole number, or leave empty for automatic.'
  }
  if (f.startDate && f.endDate && f.endDate < f.startDate) e.endDate = 'End date must be on or after the start date.'
  if (f.promoVideoUrl.trim() && !resolveVideoSource(f.promoVideoUrl)) {
    e.promoVideoUrl = 'Use an https YouTube, Vimeo, or .mp4 link.'
  }
  if (f.tagline.length > 80) e.tagline = 'Keep the tagline under 80 characters.'
  if (f.description.length > 320) e.description = 'Keep the description under 320 characters.'
  return e
}

export function SettingsTab() {
  const { settings, teams, matches, actions, reload } = useTournament()
  const [form, setForm] = useState<Form>(() => toForm(settings))
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const set = (key: keyof Form, value: string) => {
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
      await actions.updateSettings({
        tagline: optionalText(form.tagline),
        description: optionalText(form.description),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        teamsCountOverride: optionalInt(form.teamsCountOverride),
        matchesCountOverride: optionalInt(form.matchesCountOverride),
        daysOverride: optionalInt(form.daysOverride),
        prizePool: optionalText(form.prizePool),
        promoVideoUrl: optionalText(form.promoVideoUrl),
      })
      toast.success('Tournament information saved')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  const autoDays = form.startDate && form.endDate ? inclusiveDays(form.startDate, form.endDate) : null

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <AdminPanel title="Hero content" description="Shown at the top of the homepage beneath the tournament name.">
        <div className="grid gap-5 p-5 sm:p-7">
          <Field id="s-tagline" label="Tagline" optional error={errors.tagline}>
            <Input id="s-tagline" value={form.tagline} maxLength={80} onChange={(e) => set('tagline', e.target.value)} />
          </Field>
          <Field id="s-desc" label="Description" optional error={errors.description} hint={`${form.description.length}/320`}>
            <Textarea id="s-desc" value={form.description} maxLength={320} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </div>
      </AdminPanel>

      <AdminPanel title="Dates & headline stats" description="Leave a stat empty to calculate it automatically from tournament data.">
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <Field id="s-start" label="Start date" optional>
            <Input id="s-start" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </Field>
          <Field id="s-end" label="End date" optional error={errors.endDate}>
            <Input id="s-end" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </Field>
          <Field id="s-teams" label="Elite Teams" optional error={errors.teamsCountOverride} hint={`Automatic: ${teams.length}`}>
            <Input id="s-teams" inputMode="numeric" placeholder={String(teams.length)} value={form.teamsCountOverride} onChange={(e) => set('teamsCountOverride', e.target.value)} />
          </Field>
          <Field id="s-matches" label="Matches" optional error={errors.matchesCountOverride} hint={`Automatic: ${matches.length}`}>
            <Input id="s-matches" inputMode="numeric" placeholder={String(matches.length)} value={form.matchesCountOverride} onChange={(e) => set('matchesCountOverride', e.target.value)} />
          </Field>
          <Field id="s-days" label="Days" optional error={errors.daysOverride} hint={autoDays ? `Automatic from dates: ${autoDays}` : 'Set dates or enter a value'}>
            <Input id="s-days" inputMode="numeric" placeholder={autoDays ? String(autoDays) : ''} value={form.daysOverride} onChange={(e) => set('daysOverride', e.target.value)} />
          </Field>
          <Field id="s-prize" label="Prize Pool" optional hint="Displayed as entered, e.g. ₹5L">
            <Input id="s-prize" value={form.prizePool} maxLength={16} onChange={(e) => set('prizePool', e.target.value)} />
          </Field>
        </div>
      </AdminPanel>

      <AdminPanel title="Media" description="Adds a play button to the tournament section on the homepage.">
        <div className="p-5 sm:p-7">
          <Field id="s-video" label="Promo video URL" optional error={errors.promoVideoUrl} hint="YouTube, Vimeo, or a direct https .mp4 link.">
            <Input id="s-video" type="url" placeholder="https://www.youtube.com/watch?v=…" value={form.promoVideoUrl} onChange={(e) => set('promoVideoUrl', e.target.value)} />
          </Field>
        </div>
      </AdminPanel>

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {isDemoMode ? (
          <Button variant="ghost" onClick={() => setResetOpen(true)}>
            <RotateCcw /> Reset demo data
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" loading={pending}>
          <Save /> Save changes
        </Button>
      </div>

      {isDemoMode && (
        <ConfirmDialog
          open={resetOpen}
          onOpenChange={setResetOpen}
          tone="danger"
          title="Reset demo data?"
          description="All teams, matches and settings in this browser will be restored to the original sample data."
          confirmLabel="Reset data"
          successMessage="Demo data restored"
          onConfirm={async () => {
            resetDemoData()
            await reload()
            setForm(toForm(createDemoSeed().settings))
          }}
        />
      )}
    </form>
  )
}
