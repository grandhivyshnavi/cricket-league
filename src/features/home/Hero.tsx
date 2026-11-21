import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, MapPin, Users } from 'lucide-react'
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
    <section className="relative" aria-labelledby="hero-title">
      <div className="container-page grid items-center gap-6 pb-10 pt-8 sm:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4 lg:pb-10 lg:pt-10">
        <div className="relative z-10">
          <motion.div {...rise(0)}>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-1.5 pl-2 pr-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-fog-300 backdrop-blur-md">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-volt-400/70" />
                <span className="relative size-2 rounded-full bg-volt-400" />
              </span>
              {loading ? <span className="skeleton h-3 w-40 rounded" /> : settings.tagline || `Season ${TOURNAMENT.year}`}
            </span>
          </motion.div>

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

          <motion.div {...rise(0.12)} className="mt-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-volt-400/30 bg-volt-400/[0.11] px-4 py-2 text-base font-bold text-volt-300 shadow-[0_0_28px_-8px_rgba(195_240_60/0.45)]">
              <MapPin className="size-4" aria-hidden />
              {TOURNAMENT.district}
            </span>
          </motion.div>

          <motion.div {...rise(0.18)} className="mt-5 max-w-lg">
            {loading ? (
              <div className="space-y-2.5">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-4/5 rounded" />
              </div>
            ) : (
              <p className="text-base leading-relaxed text-fog-300 sm:text-[17px]">
                {settings.description ||
                  'The festive-season cricket showdown. Top local sides, floodlit fixtures and a championship trophy — experience every six, wicket and victory this Sankranthi.'}
              </p>
            )}
          </motion.div>

          <motion.div {...rise(0.26)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={ROUTES.register} size="lg">
              Join Tournament <ArrowRight className={arrowNudge} />
            </ButtonLink>
            <ButtonLink to={ROUTES.teams} size="lg" variant="secondary">
              <Users /> Explore Teams
            </ButtonLink>
          </motion.div>

          {range && (
            <motion.p {...rise(0.34)} className="mt-6 inline-flex items-center gap-2.5 text-sm font-medium text-fog-400">
              <CalendarDays className="size-4 text-volt-400" aria-hidden />
              {range}
            </motion.p>
          )}
        </div>

        <motion.div
          className="relative mx-auto w-full max-w-[34rem] lg:mr-[-2rem] lg:max-w-none"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.1, ease }}
        >
          <HeroArt prizePool={settings.prizePool} />
        </motion.div>
      </div>

    </section>
  )
}
