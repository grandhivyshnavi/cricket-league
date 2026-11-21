import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Users } from 'lucide-react'
import { HeroArt } from '@/components/brand/HeroArt'
import { ButtonLink, arrowNudge } from '@/components/ui/button'
import { ROUTES, TOURNAMENT } from '@/config/site'
import { formatDateRange } from '@/lib/datetime'
import { useTournament } from '@/state/TournamentProvider'
import { StatsPanel } from './StatsPanel'

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
            className="mt-6 font-poster text-[clamp(3rem,15vw,5rem)] uppercase leading-[0.86] text-fog-50 sm:text-[6rem] lg:text-[clamp(4.75rem,6.5vw,6.5rem)]"
          >
            <span className="block">Sankranthi</span>
            <span className="block">Special</span>
            <span className="block">Cricket</span>
            <span className="flex items-baseline gap-[0.18em]">
              League
              <span className="font-accent -rotate-6 text-[0.86em] leading-none text-volt-400 text-glow">
                {TOURNAMENT.year}
              </span>
            </span>
          </motion.h1>

          <motion.div {...rise(0.16)} className="mt-6 max-w-lg">
            {loading ? (
              <div className="space-y-2.5">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-4/5 rounded" />
              </div>
            ) : (
              <p className="text-base leading-relaxed text-fog-300 sm:text-[17px]">
                {settings.description ||
                  'The festive-season cricket showdown. Join top teams, battle for glory and experience every six, wicket and victory.'}
              </p>
            )}
          </motion.div>

          <motion.div {...rise(0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={ROUTES.register} size="lg">
              Join Tournament <ArrowRight className={arrowNudge} />
            </ButtonLink>
            <ButtonLink to={ROUTES.teams} size="lg" variant="secondary">
              <Users /> Explore Teams
            </ButtonLink>
          </motion.div>

          {range && (
            <motion.p {...rise(0.32)} className="mt-6 inline-flex items-center gap-2.5 text-sm font-medium text-fog-400">
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
          <HeroArt />
        </motion.div>
      </div>

      <div className="container-page">
        <motion.div {...rise(0.4)}>
          <StatsPanel />
        </motion.div>
      </div>
    </section>
  )
}
