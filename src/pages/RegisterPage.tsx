import { CalendarDays, ClipboardList, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { TrophyArt } from '@/components/brand/TrophyArt'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { ROUTES, TOURNAMENT } from '@/config/site'

/**
 * Registration entry point. The form fields and workflow will be supplied by
 * the organisers; when they are, render the form here using
 * `features/registration` (data) and, if fees apply, `features/payments`.
 */
export default function RegisterPage() {
  return (
    <>
      <PageHeader
        eyebrow="Registration"
        title="Join the Tournament"
        description={`Be part of the ${TOURNAMENT.name}. Registration details for teams and players will be published here.`}
      />
      <section className="container-page pb-16">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/[0.07] bg-linear-to-br from-ink-800 to-ink-900 shadow-card">
            <div className="pointer-events-none absolute -right-32 -top-32 -z-10 size-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(195_240_60/0.12),transparent)]" />
            <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[1.3fr_0.7fr] lg:p-14">
              <div>
                <Badge tone="volt">
                  <span className="size-1.5 animate-pulse rounded-full bg-volt-400" /> Opening soon
                </Badge>
                <h2 className="mt-6 font-heading text-3xl uppercase leading-tight text-fog-50 sm:text-4xl">
                  Registration is being prepared
                </h2>
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-fog-400">
                  The organisers will announce the registration form, eligibility details and any applicable fees on
                  this page. Meanwhile, explore the teams and fixtures for the season.
                </p>
                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  <li className="flex items-center gap-3 rounded-control border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-sm text-fog-300">
                    <ClipboardList className="size-4 shrink-0 text-volt-400" aria-hidden />
                    Registration form — coming soon
                  </li>
                  <li className="flex items-center gap-3 rounded-control border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-sm text-fog-300">
                    <CalendarDays className="size-4 shrink-0 text-volt-400" aria-hidden />
                    Key dates — to be announced
                  </li>
                </ul>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink to={ROUTES.schedule} size="lg">
                    <CalendarDays /> View Schedule
                  </ButtonLink>
                  <ButtonLink to={ROUTES.teams} size="lg" variant="secondary">
                    <Users /> Explore Teams
                  </ButtonLink>
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
        </Reveal>
      </section>
    </>
  )
}
