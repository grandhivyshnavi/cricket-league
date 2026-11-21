import { ArrowUpRight, FlaskConical, LogOut } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { Logo } from '@/components/brand/Logo'
import { AmbientBackground } from '@/components/layout/AmbientBackground'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { ROUTES } from '@/config/site'
import { isDemoMode } from '@/data'
import { useAuth } from '@/state/AuthProvider'

export function DemoModeBanner() {
  if (!isDemoMode) return null
  return (
    <div className="border-b border-gold-400/15 bg-gold-400/[0.06]">
      <p className="container-page flex items-center gap-2.5 py-2.5 text-xs text-gold-400">
        <FlaskConical className="size-3.5 shrink-0" />
        <span>
          <strong className="font-semibold">Demo mode</strong> — Supabase is not configured. Changes are stored only in
          this browser.
        </span>
      </p>
    </div>
  )
}

export function AdminLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="relative flex min-h-dvh flex-col">
      <AmbientBackground />
      <DemoModeBanner />
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
        <div className="container-page flex h-[68px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo compact />
            <Badge tone="volt">Control Room</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="mr-2 hidden max-w-56 truncate text-xs text-fog-500 md:block">{user?.email}</span>
            <ButtonLink to={ROUTES.home} variant="ghost" size="sm">
              <span className="hidden sm:inline">View site</span> <ArrowUpRight />
            </ButtonLink>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await signOut()
                toast.success('Signed out')
              }}
            >
              <LogOut /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
