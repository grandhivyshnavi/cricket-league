import type { Match, TournamentSnapshot } from '@/types/domain'
import { AppError, PERMISSION_DENIED } from '../errors'
import type { TournamentRepository } from '../repository'
import { getDemoUser } from './demoAuth'
import { createDemoSeed } from './seed'

const STORAGE_KEY = 'sscl27.demo.data.v1'
const LATENCY_MS = 220
const listeners = new Set<() => void>()

const delay = () => new Promise((r) => setTimeout(r, LATENCY_MS))

function read(): TournamentSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as TournamentSnapshot
  } catch {
    /* fall through to a fresh seed */
  }
  const seed = createDemoSeed()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  return seed
}

function write(snapshot: TournamentSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  listeners.forEach((l) => l())
}

/** Mirrors the database RLS rule: only admins may write. */
async function mutate(fn: (draft: TournamentSnapshot) => void) {
  await delay()
  if (getDemoUser()?.role !== 'admin') throw new AppError(PERMISSION_DENIED)
  const draft = read()
  fn(draft)
  write(draft)
}

function findMatch(draft: TournamentSnapshot, id: string): Match {
  const m = draft.matches.find((x) => x.id === id)
  if (!m) throw new AppError('This match no longer exists.')
  return m
}

function assertTeamsValid(draft: TournamentSnapshot, team1Id: string, team2Id: string) {
  if (team1Id === team2Id) throw new AppError('A team cannot play against itself.')
  const ids = new Set(draft.teams.map((t) => t.id))
  if (!ids.has(team1Id) || !ids.has(team2Id)) throw new AppError('Please choose two existing teams.')
}

function assertUniqueName(draft: TournamentSnapshot, name: string, exceptId?: string) {
  if (draft.teams.some((t) => t.id !== exceptId && t.name.trim().toLowerCase() === name.trim().toLowerCase())) {
    throw new AppError('A team with this name already exists.')
  }
}

export function resetDemoData() {
  write(createDemoSeed())
}

export const demoRepository: TournamentRepository = {
  mode: 'demo',

  async load() {
    await delay()
    return read()
  },

  createTeam: (input) =>
    mutate((d) => {
      assertUniqueName(d, input.name)
      d.teams.push({
        ...input,
        id: crypto.randomUUID(),
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        manualRank: null,
        createdAt: new Date().toISOString(),
        registrationId: null,
        playerCount: 0,
        playerNames: [],
      })
    }),

  updateTeam: (id, input) =>
    mutate((d) => {
      assertUniqueName(d, input.name, id)
      d.teams = d.teams.map((t) => (t.id === id ? { ...t, ...input } : t))
    }),

  updateStandings: (id, input) =>
    mutate((d) => {
      if (input.won + input.lost > input.played) throw new AppError('Wins plus losses cannot exceed matches played.')
      d.teams = d.teams.map((t) => (t.id === id ? { ...t, ...input } : t))
    }),

  deleteTeam: (id) =>
    mutate((d) => {
      if (d.matches.some((m) => m.team1Id === id || m.team2Id === id)) {
        throw new AppError('This team is part of scheduled or completed matches. Remove those matches first.')
      }
      d.teams = d.teams.filter((t) => t.id !== id)
    }),

  createMatch: (input) =>
    mutate((d) => {
      assertTeamsValid(d, input.team1Id, input.team2Id)
      d.matches.push({
        ...input,
        id: crypto.randomUUID(),
        status: 'upcoming',
        winnerId: null,
        resultSummary: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
      })
    }),

  updateMatch: (id, input) =>
    mutate((d) => {
      assertTeamsValid(d, input.team1Id, input.team2Id)
      const m = findMatch(d, id)
      Object.assign(m, input)
      if (m.winnerId && m.winnerId !== m.team1Id && m.winnerId !== m.team2Id) m.winnerId = null
    }),

  deleteMatch: (id) =>
    mutate((d) => {
      findMatch(d, id)
      d.matches = d.matches.filter((m) => m.id !== id)
    }),

  completeMatch: (id, completion) =>
    mutate((d) => {
      const m = findMatch(d, id)
      if (m.status === 'completed') throw new AppError('This match has already been marked as completed.')
      if (completion.winnerId && ![m.team1Id, m.team2Id].includes(completion.winnerId)) {
        throw new AppError('The winner must be one of the participating teams.')
      }
      Object.assign(m, { ...completion, status: 'completed', completedAt: new Date().toISOString() })
    }),

  reopenMatch: (id) =>
    mutate((d) => {
      Object.assign(findMatch(d, id), { status: 'upcoming', completedAt: null, winnerId: null, resultSummary: null })
    }),

  updateSettings: (input) =>
    mutate((d) => {
      d.settings = { ...input, updatedAt: new Date().toISOString() }
    }),

  subscribe(onChange) {
    listeners.add(onChange)
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && onChange()
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(onChange)
      window.removeEventListener('storage', onStorage)
    }
  },
}
