import { ArrowLeft, Lock, LogOut } from 'lucide-react'
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
          You're signed in as {user.email}, which doesn't have administrator permissions.
        </p>
        <div className="mt-8 flex gap-3">
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
