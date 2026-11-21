import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, LayoutDashboard, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { ButtonLink, arrowNudge } from '@/components/ui/button'
import { NAV_ITEMS, ROUTES } from '@/config/site'
import { cn } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

export function Navbar() {
  const scrolled = useScrolled()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { isAdmin } = useAuth()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500',
        scrolled || open
          ? 'border-b border-white/[0.06] bg-ink-950/75 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container-page flex h-[72px] items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.025] p-1 backdrop-blur-md">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === ROUTES.home}
                  className={({ isActive }) =>
                    cn(
                      'relative flex h-9 items-center rounded-full px-4 text-[13px] font-semibold transition-colors duration-300',
                      isActive ? 'text-fog-50' : 'text-fog-400 hover:text-fog-50',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-full border border-volt-400/25 bg-volt-400/[0.09] shadow-[0_0_24px_-6px_rgb(195_240_60/0.5)]"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <ButtonLink to={ROUTES.admin} variant="ghost" size="sm" className="hidden sm:inline-flex">
              <LayoutDashboard /> Admin
            </ButtonLink>
          )}
          <ButtonLink to={ROUTES.register} size="sm" className="hidden sm:inline-flex">
            Join Tournament <ArrowRight className={arrowNudge} />
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-fog-50 transition-colors hover:border-volt-400/40 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto border-t border-white/[0.06] bg-ink-950/95 backdrop-blur-xl lg:hidden"
          >
            <nav aria-label="Mobile" className="container-page flex min-h-full flex-col py-6">
              <ul className="flex flex-col">
                {NAV_ITEMS.map((item, i) => (
                  <motion.li
                    key={item.to}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.3 }}
                  >
                    <NavLink
                      to={item.to}
                      end={item.to === ROUTES.home}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between border-b border-white/[0.05] py-4 font-heading text-2xl uppercase transition-colors',
                          isActive ? 'text-volt-400' : 'text-fog-200 hover:text-fog-50',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {item.label}
                          {isActive && <span className="size-2 rounded-full bg-volt-400 shadow-glow-sm" />}
                        </>
                      )}
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-3 pt-10">
                {isAdmin && (
                  <ButtonLink to={ROUTES.admin} variant="secondary" size="lg">
                    <LayoutDashboard /> Admin panel
                  </ButtonLink>
                )}
                <ButtonLink to={ROUTES.register} size="lg">
                  Join Tournament <ArrowRight />
                </ButtonLink>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
