import { Info, ListOrdered, Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { TeamCrest } from '@/components/brand/TeamCrest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { EmptyState } from '@/components/ui/states'
import { rankTeams, type RankedTeam } from '@/features/leaderboard/standings'
import { cn, getErrorMessage } from '@/lib/utils'
import { useTournament } from '@/state/TournamentProvider'
import type { StandingsInput } from '@/types/domain'
import { AdminPanel, td, th, tr } from '../ui'

type Draft = Record<'played' | 'won' | 'lost' | 'points' | 'manualRank', string>

const toDraft = (t: RankedTeam): Draft => ({
  played: String(t.played),
  won: String(t.won),
  lost: String(t.lost),
  points: String(t.points),
  manualRank: t.manualRank === null ? '' : String(t.manualRank),
})

function parse(d: Draft): { value?: StandingsInput; error?: string } {
  const int = (s: string) => (/^-?\d+$/.test(s.trim()) ? Number(s) : Number.NaN)
  const played = int(d.played)
  const won = int(d.won)
  const lost = int(d.lost)
  const points = int(d.points)
  const manualRank = d.manualRank.trim() === '' ? null : int(d.manualRank)
  if ([played, won, lost, points].some(Number.isNaN) || Number.isNaN(manualRank)) return { error: 'Use whole numbers only.' }
  if (played < 0 || won < 0 || lost < 0) return { error: 'Matches, wins and losses cannot be negative.' }
  if (won + lost > played) return { error: 'Wins plus losses cannot exceed matches played.' }
  if (manualRank !== null && manualRank < 1) return { error: 'Pinned position must be 1 or higher.' }
  return { value: { played, won, lost, points, manualRank } }
}

function StandingsRow({ team }: { team: RankedTeam }) {
  const { actions } = useTournament()
  const [draft, setDraft] = useState<Draft>(() => toDraft(team))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const original = toDraft(team)
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k].trim() !== original[k])

  async function save() {
    const { value, error: err } = parse(draft)
    setError(err ?? null)
    if (!value) return
    setPending(true)
    try {
      await actions.updateStandings(team.id, value)
      toast.success(`${team.name} standings updated`)
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setPending(false)
    }
  }

  const cell = (key: keyof Draft, label: string, placeholder?: string) => (
    <td className={td}>
      <Input
        type="number"
        inputMode="numeric"
        aria-label={`${team.name} ${label}`}
        value={draft[key]}
        placeholder={placeholder}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        onKeyDown={(e) => e.key === 'Enter' && dirty && void save()}
        className="h-10 w-20 px-2.5 text-center tabular-nums"
      />
    </td>
  )

  return (
    <>
      <tr className={cn(tr, dirty && 'bg-volt-400/[0.03]')}>
        <td className={`${td} w-14 font-heading tabular-nums text-fog-400`}>{team.rank}</td>
        <td className={td}>
          <div className="flex items-center gap-3">
            <TeamCrest team={team} size="sm" />
            <span className="font-semibold text-fog-50">{team.name}</span>
          </div>
        </td>
        {cell('played', 'matches played')}
        {cell('won', 'wins')}
        {cell('lost', 'losses')}
        {cell('points', 'points')}
        {cell('manualRank', 'pinned position', 'Auto')}
        <td className={`${td} text-right`}>
          <Button size="sm" variant={dirty ? 'primary' : 'secondary'} disabled={!dirty} loading={pending} onClick={save}>
            <Save /> Save
          </Button>
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={8} className="px-7 pb-4 text-xs font-medium text-danger-400" role="alert">
            {team.name}: {error}
          </td>
        </tr>
      )}
    </>
  )
}

export function LeaderboardTab() {
  const { teams } = useTournament()
  const ranked = rankTeams(teams)

  return (
    <AdminPanel title="Leaderboard" description="Enter standings exactly as recorded by the organisers. Nothing is calculated automatically.">
      <p className="mx-5 mt-5 flex items-start gap-2.5 rounded-control border border-white/[0.06] bg-white/[0.02] p-4 text-xs leading-relaxed text-fog-400 sm:mx-7">
        <Info className="mt-0.5 size-4 shrink-0 text-volt-400" />
        Teams are ordered by pinned position first, then points, wins and fewest losses. Leave “Pin” empty to order
        automatically, or set a number to fix a team at that position.
      </p>
      {ranked.length === 0 ? (
        <EmptyState icon={ListOrdered} title="No teams yet" className="m-5 border-0" />
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[52rem]">
            <thead>
              <tr>
                <th className={th}>Pos</th>
                <th className={th}>Team</th>
                <th className={th}>M</th>
                <th className={th}>W</th>
                <th className={th}>L</th>
                <th className={th}>Pts</th>
                <th className={th}>Pin</th>
                <th className={th}>
                  <span className="sr-only">Save</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((t) => (
                <StandingsRow key={`${t.id}-${t.played}-${t.won}-${t.lost}-${t.points}-${t.manualRank}`} team={t} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPanel>
  )
}
