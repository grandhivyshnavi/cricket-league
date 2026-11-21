import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { AppRole, AuthUser } from '@/types/domain'
import { supabase } from '@/lib/supabase'
import { AppError } from './errors'
import { demoAuth, getDemoUser } from './demo/demoAuth'

export interface AuthService {
  getCurrentUser(): Promise<AuthUser | null>
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string, fullName: string): Promise<void>
  signOut(): Promise<void>
  onChange(cb: (user: AuthUser | null) => void): () => void
}

/**
 * The role is always read from the `profiles` table, which users cannot
 * modify themselves (enforced by RLS + trigger). Client-side role checks only
 * decide what UI to render; the database decides what is actually allowed.
 */
function createSupabaseAuth(client: SupabaseClient): AuthService {
  async function resolve(user: User): Promise<AuthUser> {
    const { data, error } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (error) {
      console.error('[SSCL] profiles query error:', error.message, error.code, error.details)
    }
    if (!data) {
      console.warn('[SSCL] No profile row found for user', user.id, '— defaulting to "user" role')
    } else {
      console.log('[SSCL] Profile resolved:', { id: user.id, role: data.role })
    }
    const role: AppRole = data?.role === 'admin' ? 'admin' : 'user'
    return { id: user.id, email: user.email ?? '', role }
  }

  return {
    async getCurrentUser() {
      const { data } = await client.auth.getSession()
      return data.session ? resolve(data.session.user) : null
    },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw new AppError(error.status === 400 ? 'Invalid email or password.' : error.message)
    },
    async signUp(email, password, fullName) {
      const { error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      })
      if (error) throw new AppError(error.message)
    },
    async signOut() {
      await client.auth.signOut()
    },
    onChange(cb) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        // Defer: querying Supabase inside this callback can deadlock the auth lock.
        setTimeout(async () => cb(session ? await resolve(session.user) : null), 0)
      })
      return () => data.subscription.unsubscribe()
    },
  }
}

const demoAuthService: AuthService = {
  getCurrentUser: async () => getDemoUser(),
  signIn: demoAuth.signIn,
  signUp: demoAuth.signUp,
  signOut: demoAuth.signOut,
  onChange: demoAuth.onChange,
}

export const authService: AuthService = supabase ? createSupabaseAuth(supabase) : demoAuthService
