import { CalendarDays, MapPin, Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Reveal } from '@/components/ui/reveal'
import { CONTACT_NUMBERS, TOURNAMENT } from '@/config/site'
import { JoinCta } from '@/features/home/JoinCta'
import { TournamentInfo } from '@/features/home/TournamentInfo'
import { formatDateRange } from '@/lib/datetime'
import { useTournament } from '@/state/TournamentProvider'

function FactCard({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: ReactNode }) {
  return (
    <div className="h-full rounded-card p-6 surface sm:p-7">
      <span className="grid size-11 place-items-center rounded-xl border border-volt-400/20 bg-volt-400/10 text-volt-400">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-fog-500">{label}</p>
      <div className="mt-2 text-fog-100">{children}</div>
    </div>
  )
}

export default function AboutPage() {
  const { settings, matches, status } = useTournament()
  const range = formatDateRange(settings.startDate, settings.endDate)
  const venues = [...new Set(matches.map((m) => m.venue))].sort()

  return (
    <>
      <PageHeader
        eyebrow="About"
        title={
          <>
            About the <span className="text-volt-400">League</span>
          </>
        }
        description={
          status === 'loading'
            ? undefined
            : settings.description || `${TOURNAMENT.name} — the festive-season cricket championship.`
        }
      />
      <section className="container-page grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Reveal className="h-full">
          <FactCard icon={CalendarDays} label="Season dates">
            <p className="font-heading text-2xl uppercase">{range ?? 'To be announced'}</p>
          </FactCard>
        </Reveal>
        <Reveal delay={0.08} className="h-full">
          <FactCard icon={MapPin} label="Host venues">
            {venues.length ? (
              <ul className="space-y-1.5 text-sm text-fog-300">
                {venues.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            ) : (
              <p className="font-heading text-2xl uppercase">To be announced</p>
            )}
          </FactCard>
        </Reveal>
        <Reveal delay={0.16} className="h-full">
          <FactCard icon={Phone} label="Contact us">
            <ul className="space-y-2">
              {CONTACT_NUMBERS.map((c) => (
                <li key={c.value}>
                  <a
                    href={`tel:+91${c.value}`}
                    className="inline-flex items-center gap-2 font-heading text-2xl uppercase text-fog-100 transition-colors hover:text-volt-300"
                  >
                    <span className="tabular-nums">{c.value}</span>
                  </a>
                </li>
              ))}
            </ul>
          </FactCard>
        </Reveal>
      </section>
      <TournamentInfo />
      <JoinCta />
    </>
  )
}
