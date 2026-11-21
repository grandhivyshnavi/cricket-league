import { Crown, Pencil, Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { TeamCrest } from '@/components/brand/TeamCrest'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/field'
import { cn, getErrorMessage } from '@/lib/utils'
import { useTournament } from '@/state/TournamentProvider'
import type { StandingsInput } from '@/types/domain'
import type { RankedTeam } from './standings'

const rankStyles: Record<number, string> = {
  1: 'bg-linear-to-br from-[#ffe7a1] to-gold-400 text-ink-950 shadow-[0_0_18px_-2px_rgb(244_201_78/0.55)]',
  2: 'bg-linear-to-br from-white to-silver-400 text-ink-950',
  3: 'bg-linear-to-br from-[#f1c193] to-bronze-400 text-ink-950',
}

function RankChip({ rank, showMedals }: { rank: number; showMedals: boolean }) {
  return (
    <span
      className={cn(
        'grid size-8 place-items-center rounded-lg font-heading text-[13px] tabular-nums',
        showMedals && rankStyles[rank] ? rankStyles[rank] : 'border border-white/[0.07] bg-white/[0.03] text-fog-400',
      )}
    >
      {rank}
    </span>
  )
}

const numCell = 'w-8 px-0.5 text-center tabular-nums sm:w-14 sm:px-1'

/* ------------------------------------------------------------------ */
/*  Edit Standings Dialog                                              */
/* ------------------------------------------------------------------ */

function EditStandingsDialog({ team, open, onOpenChange }: { team: RankedTeam; open: boolean; onOpenChange(open: boolean): void }) {
  const { actions } = useTournament()
  const [played, setPlayed] = useState(String(team.played))
  const [won, setWon] = useState(String(team.won))
  const [lost, setLost] = useState(String(team.lost))
  const [points, setPoints] = useState(String(team.points))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const p = Number(played), w = Number(won), l = Number(lost), pts = Number(points)
    if ([p, w, l, pts].some(Number.isNaN)) { setError('Use whole numbers only.'); return }
    if (p < 0 || w < 0 || l < 0) { setError('Values cannot be negative.'); return }
    if (w + l > p) { setError('Wins plus losses cannot exceed matches played.'); return }
    setError(null)
    setPending(true)
    try {
      const input: StandingsInput = { played: p, won: w, lost: l, points: pts, manualRank: team.manualRank }
      await actions.updateStandings(team.id, input)
      toast.success(`${team.name} standings updated`)
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent title={`Edit standings — ${team.name}`} description="Update this team's match statistics." size="sm">
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-2 gap-5">
          <Field id="es-played" label="Matches (M)">
            <Input id="es-played" type="number" inputMode="numeric" value={played} onChange={(e) => setPlayed(e.target.value)} />
          </Field>
          <Field id="es-won" label="Wins (W)">
            <Input id="es-won" type="number" inputMode="numeric" value={won} onChange={(e) => setWon(e.target.value)} />
          </Field>
          <Field id="es-lost" label="Losses (L)">
            <Input id="es-lost" type="number" inputMode="numeric" value={lost} onChange={(e) => setLost(e.target.value)} />
          </Field>
          <Field id="es-points" label="Points (Pts)">
            <Input id="es-points" type="number" inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value)} />
          </Field>
          {error && <p className="col-span-2 text-xs font-medium text-danger-400" role="alert">{error}</p>}
          <DialogFooter className="col-span-2 mt-1">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" loading={pending}><Save /> Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/*  Leaderboard Table                                                  */
/* ------------------------------------------------------------------ */

interface LeaderboardTableProps {
  teams: RankedTeam[]
  /** Medals and leader highlight only make sense once results are recorded. */
  highlight: boolean
  caption: string
  /** Show edit buttons on each row (for admins on public pages). */
  editable?: boolean
}

export function LeaderboardTable({ teams, highlight, caption, editable }: LeaderboardTableProps) {
  const [editing, setEditing] = useState<RankedTeam | null>(null)

  return (
    <>
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-[0.16em] text-fog-500">
            <th scope="col" className="w-12 py-4 pl-4 pr-1 font-bold sm:w-16 sm:pl-6">
              Pos
            </th>
            <th scope="col" className="px-2 py-4 font-bold">
              Team
            </th>
            <th scope="col" className={numCell}>
              <abbr title="Matches played" className="no-underline">M</abbr>
            </th>
            <th scope="col" className={numCell}>
              <abbr title="Wins" className="no-underline">W</abbr>
            </th>
            <th scope="col" className={numCell}>
              <abbr title="Losses" className="no-underline">L</abbr>
            </th>
            <th scope="col" className={cn(numCell, editable ? '' : 'w-11 pr-4 sm:w-20 sm:pr-6')}>
              <abbr title="Points" className="no-underline">Pts</abbr>
            </th>
            {editable && (
              <th scope="col" className="w-12 pr-4 sm:w-16 sm:pr-6">
                <span className="sr-only">Edit</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => {
            const leader = highlight && t.rank === 1
            return (
              <tr
                key={t.id}
                className={cn(
                  'relative border-b border-white/[0.04] text-sm transition-colors duration-300 last:border-0',
                  leader ? 'bg-linear-to-r from-volt-400/[0.09] via-volt-400/[0.03] to-transparent' : 'hover:bg-white/[0.02]',
                )}
              >
                <td className="relative py-3.5 pl-4 pr-1 sm:pl-6">
                  {leader && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-volt-400 shadow-glow-sm" aria-hidden />}
                  <RankChip rank={t.rank} showMedals={highlight} />
                </td>
                <th scope="row" className="px-2 py-3.5 font-normal">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <TeamCrest team={t} size="sm" className="size-7 sm:size-9" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate font-semibold text-fog-50">
                        <span className="truncate">{t.name}</span>
                        {leader && <Crown className="size-3.5 shrink-0 text-gold-400" aria-label="Leader" />}
                      </p>
                      {t.city && <p className="hidden truncate text-xs text-fog-500 sm:block">{t.city}</p>}
                    </div>
                  </div>
                </th>
                <td className={cn(numCell, 'text-fog-300')}>{t.played}</td>
                <td className={cn(numCell, 'text-fog-300')}>{t.won}</td>
                <td className={cn(numCell, 'text-fog-300')}>{t.lost}</td>
                <td className={cn(numCell, editable ? '' : 'w-11 pr-4 sm:w-20 sm:pr-6', 'font-heading text-base', leader ? 'text-volt-300' : 'text-fog-50')}>
                  {t.points}
                </td>
                {editable && (
                  <td className="pr-4 text-right sm:pr-6">
                    <button
                      type="button"
                      onClick={() => setEditing(t)}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-white/10 text-fog-400 transition-colors hover:border-volt-400/40 hover:text-volt-400"
                      aria-label={`Edit ${t.name} standings`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>

      {editing && (
        <EditStandingsDialog
          key={editing.id}
          team={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </>
  )
}

export function LeaderboardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-white/[0.04]" aria-hidden>
      <div className="flex h-12 items-center px-6">
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-16 items-center gap-4 px-6">
          <div className="skeleton size-8 rounded-lg" />
          <div className="skeleton size-9 rounded-xl" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton ml-auto h-4 w-32 rounded" />
        </div>
      ))}
    </div>
  )
}
