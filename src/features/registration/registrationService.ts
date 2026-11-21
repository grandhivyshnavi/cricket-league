import { AppError, toAppError } from '@/data/errors'
import { supabase } from '@/lib/supabase'

/**
 * Registration data access. The field set is intentionally open (`details`)
 * until the organisers confirm the registration form; once known, replace
 * `RegistrationDetails` with a concrete, validated type.
 *
 * Security: RLS only lets an authenticated user insert a row for themselves
 * with status 'pending'. Status changes are admin-only.
 */
export type RegistrationDetails = Record<string, string | number | boolean | null>

export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Registration {
  id: string
  userId: string
  details: RegistrationDetails
  status: RegistrationStatus
  createdAt: string
}

export async function submitRegistration(details: RegistrationDetails): Promise<{ id: string }> {
  if (!supabase) throw new AppError('Registration requires the live backend.')
  const { data, error } = await supabase.from('registrations').insert({ details }).select('id').single()
  if (error) throw toAppError(error)
  return { id: data.id as string }
}
