import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { repository, type TournamentRepository } from '@/data'
import { EMPTY_SETTINGS } from '@/data/repository'
import { getErrorMessage } from '@/lib/utils'
import type { Team, TournamentSnapshot } from '@/types/domain'

type Mutations = Omit<TournamentRepository, 'mode' | 'load' | 'subscribe'>

interface TournamentContextValue extends TournamentSnapshot {
  status: 'loading' | 'ready' | 'error'
  error: string | null
  teamsById: Map<string, Team>
  reload(): Promise<void>
  actions: Mutations
}

const TournamentContext = createContext<TournamentContextValue | null>(null)

const EMPTY: TournamentSnapshot = { teams: [], matches: [], settings: EMPTY_SETTINGS }

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<TournamentSnapshot>(EMPTY)
  const [status, setStatus] = useState<TournamentContextValue['status']>('loading')
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const reload = useCallback(async () => {
    const id = ++requestId.current
    try {
      const data = await repository.load()
      if (id !== requestId.current) return
      setSnapshot(data)
      setStatus('ready')
      setError(null)
    } catch (e) {
      if (id !== requestId.current) return
      setError(getErrorMessage(e, 'Unable to load tournament data.'))
      setStatus((s) => (s === 'ready' ? s : 'error'))
    }
  }, [])

  useEffect(() => {
    void reload()
    return repository.subscribe(() => void reload())
  }, [reload])

  const actions = useMemo<Mutations>(() => {
    const wrap =
      <A extends unknown[]>(fn: (...args: A) => Promise<void>) =>
      async (...args: A) => {
        await fn(...args)
        await reload()
      }
    return {
      createTeam: wrap(repository.createTeam),
      updateTeam: wrap(repository.updateTeam),
      updateStandings: wrap(repository.updateStandings),
      deleteTeam: wrap(repository.deleteTeam),
      createMatch: wrap(repository.createMatch),
      updateMatch: wrap(repository.updateMatch),
      deleteMatch: wrap(repository.deleteMatch),
      completeMatch: wrap(repository.completeMatch),
      reopenMatch: wrap(repository.reopenMatch),
      updateSettings: wrap(repository.updateSettings),
    }
  }, [reload])

  const value = useMemo<TournamentContextValue>(
    () => ({
      ...snapshot,
      status,
      error,
      teamsById: new Map(snapshot.teams.map((t) => [t.id, t])),
      reload,
      actions,
    }),
    [snapshot, status, error, reload, actions],
  )

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>
}

export function useTournament() {
  const ctx = useContext(TournamentContext)
  if (!ctx) throw new Error('useTournament must be used within TournamentProvider')
  return ctx
}
