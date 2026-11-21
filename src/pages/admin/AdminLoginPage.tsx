import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { KiteEmblem } from '@/components/brand/Logo'
import { AmbientBackground } from '@/components/layout/AmbientBackground'
import { Button, ButtonLink } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Spinner } from '@/components/ui/states'
import { ROUTES, TOURNAMENT } from '@/config/site'
import { authService, isDemoMode } from '@/data'
import { DEMO_ADMIN_CREDENTIALS } from '@/data/demo/demoAuth'
import { DemoModeBanner } from '@/features/admin/AdminLayout'
import { getErrorMessage, isValidEmail } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'

export default function AdminLoginPage() {
  const { status, isAdmin, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.admin
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (status === 'loading') return <Spinner className="min-h-dvh" />
  if (isAdmin) return <Navigate to={from} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.')
      return
    }
    if (!password) {
      setError('Enter your password.')
      return
    }
    setError(null)
    setPending(true)
    try {
      await signIn(email, password)
      // Re-read the resolved user (with role) directly from the auth service
      // to avoid racing the AuthProvider's async state update.
      const current = await authService.getCurrentUser()
      if (current?.role === 'admin') {
        toast.success('Welcome back')
        navigate(from, { replace: true })
      } else {
        setError('This account does not have admin access.')
        toast.error('Admin access required')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <AmbientBackground />
      <DemoModeBanner />
      <main id="main" className="container-page flex flex-1 flex-col items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-16 place-items-center rounded-2xl border border-volt-400/25 bg-ink-800 shadow-glow-sm">
              <KiteEmblem className="size-9" />
            </span>
            <h1 className="mt-6 font-heading text-3xl uppercase text-fog-50">Organiser sign in</h1>
            <p className="mt-2 text-sm text-fog-400">{TOURNAMENT.name}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-10 grid gap-5 rounded-panel p-7 glass sm:p-8">
            <Field id="login-email" label="Email">
              <Input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field id="login-password" label="Password" error={error}>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(error)}
              />
            </Field>
            <Button type="submit" size="lg" loading={pending} className="mt-2">
              <ShieldCheck /> Sign in
            </Button>
            {isDemoMode && (
              <div className="rounded-control border border-gold-400/20 bg-gold-400/[0.05] p-4 text-xs leading-relaxed text-fog-300">
                <p className="flex items-center gap-2 font-semibold text-gold-400">
                  <KeyRound className="size-3.5" /> Demo credentials
                </p>
                <p className="mt-1.5">
                  {DEMO_ADMIN_CREDENTIALS.email} / {DEMO_ADMIN_CREDENTIALS.password}
                </p>
                <button
                  type="button"
                  className="mt-2 font-semibold text-volt-300 underline-offset-4 hover:underline"
                  onClick={() => {
                    setEmail(DEMO_ADMIN_CREDENTIALS.email)
                    setPassword(DEMO_ADMIN_CREDENTIALS.password)
                  }}
                >
                  Fill demo credentials
                </button>
              </div>
            )}
          </form>

          <div className="mt-8 flex justify-center">
            <ButtonLink to={ROUTES.home} variant="ghost" size="sm">
              <ArrowLeft /> Back to site
            </ButtonLink>
          </div>
        </div>
      </main>
    </div>
  )
}
