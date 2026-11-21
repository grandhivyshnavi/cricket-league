import { ArrowRight, CalendarDays } from 'lucide-react'
import { TrophyArt } from '@/components/brand/TrophyArt'
import { Eyebrow } from '@/components/ui/badge'
import { ButtonLink, arrowNudge } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { JOIN_CTA } from '@/config/content'
import { ROUTES } from '@/config/site'

export function JoinCta() {
  return (
    <section className="container-page pb-8 pt-4 lg:pb-12" aria-labelledby="join-title">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-volt-400/15 bg-linear-to-br from-ink-800 via-ink-900 to-ink-950 shadow-card">
          <div className="pointer-events-none absolute -right-40 -top-40 -z-10 size-[42rem] rounded-full bg-[radial-gradient(closest-side,rgb(195_240_60/0.16),transparent)]" />
          <div className="pointer-events-none absolute -bottom-48 left-1/4 -z-10 size-[30rem] rounded-full bg-[radial-gradient(closest-side,rgb(244_201_78/0.07),transparent)]" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(115deg,transparent_55%,rgb(195_240_60/0.04)_55%,rgb(195_240_60/0.04)_62%,transparent_62%)]" />

          <div className="grid items-center gap-6 p-8 sm:p-12 lg:grid-cols-[1.25fr_0.75fr] lg:p-16">
            <div>
              <Eyebrow>{JOIN_CTA.eyebrow}</Eyebrow>
              <h2 id="join-title" className="mt-5 font-heading text-[2.4rem] uppercase leading-[0.95] text-fog-50 sm:text-6xl">
                {JOIN_CTA.titleLead}
                <span className="mt-1 block font-accent text-[1.05em] leading-[1.15] text-volt-400 text-glow">
                  {JOIN_CTA.titleAccent}
                </span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-fog-300">{JOIN_CTA.body}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink to={ROUTES.register} size="lg">
                  Join Now <ArrowRight className={arrowNudge} />
                </ButtonLink>
                <ButtonLink to={ROUTES.schedule} size="lg" variant="secondary">
                  <CalendarDays /> View Schedule
                </ButtonLink>
              </div>
            </div>
            <div className="relative mx-auto w-48 sm:w-60 lg:w-72">
              <div className="absolute inset-x-0 bottom-2 mx-auto h-8 w-3/4 rounded-[50%] bg-volt-400/25 blur-2xl" aria-hidden />
              <div className="animate-float-slow">
                <TrophyArt />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
