import { CircleExclamationPoint, IndianRupee, Minus, Plus, Send } from 'lucide-react'
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'
import { REGISTRATION_FEE } from '@/config/site'
import { submitTeamRegistration, type SubmitStage } from '@/data/registrations'
import { cn, getErrorMessage } from '@/lib/utils'
import { INDIAN_STATES } from './indianStates'
import { PhotoUpload } from './PhotoUpload'
import {
  MAX_PLAYERS,
  emptyRegistrationForm,
  fieldOrderForPlayers,
  isEmptyPlayer,
  isIndianMobile,
  mapDuplicateError,
  normalizeIndianMobile,
  toSubmission,
  validateField,
  validateRegistration,
  type FieldKey,
  type FormErrors,
  type PlayerEntry,
  type RegistrationForm as FormState,
  type TeamField,
} from './validation'

export const REGISTRATION_SECTIONS = [
  { id: 'reg-team', title: 'Team Information' },
  { id: 'reg-roster', title: 'Player Roster' },
  { id: 'reg-contact', title: 'Contact Details' },
  { id: 'reg-address', title: 'Address Details' },
  { id: 'reg-photo-section', title: 'Team Photo' },
  { id: 'reg-submit', title: 'Register' },
] as const

const STAGE_LABEL: Record<SubmitStage, string> = {
  saving: 'Saving registration…',
  uploading: 'Uploading team photo…',
  finalising: 'Finalising…',
}

/** DOM id for each field — used for labels, error wiring and focusing. */
export function fieldId(key: FieldKey) {
  return `reg-${key.replace(/\./g, '-')}`
}

function describedBy(key: FieldKey, errors: FormErrors) {
  return errors[key] ? `${fieldId(key)}-error` : undefined
}

function FormSection({ id, step, title, description, aside, children }: {
  id: string
  step: number
  title: string
  description?: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28 rounded-panel surface hairline-top">
      <header className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-volt-400/25 bg-volt-400/10 font-heading text-sm tabular-nums text-volt-300 shadow-[0_0_24px_-6px_rgb(195_240_60/0.5)]">
            {String(step).padStart(2, '0')}
          </span>
          <div>
            <h2 id={`${id}-title`} className="font-heading text-lg uppercase text-fog-50">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-fog-400">{description}</p>}
          </div>
        </div>
        {aside}
      </header>
      <div className="px-5 py-6 sm:px-7">{children}</div>
    </section>
  )
}

/** Indian mobile input with a fixed +91 prefix. */
function MobileInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-white/10 pl-3.5 pr-2.5 text-sm font-semibold text-fog-400">
        +91
      </span>
      <Input type="tel" inputMode="tel" maxLength={16} placeholder="98765 43210" className={cn('pl-16 tabular-nums', className)} {...props} />
    </div>
  )
}

