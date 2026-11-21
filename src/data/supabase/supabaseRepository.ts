import type { SupabaseClient } from '@supabase/supabase-js'
import type { Match, MatchStatus, Team, TournamentSettings } from '@/types/domain'
import { AppError, PERMISSION_DENIED, toAppError } from '../errors'
import { EMPTY_SETTINGS, type TournamentRepository } from '../repository'

interface TeamRow {
  id: string
  name: string
  short_name: string
  city: string | null
  logo_url: string | null
  color: string
  played: number
  won: number
  lost: number
  points: number
  manual_rank: number | null
  created_at: string
}

interface MatchRow {
  id: string
  team1_id: string
  team2_id: string
  scheduled_at: string
  venue: string
  status: MatchStatus
  winner_id: string | null
  result_summary: string | null
  completed_at: string | null
  created_at: string
}

interface SettingsRow {
  tagline: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  teams_count_override: number | null
  matches_count_override: number | null
  days_override: number | null
  prize_pool: string | null
  promo_video_url: string | null
  updated_at: string | null
}

const toTeam = (r: TeamRow): Team => ({
  id: r.id,
  name: r.name,
  shortName: r.short_name,
  city: r.city,
  logoUrl: r.logo_url,
  color: r.color,
  played: r.played,
  won: r.won,
  lost: r.lost,
  points: r.points,
  manualRank: r.manual_rank,
  createdAt: r.created_at,
})

const toMatch = (r: MatchRow): Match => ({
  id: r.id,
  team1Id: r.team1_id,
  team2Id: r.team2_id,
  scheduledAt: r.scheduled_at,
  venue: r.venue,
  status: r.status,
  winnerId: r.winner_id,
  resultSummary: r.result_summary,
  completedAt: r.completed_at,
  createdAt: r.created_at,
})

const toSettings = (r: SettingsRow | null): TournamentSettings =>
  r
    ? {
        tagline: r.tagline,
        description: r.description,
        startDate: r.start_date,
        endDate: r.end_date,
        teamsCountOverride: r.teams_count_override,
        matchesCountOverride: r.matches_count_override,
        daysOverride: r.days_override,
        prizePool: r.prize_pool,
        promoVideoUrl: r.promo_video_url,
        updatedAt: r.updated_at,
      }
    : EMPTY_SETTINGS

/**
 * RLS silently filters rows a user may not modify, so an update/delete that
 * touches zero rows is treated as a permission failure.
 */
function ensureAffected(result: { data: unknown[] | null; error: Parameters<typeof toAppError>[0] }) {
  if (result.error) throw toAppError(result.error)
  if (!result.data || result.data.length === 0) throw new AppError(PERMISSION_DENIED)
}

export function createSupabaseRepository(client: SupabaseClient): TournamentRepository {
  const teams = () => client.from('teams')
  const matches = () => client.from('matches')

  return {
    mode: 'supabase',

    async load() {
      const [t, m, s] = await Promise.all([
        teams().select('*').order('name'),
        matches().select('*').order('scheduled_at'),
        client.from('tournament_settings').select('*').eq('id', 1).maybeSingle(),
      ])
      const error = t.error ?? m.error ?? s.error
      if (error) throw toAppError(error, 'Unable to load tournament data.')
      return {
        teams: (t.data as TeamRow[]).map(toTeam),
        matches: (m.data as MatchRow[]).map(toMatch),
        settings: toSettings(s.data as SettingsRow | null),
      }
    },

    async createTeam(input) {
      const { error } = await teams().insert({
        name: input.name,
        short_name: input.shortName,
        city: input.city,
        logo_url: input.logoUrl,
        color: input.color,
      })
      if (error) throw toAppError(error)
    },

    async updateTeam(id, input) {
      ensureAffected(
        await teams()
          .update({ name: input.name, short_name: input.shortName, city: input.city, logo_url: input.logoUrl, color: input.color })
          .eq('id', id)
          .select('id'),
      )
    },

    async updateStandings(id, input) {
      ensureAffected(
        await teams()
          .update({ played: input.played, won: input.won, lost: input.lost, points: input.points, manual_rank: input.manualRank })
          .eq('id', id)
          .select('id'),
      )
    },

    async deleteTeam(id) {
      ensureAffected(await teams().delete().eq('id', id).select('id'))
    },

    async createMatch(input) {
      const { error } = await matches().insert({
        team1_id: input.team1Id,
        team2_id: input.team2Id,
        scheduled_at: input.scheduledAt,
        venue: input.venue,
      })
      if (error) throw toAppError(error)
    },

    async updateMatch(id, input) {
      ensureAffected(
        await matches()
          .update({ team1_id: input.team1Id, team2_id: input.team2Id, scheduled_at: input.scheduledAt, venue: input.venue })
          .eq('id', id)
          .select('id'),
      )
    },

    async deleteMatch(id) {
      ensureAffected(await matches().delete().eq('id', id).select('id'))
    },

    async completeMatch(id, completion) {
      ensureAffected(
        await matches()
          .update({
            status: 'completed',
            winner_id: completion.winnerId,
            result_summary: completion.resultSummary,
            completed_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('status', 'upcoming')
          .select('id'),
      )
    },

    async reopenMatch(id) {
      ensureAffected(
        await matches()
          .update({ status: 'upcoming', winner_id: null, result_summary: null, completed_at: null })
          .eq('id', id)
          .select('id'),
      )
    },

    async updateSettings(input) {
      const { error } = await client.from('tournament_settings').upsert({
        id: 1,
        tagline: input.tagline,
        description: input.description,
        start_date: input.startDate,
        end_date: input.endDate,
        teams_count_override: input.teamsCountOverride,
        matches_count_override: input.matchesCountOverride,
        days_override: input.daysOverride,
        prize_pool: input.prizePool,
        promo_video_url: input.promoVideoUrl,
      })
      if (error) throw toAppError(error)
    },

    subscribe(onChange) {
      const channel = client
        .channel('tournament-data')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_settings' }, onChange)
        .subscribe()
      return () => {
        void client.removeChannel(channel)
      }
    },
  }
}
