import { supabase } from '@/lib/supabase'
import { AppError } from '../errors'

export interface ManagedUser {
  id: string
  fullName: string | null
  email: string
  role: 'admin' | 'user'
  createdAt: string
}

async function callAdminUsers(body: Record<string, unknown>): Promise<unknown> {
  if (!supabase) throw new AppError('Supabase is not configured.')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new AppError('You must be signed in.')

  const { data, error } = await supabase.functions.invoke('admin-users', {
    body,
  })

  if (error) {
    // Edge function errors come as FunctionsHttpError with context
    const msg = typeof data === 'object' && data?.error ? data.error : error.message
    throw new AppError(msg || 'Request failed.')
  }

  if (data?.error) throw new AppError(data.error)
  return data
}

export async function listUsers(): Promise<ManagedUser[]> {
  const result = await callAdminUsers({ action: 'list' }) as { users: ManagedUser[] }
  return result.users ?? []
}

export async function createUser(input: {
  email: string
  password: string
  fullName: string
  role: 'admin' | 'user'
}): Promise<void> {
  await callAdminUsers({ action: 'create', ...input })
}

export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
  await callAdminUsers({ action: 'updateRole', userId, role })
}

export async function deleteUser(userId: string): Promise<void> {
  await callAdminUsers({ action: 'delete', userId })
}
