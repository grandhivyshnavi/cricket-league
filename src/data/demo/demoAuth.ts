import type { AuthUser } from '@/types/domain'
import { AppError } from '../errors'

/**
 * DEMO MODE ONLY. Active when Supabase credentials are absent so the admin
 * experience can be reviewed locally. All demo data lives in this browser's
 * localStorage, so this sign-in grants no access to any shared data.
 * Production authentication is handled by Supabase Auth + RLS.
 */
export const DEMO_ADMIN_CREDENTIALS = { email: 'admin@sscl.demo', password: 'sscl-demo-2027' } as const

const SESSION_KEY = 'sscl27.demo.session'
const listeners = new Set<(user: AuthUser | null) => void>()

export function getDemoUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function emit() {
  const user = getDemoUser()
  listeners.forEach((l) => l(user))
}

export const demoAuth = {
  async signIn(email: string, password: string) {
    await new Promise((r) => setTimeout(r, 350))
    if (email.trim().toLowerCase() !== DEMO_ADMIN_CREDENTIALS.email || password !== DEMO_ADMIN_CREDENTIALS.password) {
      throw new AppError('Invalid email or password.')
    }
    const user: AuthUser = { id: 'demo-admin', email: DEMO_ADMIN_CREDENTIALS.email, role: 'admin' }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    emit()
  },
  async signOut() {
    localStorage.removeItem(SESSION_KEY)
    emit()
  },
  onChange(cb: (user: AuthUser | null) => void) {
    listeners.add(cb)
    const onStorage = (e: StorageEvent) => e.key === SESSION_KEY && cb(getDemoUser())
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(cb)
      window.removeEventListener('storage', onStorage)
    }
  },
}
