import { ArrowLeft, KeyRound, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { KiteEmblem } from '@/components/brand/Logo'
import { AmbientBackground } from '@/components/layout/AmbientBackground'
import { Button, ButtonLink } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Spinner } from '@/components/ui/states'
import { ROUTES, TOURNAMENT } from '@/config/site'
import { isDemoMode } from '@/data'
import { DemoModeBanner } from '@/features/admin/AdminLayout'
import { getErrorMessage } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'

export default function AdminSignupPage() {
  const { status, user, signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (status === 'loading') return <Spinner className="min-h-dvh" />
  if (user) return <Navigate to={ROUTES.admin} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setPending(true)
    try {
      await signUp(email, password, fullName)
      toast.success('Account created successfully')
      navigate(ROUTES.admin, { replace: true })
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
            <h1 className="mt-6 font-heading text-3xl uppercase text-fog-50">Management Sign Up</h1>
            <p className="mt-2 text-sm text-fog-400">
              Create your organiser account for {TOURNAMENT.name}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-10 grid gap-5 rounded-panel p-7 glass sm:p-8">
            <Field id="signup-name" label="Full name">
              <Input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </Field>
            <Field id="signup-email" label="Email">
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field id="signup-password" label="Password">
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field id="signup-confirm" label="Confirm password" error={error}>
              <Input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={Boolean(error)}
              />
            </Field>
            <Button type="submit" size="lg" loading={pending} className="mt-2">
              <UserPlus /> Create Account
            </Button>

            {isDemoMode && (
              <div className="rounded-control border border-gold-400/20 bg-gold-400/[0.05] p-4 text-xs leading-relaxed text-fog-300">
                <p className="flex items-center gap-2 font-semibold text-gold-400">
                  <KeyRound className="size-3.5" /> Demo mode
                </p>
                <p className="mt-1.5">
                  New accounts start with <strong className="text-fog-200">user</strong> role. An existing admin must
                  promote you to <strong className="text-fog-200">admin</strong> from the Members tab in the Control Room.
                </p>
              </div>
            )}
          </form>

          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-fog-400">
              Already have an account?{' '}
              <ButtonLink to={ROUTES.adminLogin} variant="ghost" size="sm" className="inline-flex">
                Sign in
              </ButtonLink>
            </p>
            <ButtonLink to={ROUTES.home} variant="ghost" size="sm">
              <ArrowLeft /> Back to site
            </ButtonLink>
          </div>
        </div>
      </main>
    </div>
  )
}
