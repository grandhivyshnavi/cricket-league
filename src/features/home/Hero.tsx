import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, MapPin, Trophy, Users } from 'lucide-react'
import { HeroArt } from '@/components/brand/HeroArt'
import { ButtonLink, arrowNudge } from '@/components/ui/button'
import { ROUTES, TOURNAMENT } from '@/config/site'
import { formatDateRange } from '@/lib/datetime'
import { useTournament } from '@/state/TournamentProvider'

const ease = [0.16, 1, 0.3, 1] as const
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease },
})

export function Hero() {
  const { settings, status } = useTournament()
  const range = formatDateRange(settings.startDate, settings.endDate)
  const loading = status === 'loading'

  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      {/* ── Atmospheric background ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* Base dark-green radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_65%_50%,#0d1f08_0%,transparent_70%)]" />
        {/* Floodlight cone — top-right */}
        <div className="absolute -right-20 -top-20 h-[600px] w-[400px] rotate-12 bg-[radial-gradient(ellipse_at_top,#c3f03c08_0%,transparent_70%)]" />
        {/* Subtle green ground glow */}
        <div className="absolute bottom-0 left-1/2 h-48 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,#1a3a0815_0%,transparent_70%)]" />
        {/* Floating particles */}
        <div className="absolute left-[15%] top-[20%] size-1 rounded-full bg-volt-300/40 animate-twinkle" />
        <div className="absolute left-[72%] top-[35%] size-1.5 rounded-full bg-volt-300/30 animate-twinkle [animation-delay:1.4s]" />
        <div className="absolute left-[45%] top-[75%] size-1 rounded-full bg-volt-300/25 animate-twinkle [animation-delay:2.2s]" />
        <div className="absolute left-[85%] top-[60%] size-1 rounded-full bg-volt-300/20 animate-twinkle [animation-delay:0.8s]" />
        <div className="absolute left-[8%] top-[65%] size-1.5 rounded-full bg-volt-300/30 animate-twinkle [animation-delay:1.8s]" />
      </div>

      <div className="container-page relative z-10 grid items-center gap-6 pb-12 pt-8 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-4 lg:pb-16 lg:pt-12">
        {/* ── Left: content ── */}
        <div className="relative z-10">
          {/* Tournament badge */}
          <motion.div {...rise(0)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-volt-400/25 bg-volt-400/[0.08] py-1.5 pl-2.5 pr-4 text-[11px] font-bold uppercase tracking-[0.2em] text-volt-300 backdrop-blur-md shadow-[0_0_20px_-6px_rgba(195_240_60/0.3)]">
              <Trophy className="size-3.5 text-volt-400" aria-hidden />
              Cricket League {TOURNAMENT.year}
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            id="hero-title"
            {...rise(0.08)}
            className="mt-6 font-poster text-[clamp(2.4rem,12vw,3.8rem)] uppercase leading-[0.9] text-fog-50 sm:text-[4.5rem] lg:text-[clamp(3.6rem,5vw,5rem)]"
          >
            <span className="block">Sankranthi</span>
            <span className="block">Super Cricket</span>
            <span className="flex items-baseline gap-[0.18em]">
              League
              <span className="font-accent -rotate-6 text-[0.86em] leading-none text-volt-400 text-glow">
                {TOURNAMENT.year}
              </span>
            </span>
          </motion.h1>

          {/* Location & date pill */}
          <motion.div {...rise(0.14)} className="mt-7 flex w-fit items-center overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md">
            <span className="flex items-center gap-2.5 px-5 py-3 text-base font-semibold text-fog-200">
              <MapPin className="size-4 text-volt-400" aria-hidden />
              {TOURNAMENT.district}
            </span>
            <span className="h-6 w-px bg-white/10" aria-hidden />
            <span className="flex items-center gap-2.5 px-5 py-3 text-base font-semibold text-fog-200">
              <CalendarDays className="size-4 text-volt-400" aria-hidden />
              {loading ? <span className="skeleton inline-block h-4 w-28 rounded" /> : range}
            </span>
          </motion.div>

          {/* CTA buttons */}
          <motion.div {...rise(0.22)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={ROUTES.register} size="lg">
              Join Tournament <ArrowRight className={arrowNudge} />
            </ButtonLink>
            <ButtonLink to={ROUTES.teams} size="lg" variant="secondary">
              <Users /> Explore Teams
            </ButtonLink>
          </motion.div>
        </div>

        {/* ── Right: SVG cricket illustration + prize card ── */}
        <div className="relative mx-auto flex w-full max-w-[34rem] flex-col items-center lg:mr-[-2rem] lg:max-w-none">
          <motion.div
            className="relative w-full"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.1, ease }}
          >
            <HeroArt />
          </motion.div>

          {/* Prize pool banner */}
          <motion.div {...rise(0.3)} className="-mt-4 lg:-mt-8">
            <div
              className="inline-flex items-center gap-4 rounded-[22px] border border-[#c5ff32]/50 bg-[#060a04]/[0.94] px-5 py-3 sm:gap-5 sm:rounded-[26px] sm:px-7 sm:py-4"
              style={{
                boxShadow: '0 0 15px -2px rgba(197,255,50,0.35), 0 0 40px -6px rgba(197,255,50,0.12)',
              }}
            >
              {/* Trophy */}
              <svg
                viewBox="0 0 44 44"
                className="size-[42px] shrink-0 sm:size-[48px]"
                fill="none"
                aria-hidden
                style={{ filter: 'drop-shadow(0 0 8px rgba(197,255,50,0.5))' }}
              >
                <path d="M13 7h18v3.5c0 6.8-3.8 12.2-9 14-5.2-1.8-9-7.2-9-14V7z" fill="#c5ff32" />
                <path d="M13 10.5H7.5c0 4.5 2.2 8.2 5.5 9.2V18c-2-1.3-3.2-3.8-3.4-7.5H13z" fill="#c5ff32" fillOpacity="0.6" />
                <path d="M31 10.5h5.5c0 4.5-2.2 8.2-5.5 9.2V18c2-1.3 3.2-3.8 3.4-7.5H31z" fill="#c5ff32" fillOpacity="0.6" />
                <rect x="19" y="24.5" width="6" height="5" rx="1" fill="#c5ff32" fillOpacity="0.65" />
                <rect x="15.5" y="29.5" width="13" height="3.5" rx="1.75" fill="#c5ff32" fillOpacity="0.75" />
              </svg>

              {/* Text */}
              <div className="flex flex-col">
                <span
                  className="text-[15px] font-bold italic leading-tight text-white sm:text-[19px]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Prize Pool
                </span>
                <span
                  className="text-[2.6rem] font-black uppercase italic leading-[0.88] tracking-tight sm:text-[3.6rem]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStretch: '82%',
                    color: '#c5ff32',
                    textShadow: '0 0 18px rgba(197,255,50,0.6), 0 0 40px rgba(197,255,50,0.25)',
                  }}
                >
                  {loading ? (
                    <span className="skeleton inline-block h-11 w-40 rounded sm:h-14 sm:w-52" />
                  ) : (
                    <>₹1 LAKH</>
                  )}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