interface RegistrationFormProps {
  onSuccess(result: { id: string; teamName: string; email: string }): void
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [form, setForm] = useState<FormState>(emptyRegistrationForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [photo, setPhoto] = useState<File | null>(null)
  const [stage, setStage] = useState<SubmitStage | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const busy = useRef(false)
  const submitting = stage !== null

  const liveErrors = useMemo(() => validateRegistration(form), [form])
  const completedPlayers = form.players.filter((p) => !isEmptyPlayer(p) && !liveErrors[`players.${form.players.indexOf(p)}.name`] && !liveErrors[`players.${form.players.indexOf(p)}.phone`]).length

  const setError = (key: FieldKey, message: string | null | undefined) =>
    setErrors((e) => (e[key] === (message ?? undefined) ? e : { ...e, [key]: message ?? undefined }))

  function setTeamField(key: TeamField, value: string) {
    const next = { ...form, [key]: value }
    setForm(next)
    if (errors[key]) setError(key, validateField(key, next))
  }

  function setPlayer(index: number, key: keyof PlayerEntry, value: string) {
    const players = form.players.map((p, i) => (i === index ? { ...p, [key]: value } : p))
    const next = { ...form, players }
    setForm(next)
    const fk: FieldKey = `players.${index}.${key}`
    if (errors[fk]) setError(fk, validateField(fk, next))
  }

  function blur(key: Exclude<FieldKey, 'photo'>) {
    // Only show "required" messages once the user has typed something or submitted.
    const error = validateField(key, form)
    const value = key.startsWith('players.')
      ? form.players[Number(key.split('.')[1])][key.endsWith('name') ? 'name' : 'phone']
      : form[key as TeamField]
    if (value.trim() || errors[key]) setError(key, error)
  }

  /** Tidies a valid mobile number to its 10-digit form when leaving the field. */
  const tidyMobile = (value: string) => (isIndianMobile(value) ? normalizeIndianMobile(value) : value)

  function addPlayer() {
    if (form.players.length >= MAX_PLAYERS) return
    setForm((f) => ({ ...f, players: [...f.players, { name: '', phone: '' }] }))
  }

  function removePlayer(index: number) {
    setForm((f) => {
      const players = f.players.filter((_, i) => i !== index)
      return { ...f, players }
    })
    // Clear any errors for the removed row and re-index subsequent rows.
    setErrors((e) => {
      const next: FormErrors = {}
      for (const [k, v] of Object.entries(e)) {
        const m = /^players\.(\d+)\.(.+)$/.exec(k)
        if (m) {
          const idx = Number(m[1])
          if (idx === index) continue
          const newIdx = idx > index ? idx - 1 : idx
          next[`players.${newIdx}.${m[2]}` as FieldKey] = v as string
        } else {
          next[k as FieldKey] = v as string
        }
      }
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy.current) return
    const found: FormErrors = { ...validateRegistration(form) }
    if (errors.photo) found.photo = errors.photo
    setErrors(found)
    const dynamicOrder = fieldOrderForPlayers(form.players.length)
    const invalid = dynamicOrder.filter((k) => found[k])
    if (invalid.length) {
      setSubmitError(`Please fix ${invalid.length} highlighted field${invalid.length === 1 ? '' : 's'} before registering.`)
      const el = document.getElementById(fieldId(invalid[0]))
      el?.focus({ preventScroll: true })
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    busy.current = true
    setSubmitError(null)
    try {
      const submission = toSubmission(form)
      const { id } = await submitTeamRegistration(submission, photo, setStage)
      toast.success('Registration submitted')
      onSuccess({ id, teamName: submission.team.teamName, email: submission.team.email })
    } catch (err) {
      const message = getErrorMessage(err, 'We could not save your registration. Please try again.')
      // Map server-side duplicate errors to the specific field.
      const mapped = mapDuplicateError(message)
      if (mapped) {
        setErrors((prev) => ({ ...prev, [mapped.key]: mapped.message }))
        setSubmitError(mapped.message)
        const el = document.getElementById(fieldId(mapped.key))
        el?.focus({ preventScroll: true })
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        setSubmitError(message)
      }
      toast.error(mapped?.message ?? message)
    } finally {
      busy.current = false
      setStage(null)
    }
  }

  const teamInput = (key: TeamField, props: InputHTMLAttributes<HTMLInputElement>) => ({
    id: fieldId(key),
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setTeamField(key, e.target.value),
    onBlur: () => blur(key),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': describedBy(key, errors),
    disabled: submitting,
    ...props,
  })

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="grid gap-6">
      <p className="text-sm text-fog-400">
        Fields marked <span className="font-semibold text-volt-400">*</span> are required.
      </p>

      <div className="flex items-center gap-3 rounded-card border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg border border-volt-400/20 bg-volt-400/10 text-volt-400">
          <IndianRupee className="size-4" aria-hidden />
        </span>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-fog-500">Registration Fee</span>
          <span className="font-heading text-lg tabular-nums text-volt-300">{REGISTRATION_FEE}</span>
        </div>
      </div>

      <FormSection id="reg-team" step={1} title="Team Information" description="The name your team will compete under.">
        <Field id={fieldId('teamName')} label="Team name" required error={errors.teamName}>
          <Input {...teamInput('teamName', { required: true, maxLength: 60, autoComplete: 'organization', placeholder: 'e.g. Kadapa Kings XI' })} />
        </Field>
      </FormSection>

      <FormSection
        id="reg-roster"
        step={2}
        title="Player Roster"
        description={`Add your players (up to ${MAX_PLAYERS}). Empty rows are ignored — only completed rows will be saved.`}
        aside={
          <div className="flex items-center gap-3 sm:min-w-44" aria-live="polite">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
              <div
                className="h-full rounded-full bg-volt-400 shadow-glow-sm transition-[width] duration-500 ease-out-expo"
                style={{ width: `${(completedPlayers / MAX_PLAYERS) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums text-fog-300">
              {completedPlayers}/{MAX_PLAYERS} <span className="sr-only">players complete</span>
            </span>
          </div>
        }
      >
        <div
          className="hidden grid-cols-[3rem_1fr_1fr_2.5rem] gap-4 px-4 pb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-fog-500 md:grid"
          aria-hidden
        >
          <span>#</span>
          <span>Player name</span>
          <span>Contact number</span>
          <span />
        </div>
        <ol className="grid gap-3 md:gap-0 md:divide-y md:divide-white/[0.05] md:overflow-hidden md:rounded-card md:border md:border-white/[0.06]">
          {form.players.map((player, i) => {
            const nameKey: FieldKey = `players.${i}.name`
            const phoneKey: FieldKey = `players.${i}.phone`
            // Initial rows (index < INITIAL_PLAYER_ROWS) can be removed if more rows were added;
            // always show remove button when there are more than 1 rows.
            const canRemove = form.players.length > 1
            return (
              <li
                key={i}
                className="rounded-card border border-white/[0.06] bg-white/[0.015] p-4 md:grid md:grid-cols-[3rem_1fr_1fr_2.5rem] md:items-start md:gap-4 md:rounded-none md:border-0 md:bg-transparent md:px-4 md:py-3 md:even:bg-white/[0.012]"
              >
                <div className="mb-3 flex items-center justify-between md:mb-0 md:h-11">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg border border-white/10 bg-ink-900 font-heading text-xs tabular-nums text-fog-300">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-fog-200 md:hidden">Player {i + 1}</span>
                  </div>
                  {/* Mobile remove button */}
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => removePlayer(i)}
                      disabled={submitting}
                      className="grid size-8 place-items-center rounded-lg border border-danger-500/30 bg-danger-500/[0.06] text-danger-400 transition-colors hover:border-danger-500/60 hover:bg-danger-500/[0.12] disabled:opacity-40 md:hidden"
                      aria-label={`Remove player ${i + 1}`}
                    >
                      <Minus className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:contents">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={fieldId(nameKey)} className="text-xs font-semibold text-fog-400 md:sr-only">
                      <span className="sr-only">Player {i + 1} </span>Name
                    </label>
                    <Input
                      id={fieldId(nameKey)}
                      value={player.name}
                      maxLength={80}
                      autoComplete="off"
                      placeholder="Full name"
                      disabled={submitting}
                      onChange={(e) => setPlayer(i, 'name', e.target.value)}
                      onBlur={() => blur(nameKey)}
                      aria-invalid={Boolean(errors[nameKey])}
                      aria-describedby={describedBy(nameKey, errors)}
                    />
                    {errors[nameKey] && (
                      <p id={`${fieldId(nameKey)}-error`} className="text-xs font-medium text-danger-400">
                        {errors[nameKey]}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={fieldId(phoneKey)} className="text-xs font-semibold text-fog-400 md:sr-only">
                      <span className="sr-only">Player {i + 1} </span>Contact number
                    </label>
                    <MobileInput
                      id={fieldId(phoneKey)}
                      value={player.phone}
                      autoComplete="off"
                      disabled={submitting}
                      onChange={(e) => setPlayer(i, 'phone', e.target.value)}
                      onBlur={() => {
                        setPlayer(i, 'phone', tidyMobile(player.phone))
                        blur(phoneKey)
                      }}
                      aria-invalid={Boolean(errors[phoneKey])}
                      aria-describedby={describedBy(phoneKey, errors)}
                    />
                    {errors[phoneKey] && (
                      <p id={`${fieldId(phoneKey)}-error`} className="text-xs font-medium text-danger-400">
                        {errors[phoneKey]}
                      </p>
                    )}
                  </div>
                </div>
                {/* Desktop remove button */}
                <div className="hidden md:flex md:h-11 md:items-center md:justify-center">
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => removePlayer(i)}
                      disabled={submitting}
                      className="grid size-8 place-items-center rounded-lg border border-danger-500/30 bg-danger-500/[0.06] text-danger-400 transition-colors hover:border-danger-500/60 hover:bg-danger-500/[0.12] disabled:opacity-40"
                      aria-label={`Remove player ${i + 1}`}
                    >
                      <Minus className="size-3.5" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ol>

        {/* Add Player button */}
        {form.players.length < MAX_PLAYERS && (
          <div className="mt-4">
            <button
              type="button"
              onClick={addPlayer}
              disabled={submitting}
              className="flex items-center gap-2 rounded-control border border-dashed border-volt-400/30 bg-volt-400/[0.04] px-4 py-2.5 text-sm font-semibold text-volt-300 transition-colors hover:border-volt-400/60 hover:bg-volt-400/[0.08] disabled:opacity-40"
            >
              <Plus className="size-4" />
              Add Player
            </button>
          </div>
        )}
      </FormSection>

      <FormSection id="reg-contact" step={3} title="Contact Details" description="How the organisers will reach your team.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={fieldId('email')} label="Email address" required error={errors.email}>
            <Input
              {...teamInput('email', { type: 'email', inputMode: 'email', required: true, maxLength: 254, autoComplete: 'email', placeholder: 'captain@example.com' })}
            />
          </Field>
          <Field id={fieldId('contactPhone')} label="Team contact number" required error={errors.contactPhone}>
            <MobileInput
              {...teamInput('contactPhone', { required: true, autoComplete: 'tel-national' })}
              onBlur={() => {
                setTeamField('contactPhone', tidyMobile(form.contactPhone))
                blur('contactPhone')
              }}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection id="reg-address" step={4} title="Address Details">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={fieldId('addressLine1')} label="Street address" required error={errors.addressLine1} className="sm:col-span-2">
            <Input {...teamInput('addressLine1', { required: true, maxLength: 120, autoComplete: 'address-line1', placeholder: 'House / building, street' })} />
          </Field>
          <Field id={fieldId('addressLine2')} label="Street address line 2" optional error={errors.addressLine2} className="sm:col-span-2">
            <Input {...teamInput('addressLine2', { maxLength: 120, autoComplete: 'address-line2', placeholder: 'Area, landmark' })} />
          </Field>
          <Field id={fieldId('city')} label="City" required error={errors.city}>
            <Input {...teamInput('city', { required: true, maxLength: 60, autoComplete: 'address-level2', placeholder: 'e.g. Kadapa' })} />
          </Field>
          <Field id={fieldId('state')} label="State" required error={errors.state}>
            <Select
              id={fieldId('state')}
              value={form.state}
              required
              autoComplete="address-level1"
              disabled={submitting}
              onChange={(e) => {
                setTeamField('state', e.target.value)
                setError('state', validateField('state', { ...form, state: e.target.value }))
              }}
              aria-invalid={Boolean(errors.state)}
              aria-describedby={describedBy('state', errors)}
              className={cn(!form.state && 'text-fog-500')}
            >
              <option value="" disabled>
                Select state
              </option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s} className="text-fog-50">
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={fieldId('pinCode')} label="PIN code" required error={errors.pinCode}>
            <Input
              {...teamInput('pinCode', { inputMode: 'numeric', required: true, maxLength: 6, autoComplete: 'postal-code', placeholder: '516001' })}
              onChange={(e) => setTeamField('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="tabular-nums"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection id="reg-photo-section" step={5} title="Team Photo" description="Optional — one group photo of your squad.">
        <PhotoUpload
          id={fieldId('photo')}
          file={photo}
          error={errors.photo}
          disabled={submitting}
          onChange={setPhoto}
          onError={(message) => setError('photo', message)}
        />
      </FormSection>

      <section id="reg-submit" aria-label="Register" className="scroll-mt-28 rounded-panel border border-volt-400/15 bg-linear-to-br from-ink-800 to-ink-900 p-5 shadow-card sm:p-7">
        {submitError && (
          <div role="alert" className="mb-5 flex items-start gap-3 rounded-control border border-danger-500/25 bg-danger-500/[0.06] px-4 py-3 text-sm text-fog-200">
            <CircleExclamationPoint className="mt-0.5 size-4 shrink-0 text-danger-400" aria-hidden />
            <span>{submitError}</span>
          </div>
        )}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm leading-relaxed text-fog-400">
            By registering, you confirm the details are correct. Organisers will review your entry and contact the team.
          </p>
          <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto sm:min-w-52">
            {stage ? STAGE_LABEL[stage] : (
              <>
                <Send /> Register team
              </>
            )}
          </Button>
        </div>
        <p className="sr-only" aria-live="assertive">
          {stage ? STAGE_LABEL[stage] : ''}
        </p>
      </section>
    </form>
  )
}
