import { Link } from 'react-router-dom'
import { Phone } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { CONTACT_NUMBERS, NAV_ITEMS, ROUTES, TIME_ZONE_LABEL, TOURNAMENT } from '@/config/site'

const TOURNAMENT_LINKS = [
  { label: 'Join Tournament', to: ROUTES.register },
  { label: 'Fixtures', to: ROUTES.schedule },
  { label: 'Leaderboard', to: ROUTES.stats },
  { label: 'Organiser login', to: ROUTES.adminLogin },
]

function FooterColumn({ title, links }: { title: string; links: readonly { label: string; to: string }[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-fog-500">{title}</h3>
      <ul className="mt-5 space-y-3">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-fog-300 transition-colors hover:text-volt-300">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="hairline-top mt-12 border-t border-white/[0.06] bg-ink-950/60">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-12 py-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="col-span-2 max-w-sm md:col-span-1">
          <Logo />
          <p className="mt-5 text-sm leading-relaxed text-fog-400">
            The festive-season cricket championship. Fixtures, standings and registrations — all in one place.
          </p>
        </div>
        <FooterColumn title="Explore" links={NAV_ITEMS} />
        <FooterColumn title="Tournament" links={TOURNAMENT_LINKS} />
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-fog-500">Contact Us</h3>
          <ul className="mt-5 space-y-3">
            {CONTACT_NUMBERS.map((c) => (
              <li key={c.value}>
                <a
                  href={`tel:+91${c.value}`}
                  className="inline-flex items-center gap-2 text-sm text-fog-300 transition-colors hover:text-volt-300"
                >
                  <Phone className="size-3.5 text-volt-400" aria-hidden />
                  <span className="tabular-nums">{c.value}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.05]">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-fog-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {TOURNAMENT.name}. All rights reserved.
          </p>
          <p>All match times are in {TIME_ZONE_LABEL}.</p>
        </div>
      </div>
    </footer>
  )
}
