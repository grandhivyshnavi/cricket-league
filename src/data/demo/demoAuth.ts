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
const MEMBERS_KEY = 'sscl27.demo.members'
const listeners = new Set<(user: AuthUser | null) => void>()

export interface DemoMember {
  id: string
  email: string
  fullName: string
  password: string
  role: 'admin' | 'user'
  createdAt: string
}

function getMembers(): DemoMember[] {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY)
    return raw ? (JSON.parse(raw) as DemoMember[]) : []
  } catch {
    return []
  }
}

function saveMembers(members: DemoMember[]) {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members))
}

export function getDemoMembers(): DemoMember[] {
  return getMembers()
}

export function promoteDemoMember(id: string) {
  const members = getMembers()
  const m = members.find((x) => x.id === id)
  if (m) {
    m.role = 'admin'
    saveMembers(members)
  }
}

export function demoteDemoMember(id: string) {
  const members = getMembers()
  const m = members.find((x) => x.id === id)
  if (m) {
    m.role = 'user'
    saveMembers(members)
  }
}

export function removeDemoMember(id: string) {
  saveMembers(getMembers().filter((m) => m.id !== id))
}

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
    const trimmed = email.trim().toLowerCase()
    // Check built-in demo admin first
    if (trimmed === DEMO_ADMIN_CREDENTIALS.email && password === DEMO_ADMIN_CREDENTIALS.password) {
      const user: AuthUser = { id: 'demo-admin', email: DEMO_ADMIN_CREDENTIALS.email, role: 'admin' }
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      emit()
      return
    }
    // Check registered demo members
    const member = getMembers().find((m) => m.email === trimmed && m.password === password)
    if (member) {
      const user: AuthUser = { id: member.id, email: member.email, role: member.role }
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      emit()
      return
    }
    throw new AppError('Invalid email or password.')
  },
  async signUp(email: string, password: string, fullName: string) {
    await new Promise((r) => setTimeout(r, 350))
    const trimmed = email.trim().toLowerCase()
    if (trimmed === DEMO_ADMIN_CREDENTIALS.email) {
      throw new AppError('This email is already registered.')
    }
    const members = getMembers()
    if (members.some((m) => m.email === trimmed)) {
      throw new AppError('This email is already registered.')
    }
    const member: DemoMember = {
      id: crypto.randomUUID(),
      email: trimmed,
      fullName: fullName.trim(),
      password,
      role: 'user',
      createdAt: new Date().toISOString(),
    }
    members.push(member)
    saveMembers(members)
    // Auto sign-in after signup
    const user: AuthUser = { id: member.id, email: member.email, role: member.role }
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
