import { CalendarDays, CircleCheck, ClipboardList, House, Plus } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { TrophyArt } from '@/components/brand/TrophyArt'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { REGISTRATION_WINDOW, ROUTES, TOURNAMENT } from '@/config/site'
import { isRegistrationAvailable } from '@/data/registrations'
import { registrationStatus } from '@/lib/datetime'
import { REGISTRATION_SECTIONS, RegistrationForm } from '@/features/registration/RegistrationForm'
import { PLAYER_COUNT } from '@/features/registration/validation'

interface Submitted {
  id: string
  teamName: string
  email: string
}

function SuccessPanel({ result, onAnother }: { result: Submitted; onAnother(): void }) {
  return (
    <div role="status" className="relative isolate overflow-hidden rounded-[2rem] border border-volt-400/20 bg-linear-to-br from-ink-800 to-ink-900 shadow-card">
      <div className="pointer-events-none absolute -right-32 -top-32 -z-10 size-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(195_240_60/0.14),transparent)]" />
      <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[1.3fr_0.7fr] lg:p-14">
        <div>
          <Badge tone="volt">
            <CircleCheck className="size-3" /> Registration received
          </Badge>
          <h2 className="mt-6 font-heading text-3xl uppercase leading-tight text-fog-50 sm:text-4xl">
            {result.teamName} is in the queue
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-fog-400">
            Your team registration has been saved. The organisers will review the registration and
            contact you at <span className="font-semibold text-fog-200">{result.email}</span>.
          </p>
          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-control border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-fog-500">Reference</dt>
              <dd className="mt-1 font-heading text-lg tabular-nums text-volt-300">{result.id.slice(0, 8).toUpperCase()}</dd>
            </div>
            <div className="rounded-control border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-fog-500">Status</dt>
              <dd className="mt-1 font-heading text-lg text-fog-50">Pending review</dd>
            </div>
          </dl>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={ROUTES.home} size="lg">
              <House /> Back to home
            </ButtonLink>
            <Button size="lg" variant="secondary" onClick={onAnother}>
              <Plus /> Register another team
            </Button>
          </div>
        </div>
        <div className="relative mx-auto w-44 sm:w-56">
          <div className="absolute inset-x-0 bottom-2 mx-auto h-8 w-3/4 rounded-[50%] bg-volt-400/25 blur-2xl" aria-hidden />
          <div className="animate-float-slow">
            <TrophyArt />
          </div>
        </div>
      </div>
    </div>
  )
}

function UnavailablePanel() {
  return (
    <div className="rounded-[2rem] border border-white/[0.07] bg-linear-to-br from-ink-800 to-ink-900 p-8 shadow-card sm:p-12">
      <Badge tone="gold">Unavailable in demo mode</Badge>
      <h2 className="mt-6 font-heading text-3xl uppercase leading-tight text-fog-50">Online registration is offline</h2>
      <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-fog-400">
        Registrations are saved to the tournament database, which is not connected in this environment.
      </p>
      <ButtonLink to={ROUTES.schedule} size="lg" variant="secondary" className="mt-8">
        <CalendarDays /> View Schedule
      </ButtonLink>
    </div>
  )
}

function TesterBanner() {
  return (
    <div className="mb-6 rounded-control border border-gold-400/30 bg-gold-400/[0.08] px-4 py-3 text-sm text-fog-200">
      <span className="font-bold text-gold-400">Tester mode:</span> the registration window is currently closed, but it is being
      bypassed locally so the form can be tested. The live Supabase backend will still enforce the window unless its
      tournament_settings dates are also adjusted.
    </div>
  )
}

function RegistrationClosedPanel({ status }: { status: 'before' | 'after' }) {
  return (
    <div className="rounded-[2rem] border border-white/[0.07] bg-linear-to-br from-ink-800 to-ink-900 p-8 shadow-card sm:p-12">
      {status === 'before' ? (
        <>
          <Badge tone="neutral">Not yet open</Badge>
          <h2 className="mt-6 font-heading text-3xl uppercase leading-tight text-fog-50">
            Registrations open on 1 December 2026
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-fog-400">
            The registration window runs from <span className="font-semibold text-fog-200">1 December 2026</span> to{' '}
            <span className="font-semibold text-fog-200">25 December 2026</span>. Come back then to register your team.
          </p>
        </>
      ) : (
        <>
          <Badge tone="neutral" className="border-danger-500/25 bg-danger-500/[0.06] text-danger-400">Registrations closed</Badge>
          <h2 className="mt-6 font-heading text-3xl uppercase leading-tight text-fog-50">
            Registration period has ended
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-fog-400">
            The registration window (1–25 December 2026) has ended. If you have a query, please contact the organisers
            directly.
          </p>
        </>
      )}
      <ButtonLink to={ROUTES.home} size="lg" variant="secondary" className="mt-8">
        <House /> Back to Home
      </ButtonLink>
    </div>
  )
}

function SectionGuide() {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-28 rounded-panel p-6 glass">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-fog-500">
          <ClipboardList className="size-3.5 text-volt-400" aria-hidden /> Sections
        </p>
        <nav aria-label="Registration form sections" className="mt-4">
          <ol className="grid gap-1">
            {REGISTRATION_SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-3 rounded-control px-3 py-2 text-sm text-fog-300 transition-colors hover:bg-white/[0.04] hover:text-fog-50"
                >
                  <span className="font-heading text-xs tabular-nums text-volt-400">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="mt-6 border-t border-white/[0.06] pt-5 text-xs leading-relaxed text-fog-400">
          <p className="font-semibold text-fog-200">Keep handy</p>
          <ul className="mt-2 grid list-disc gap-1 pl-4 marker:text-volt-400">
            <li>Names and mobile numbers of your players (up to {PLAYER_COUNT})</li>
            <li>Team email and contact number</li>
            <li>Team address with PIN code</li>
            <li>A team photo (optional, max 5 MB)</li>
          </ul>
        </div>
      </div>
    </aside>
  )
}

const bypassWindow = import.meta.env.VITE_BYPASS_REGISTRATION_WINDOW === 'true'

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState<Submitted | null>(null)
  const [formKey, setFormKey] = useState(0)
  const regStatus = registrationStatus(REGISTRATION_WINDOW.opensDate, REGISTRATION_WINDOW.closesDate)
  const showForm = isRegistrationAvailable && (regStatus === 'open' || bypassWindow)

  return (
    <>
      <PageHeader
        eyebrow="Registration"
        title="Join the Tournament"
        description={`Register your team for the ${TOURNAMENT.name}. It takes a few minutes — have your squad's details ready.`}
      />
      <section className="container-page pb-16">
        {!isRegistrationAvailable ? (
          <UnavailablePanel />
        ) : !showForm && !submitted ? (
          <RegistrationClosedPanel status={regStatus === 'open' ? 'before' : regStatus} />
        ) : submitted ? (
          <Reveal>
            <SuccessPanel
              result={submitted}
              onAnother={() => {
                setSubmitted(null)
                setFormKey((k) => k + 1)
              }}
            />
          </Reveal>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div>
              {bypassWindow && regStatus !== 'open' && <TesterBanner />}
              <RegistrationForm
                key={formKey}
                onSuccess={(result) => {
                  setSubmitted(result)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </div>
            <SectionGuide />
          </div>
        )}
      </section>
    </>
  )
}
