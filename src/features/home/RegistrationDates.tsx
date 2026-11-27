import { CalendarDays, Clock } from 'lucide-react'
import { Eyebrow } from '@/components/ui/badge'
import { ButtonLink, arrowNudge } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { REGISTRATION_WINDOW, ROUTES } from '@/config/site'
import { formatShortDate, registrationStatus } from '@/lib/datetime'
import { ArrowRight } from 'lucide-react'
import { RegistrationFee } from '@/features/registration/RegistrationFee'

const opensFormatted = formatShortDate(`${REGISTRATION_WINDOW.opensDate}T12:00:00+05:30`)
const closesFormatted = formatShortDate(`${REGISTRATION_WINDOW.closesDate}T12:00:00+05:30`)

interface DateCardProps {
  label: string
  date: string
  fullDate: string
  accent?: boolean
}

function DateCard({ label, date, fullDate, accent }: DateCardProps) {
  return (
    <div
      className={
        accent
          ? 'relative overflow-hidden rounded-[1.5rem] border border-volt-400/25 bg-volt-400/[0.07] p-6 sm:p-8'
          : 'relative overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-white/[0.025] p-6 sm:p-8'
      }
    >
      {accent && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgb(195_240_60/0.08),transparent)]" />
      )}
      <div className="flex items-center gap-2.5">
        <CalendarDays className={`size-4 ${accent ? 'text-volt-400' : 'text-fog-500'}`} aria-hidden />
        <span
          className={`text-[11px] font-bold uppercase tracking-[0.2em] ${accent ? 'text-volt-400' : 'text-fog-500'}`}
        >
          {label}
        </span>
      </div>
      <p className="relative mt-4 font-heading text-[2rem] uppercase leading-none text-fog-50 sm:text-[2.5rem]">
        {date}
      </p>
      <p className="mt-2 text-sm text-fog-400">{fullDate}</p>
    </div>
  )
}

export function RegistrationDates() {
  const status = registrationStatus(REGISTRATION_WINDOW.opensDate, REGISTRATION_WINDOW.closesDate)

  return (
    <section className="container-page section-y" aria-labelledby="reg-dates-title">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/[0.07] bg-linear-to-br from-ink-800 to-ink-900 shadow-card">
          {/* Background accents */}
          <div className="pointer-events-none absolute -left-24 top-0 -z-10 size-[32rem] rounded-full bg-[radial-gradient(closest-side,rgb(195_240_60/0.06),transparent)]" />
          <div className="pointer-events-none absolute -bottom-20 right-0 -z-10 size-[24rem] rounded-full bg-[radial-gradient(closest-side,rgb(195_240_60/0.04),transparent)]" />

          <div className="p-8 sm:p-12">
            {/* Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Eyebrow>Registrations</Eyebrow>
                <h2
                  id="reg-dates-title"
                  className="mt-4 font-heading text-[1.75rem] uppercase leading-[0.95] text-fog-50 sm:text-[2.25rem]"
                >
                  Registration Window
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-fog-400">
                  Secure your squad's spot before the deadline. Only registered teams may compete.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end">
                {/* Status pill */}
                {status === 'open' && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-volt-400/30 bg-volt-400/[0.08] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-volt-300">
                    <span className="size-1.5 animate-pulse rounded-full bg-volt-400" aria-hidden />
                    Registrations Open
                  </span>
                )}
                {status === 'before' && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-fog-400">
                    <Clock className="size-3.5" aria-hidden />
                    Opens Soon
                  </span>
                )}
                {status === 'after' && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-danger-500/25 bg-danger-500/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-danger-400">
                    Registrations Closed
                  </span>
                )}
                <RegistrationFee />
              </div>
            </div>

            {/* Date cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr]">
              <DateCard
                label="Registration Opens"
                date="1 December 2026"
                fullDate={opensFormatted}
                accent={status === 'open'}
              />

              {/* Connector */}
              <div className="hidden items-center justify-center lg:flex">
                <div className="flex h-px w-12 items-center">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
                <span className="mx-3 text-xs font-semibold text-fog-600">TO</span>
                <div className="h-px w-12">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              </div>

              <DateCard
                label="Last Date to Register"
                date="25 December 2026"
                fullDate={closesFormatted}
                accent={false}
              />
            </div>

            {/* Timeline bar */}
            <div className="mt-8 flex items-center gap-3">
              <span className="text-xs font-semibold tabular-nums text-fog-500">1 Dec</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                {status === 'open' && (
                  <div className="absolute inset-y-0 left-0 w-[var(--progress)] rounded-full bg-volt-400 shadow-glow-sm" style={{ '--progress': `${getProgress()}%` } as React.CSSProperties} />
                )}
                {status === 'after' && (
                  <div className="absolute inset-0 rounded-full bg-fog-600/40" />
                )}
              </div>
              <span className="text-xs font-semibold tabular-nums text-fog-500">25 Dec</span>
            </div>

            {/* CTA */}
            {status === 'open' && (
              <div className="mt-8">
                <ButtonLink to={ROUTES.register} size="lg">
                  Register Your Team <ArrowRight className={arrowNudge} />
                </ButtonLink>
              </div>
            )}
            {status === 'before' && (
              <div className="mt-8">
                <span className="inline-flex h-13 cursor-not-allowed items-center gap-2 rounded-full bg-white/[0.04] px-7 text-[15px] font-semibold text-fog-400 opacity-60 ring-1 ring-white/10">
                  Registrations Open 1 December
                </span>
              </div>
            )}

            {status === 'after' && (
              <div className="mt-8 rounded-control border border-danger-500/20 bg-danger-500/[0.05] px-5 py-4 text-sm text-fog-300">
                <span className="font-semibold text-danger-400">Registrations are now closed.</span>{' '}
                The registration window (1–25 December 2026) has ended. Contact the organisers if you have a query.
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/** Percentage progress through the registration window (0–100). */
function getProgress(): number {
  const start = Date.parse(`${REGISTRATION_WINDOW.opensDate}T00:00:00+05:30`)
  const end = Date.parse(`${REGISTRATION_WINDOW.closesDate}T23:59:59+05:30`)
  const now = Date.now()
  if (now <= start) return 0
  if (now >= end) return 100
  return Math.round(((now - start) / (end - start)) * 100)
}
