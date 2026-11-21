import { ArrowLeft, Lock, LogOut, Mail } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/button'
import { Spinner } from '@/components/ui/states'
import { ROUTES } from '@/config/site'
import { useAuth } from '@/state/AuthProvider'

/**
 * UX guard only. Every write is independently authorised by the database
 * (Supabase RLS), so bypassing this component grants no extra capability.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, user, isAdmin, signOut } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <Spinner label="Checking access" className="min-h-[60vh]" />
  if (!user) return <Navigate to={ROUTES.adminLogin} replace state={{ from: location.pathname + location.search }} />
  if (!isAdmin) {
    return (
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-danger-500/25 bg-danger-500/10 text-danger-400">
          <Lock className="size-6" />
        </span>
        <h1 className="mt-6 font-heading text-2xl uppercase text-fog-50">Admin access required</h1>
        <p className="mt-2 max-w-sm text-sm text-fog-400">
          You're signed in as {user.email}, but this account has the <strong className="text-fog-200">user</strong> role,
          not <strong className="text-fog-200">admin</strong>.
        </p>
        <div className="mt-5 max-w-md space-y-2 rounded-control border border-volt-400/15 bg-volt-400/[0.06] p-4 text-left text-sm text-fog-200">
          <p className="flex items-start gap-2.5">
            <Mail className="mt-0.5 size-4 shrink-0 text-volt-400" />
            <span>Only pre-configured management accounts have admin access. Contact the tournament organiser or sign in with the correct admin credentials.</span>
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to={ROUTES.home} variant="secondary">
            <ArrowLeft /> Back to site
          </ButtonLink>
          <Button variant="ghost" onClick={() => void signOut()}>
            <LogOut /> Sign out
          </Button>
        </div>
      </div>
    )
  }
  return children
}
