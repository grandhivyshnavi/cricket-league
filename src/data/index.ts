import { supabase } from '@/lib/supabase'
import { demoRepository } from './demo/demoRepository'
import type { TournamentRepository } from './repository'
import { createSupabaseRepository } from './supabase/supabaseRepository'

export const repository: TournamentRepository = supabase ? createSupabaseRepository(supabase) : demoRepository
export const isDemoMode = repository.mode === 'demo'

export { authService } from './auth'
export type { TournamentRepository } from './repository'
