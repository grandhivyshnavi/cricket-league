import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '@/data'
import type { AuthUser } from '@/types/domain'

interface AuthContextValue {
  status: 'loading' | 'ready'
  user: AuthUser | null
  isAdmin: boolean
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    let active = true
    authService
      .getCurrentUser()
      .catch(() => null)
      .then((u) => {
        if (!active) return
        setUser(u)
        setStatus('ready')
      })
    const unsubscribe = authService.onChange((u) => {
      if (!active) return
      setUser(u)
      setStatus('ready')
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signIn = useCallback((email: string, password: string) => authService.signIn(email, password), [])
  const signOut = useCallback(() => authService.signOut(), [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, isAdmin: user?.role === 'admin', signIn, signOut }),
    [status, user, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
