import { describe, expect, it } from 'vitest'
import { hasStandings, rankTeams } from '@/features/leaderboard/standings'
import { completedMatches, upcomingMatches } from '@/features/matches/selectors'
import { createDemoSeed } from '@/data/demo/seed'
import { formatMatchTime, inclusiveDays, istDayKey, istPartsToIso, isoToIstParts } from './datetime'
import { buildIcs } from './ics'
import { deriveTournamentStats } from './tournament-stats'
import { resolveVideoSource } from './video'
import type { Team } from '@/types/domain'

const team = (id: string, o: Partial<Team> = {}): Team => ({
  id, name: id, shortName: id.slice(0, 2), city: null, logoUrl: null, color: '#ffffff',
  played: 0, won: 0, lost: 0, points: 0, manualRank: null, createdAt: '', ...o,
})

describe('rankTeams', () => {
  it('orders by points, then wins, then fewest losses, then name', () => {
    const ranked = rankTeams([
      team('C', { points: 4, won: 2, lost: 1 }),
      team('A', { points: 4, won: 2, lost: 0 }),
      team('B', { points: 6 }),
      team('D', { points: 4, won: 1 }),
    ])
    expect(ranked.map((t) => [t.id, t.rank])).toEqual([['B', 1], ['A', 2], ['C', 3], ['D', 4]])
  })
  it('honours admin-pinned positions first', () => {
    const ranked = rankTeams([team('A', { points: 10 }), team('B', { points: 0, manualRank: 1 })])
    expect(ranked[0].id).toBe('B')
  })
  it('detects whether standings exist', () => {
    expect(hasStandings([team('A'), team('B')])).toBe(false)
    expect(hasStandings([team('A', { played: 1 })])).toBe(true)
  })
})

describe('IST date handling', () => {
  it('round-trips form values through UTC regardless of host timezone', () => {
    const iso = istPartsToIso('2027-01-14', '19:30')
    expect(iso).toBe('2027-01-14T14:00:00.000Z')
    expect(isoToIstParts(iso)).toEqual({ date: '2027-01-14', time: '19:30' })
  })
  it('groups late-night matches on the correct IST day', () => {
    expect(istDayKey(istPartsToIso('2027-01-14', '23:45'))).toBe('2027-01-14')
    expect(istDayKey(istPartsToIso('2027-01-15', '00:15'))).toBe('2027-01-15')
  })
  it('formats time in IST', () => {
    expect(formatMatchTime('2027-01-14T14:00:00.000Z')).toBe('7:30 PM IST')
  })
  it('counts tournament days inclusively', () => {
    expect(inclusiveDays('2027-01-10', '2027-01-16')).toBe(7)
    expect(inclusiveDays('2027-01-16', '2027-01-10')).toBeNull()
  })
  it('rejects invalid input', () => {
    expect(() => istPartsToIso('', '')).toThrow()
  })
})

describe('match selectors', () => {
  it('splits upcoming (soonest first) and completed (latest first)', () => {
    const matches = [
      { id: 'm1', team1Id: 'a', team2Id: 'b', scheduledAt: '2027-01-12T14:00:00.000Z', venue: 'V', status: 'upcoming' as const, winnerId: null, resultSummary: null, completedAt: null, createdAt: '' },
      { id: 'm2', team1Id: 'a', team2Id: 'c', scheduledAt: '2027-01-11T14:00:00.000Z', venue: 'V', status: 'completed' as const, winnerId: 'a', resultSummary: 'A won', completedAt: '2027-01-11T17:00:00.000Z', createdAt: '' },
      { id: 'm3', team1Id: 'b', team2Id: 'c', scheduledAt: '2027-01-13T14:00:00.000Z', venue: 'V', status: 'upcoming' as const, winnerId: null, resultSummary: null, completedAt: null, createdAt: '' },
      { id: 'm4', team1Id: 'c', team2Id: 'a', scheduledAt: '2027-01-10T14:00:00.000Z', venue: 'V', status: 'completed' as const, winnerId: 'c', resultSummary: 'C won', completedAt: '2027-01-10T17:00:00.000Z', createdAt: '' },
    ]
    const up = upcomingMatches(matches)
    const done = completedMatches(matches)
    expect(up.length + done.length).toBe(matches.length)
    expect(up.every((m) => m.status === 'upcoming')).toBe(true)
    expect(Date.parse(up[0].scheduledAt)).toBeLessThanOrEqual(Date.parse(up[1].scheduledAt))
    expect(Date.parse(done[0].completedAt!)).toBeGreaterThanOrEqual(Date.parse(done[1].completedAt!))
  })
  it('handles empty list', () => {
    expect(upcomingMatches([])).toEqual([])
    expect(completedMatches([])).toEqual([])
  })
})

describe('deriveTournamentStats', () => {
  it('derives from data unless overridden', () => {
    const seed = createDemoSeed()
    expect(deriveTournamentStats(seed)).toEqual({ teams: 0, matches: 0, days: 21, prizePool: '₹1 LAKH' })
    const overridden = { ...seed, settings: { ...seed.settings, teamsCountOverride: 16, daysOverride: 24, prizePool: '  ' } }
    expect(deriveTournamentStats(overridden)).toMatchObject({ teams: 16, days: 24, prizePool: null })
  })
})

describe('resolveVideoSource', () => {
  it('supports YouTube, Vimeo and direct files over https only', () => {
    expect(resolveVideoSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.src).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(resolveVideoSource('https://youtu.be/dQw4w9WgXcQ')?.kind).toBe('embed')
    expect(resolveVideoSource('https://vimeo.com/123456')?.src).toContain('player.vimeo.com/video/123456')
    expect(resolveVideoSource('https://cdn.example.com/promo.mp4')?.kind).toBe('file')
    expect(resolveVideoSource('http://youtu.be/dQw4w9WgXcQ')).toBeNull()
    expect(resolveVideoSource('javascript:alert(1)')).toBeNull()
    expect(resolveVideoSource('not a url')).toBeNull()
  })
})

describe('buildIcs', () => {
  it('produces a valid escaped VEVENT', () => {
    const ics = buildIcs({ uid: 'm1', title: 'A vs B', startIso: '2027-01-14T14:00:00.000Z', location: 'Ground, City' })
    expect(ics).toContain('DTSTART:20270114T140000Z')
    expect(ics).toContain('DTEND:20270114T170000Z')
    expect(ics).toContain('LOCATION:Ground' + String.fromCharCode(92) + ', City')
  })
})
