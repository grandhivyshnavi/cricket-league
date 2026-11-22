import { Ban, Camera, CircleCheck, Clock, ExternalLink, Eye, Inbox, Mail, MapPin, Phone, RefreshCw, Trash, TriangleAlert, Undo2, Users, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Segmented } from '@/components/ui/segmented'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/states'
import {
  deleteTeamRegistration,
  getTeamPhotoUrl,
  isRegistrationAvailable,
  listTeamRegistrations,
  updateRegistrationStatus,
} from '@/data/registrations'
import { PLAYER_COUNT } from '@/features/registration/validation'
import { formatMatchDate, formatMatchTime, formatRelative } from '@/lib/datetime'
import { getErrorMessage } from '@/lib/utils'
import type { RegistrationStatus, TeamRegistration } from '@/types/domain'
import { AdminPanel, td, th, tr } from '../ui'

type Filter = 'all' | RegistrationStatus

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

const formatPhone = (p: string) => `+91 ${p.slice(0, 5)} ${p.slice(5)}`
const submittedAt = (iso: string) => `${formatMatchDate(iso)} · ${formatMatchTime(iso)}`

function StatusBadge({ registration }: { registration: TeamRegistration }) {
  if (registration.awaitingPhoto) {
    return (
      <Badge tone="gold">
        <TriangleAlert className="size-3" /> Incomplete
      </Badge>
    )
  }
  const { status } = registration
  return (
    <Badge tone={status === 'approved' ? 'volt' : status === 'pending' ? 'gold' : 'neutral'}>
      {status === 'approved' ? <CircleCheck className="size-3" /> : status === 'pending' ? <Clock className="size-3" /> : <X className="size-3" />}
      {STATUS_LABEL[status]}
    </Badge>
  )
}

function InfoBlock({ icon: Icon, title, children }: { icon: typeof Mail; title: string; children: ReactNode }) {
  return (
    <div className="rounded-card border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-fog-500">
        <Icon className="size-3.5 text-volt-400" aria-hidden /> {title}
      </p>
      <div className="mt-3 grid gap-1 text-sm text-fog-200">{children}</div>
    </div>
  )
}

function TeamPhoto({ path, teamName }: { path: string; teamName: string }) {
  const [state, setState] = useState<{ url?: string; error?: string }>({})

  useEffect(() => {
    let active = true
    getTeamPhotoUrl(path)
      .then((url) => active && setState({ url }))
      .catch((e) => active && setState({ error: getErrorMessage(e) }))
    return () => {
      active = false
    }
  }, [path])

  if (state.error) return <p className="text-sm text-danger-400">{state.error}</p>
  if (!state.url) return <Spinner label="Loading photo" className="py-12" />
  return (
    <figure className="overflow-hidden rounded-card border border-white/[0.06] bg-ink-950">
      <img src={state.url} alt={`${teamName} team photo`} className="max-h-[26rem] w-full object-contain" />
      <figcaption className="flex justify-end border-t border-white/[0.06] p-2">
        <a
          href={state.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-fog-300 hover:bg-white/[0.06] hover:text-fog-50"
        >
          Open full size <ExternalLink className="size-3.5" />
        </a>
      </figcaption>
    </figure>
  )
}

function RegistrationDialog({ registration, onClose, onChanged }: {
  registration: TeamRegistration
  onClose(): void
  onChanged(): void
}) {
  const [pending, setPending] = useState<RegistrationStatus | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const r = registration

  async function setStatus(status: RegistrationStatus) {
    setPending(status)
    try {
      await updateRegistrationStatus(r.id, status)
      toast.success(`${r.teamName} marked ${STATUS_LABEL[status].toLowerCase()}`)
      onChanged()
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setPending(null)
    }
  }

  const statusButton = (status: RegistrationStatus, label: string, icon: ReactNode, variant: 'primary' | 'secondary' = 'secondary') =>
    r.status !== status && (
      <Button size="sm" variant={variant} loading={pending === status} disabled={pending !== null} onClick={() => setStatus(status)}>
        {icon} {label}
      </Button>
    )

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
        <DialogContent
          size="xl"
          title={r.teamName}
          description={`Submitted ${submittedAt(r.createdAt)} · Ref ${r.id.slice(0, 8).toUpperCase()}`}
        >
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge registration={r} />
              {r.awaitingPhoto && (
                <p className="text-xs text-gold-400">The photo upload for this submission did not finish. It is purged automatically after 30 minutes.</p>
              )}
              <div className="ml-auto flex flex-wrap gap-2">
                {statusButton('approved', 'Approve', <CircleCheck />, 'primary')}
                {statusButton('rejected', 'Reject', <Ban />)}
                {statusButton('pending', 'Mark pending', <Undo2 />)}
                <Button size="sm" variant="danger-ghost" disabled={pending !== null} onClick={() => setConfirmDelete(true)}>
                  <Trash /> Delete
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock icon={Mail} title="Contact">
                <a href={`mailto:${r.email}`} className="break-all hover:text-volt-300">{r.email}</a>
                <a href={`tel:+91${r.contactPhone}`} className="tabular-nums hover:text-volt-300">{formatPhone(r.contactPhone)}</a>
              </InfoBlock>
              <InfoBlock icon={MapPin} title="Address">
                <span>{r.addressLine1}</span>
                {r.addressLine2 && <span>{r.addressLine2}</span>}
                <span>
                  {r.city}, {r.state} — <span className="tabular-nums">{r.pinCode}</span>
                </span>
              </InfoBlock>
            </div>

            <div>
              <h3 className="flex items-center gap-2 font-heading text-base uppercase text-fog-50">
                <Users className="size-4 text-volt-400" aria-hidden /> Player roster
                <span className="text-xs font-semibold normal-case text-fog-500">
                  {r.players.length}/{PLAYER_COUNT}
                </span>
              </h3>
              <div className="mt-3 overflow-x-auto rounded-card border border-white/[0.06]">
                <table className="w-full min-w-[28rem]">
                  <thead>
                    <tr>
                      <th className={`${th} w-14`}>#</th>
                      <th className={th}>Player name</th>
                      <th className={th}>Contact number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.players.map((p) => (
                      <tr key={p.playerNo} className={tr}>
                        <td className={`${td} tabular-nums text-fog-500`}>{p.playerNo}</td>
                        <td className={`${td} font-semibold text-fog-50`}>{p.fullName}</td>
                        <td className={td}>
                          <a href={`tel:+91${p.phone}`} className="tabular-nums text-fog-300 hover:text-volt-300">
                            {formatPhone(p.phone)}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 font-heading text-base uppercase text-fog-50">
                <Camera className="size-4 text-volt-400" aria-hidden /> Team photo
              </h3>
              <div className="mt-3">
                {r.photoPath ? (
                  <TeamPhoto path={r.photoPath} teamName={r.teamName} />
                ) : (
                  <p className="rounded-card border border-dashed border-white/10 px-4 py-6 text-center text-sm text-fog-500">
                    No photo was uploaded.
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        tone="danger"
        title={`Delete ${r.teamName}?`}
        description="This permanently removes the registration, its 13 players and the team photo."
        confirmLabel="Delete registration"
        successMessage="Registration deleted"
        onConfirm={async () => {
          await deleteTeamRegistration(r)
          onClose()
          onChanged()
        }}
      />
    </>
  )
}

export function RegistrationsTab() {
  const [items, setItems] = useState<TeamRegistration[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isRegistrationAvailable)
  const [filter, setFilter] = useState<Filter>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isRegistrationAvailable) return
    setLoading(true)
    try {
      setItems(await listTeamRegistrations())
      setError(null)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const all = useMemo(() => items ?? [], [items])
  const count = (s: RegistrationStatus) => all.filter((r) => r.status === s).length
  const visible = filter === 'all' ? all : all.filter((r) => r.status === filter)
  const open = all.find((r) => r.id === openId) ?? null

  return (
    <AdminPanel
      title="Registrations"
      description={
        isRegistrationAvailable
          ? `${all.length} team registration${all.length === 1 ? '' : 's'} · ${count('pending')} pending review`
          : 'Team registrations are stored in Supabase.'
      }
      actions={
        isRegistrationAvailable && (
          <Button size="sm" variant="secondary" onClick={() => void refresh()} loading={loading}>
            {!loading && <RefreshCw />} Refresh
          </Button>
        )
      }
    >
      {!isRegistrationAvailable ? (
        <EmptyState icon={Inbox} title="Not available in demo mode" description="Connect Supabase to receive team registrations." className="m-5 border-0" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refresh()} className="m-5" />
      ) : items === null ? (
        <Spinner label="Loading registrations" className="py-16" />
      ) : (
        <>
          <div className="border-b border-white/[0.06] px-5 py-4 sm:px-7">
            <Segmented
              label="Filter registrations by status"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All', count: all.length },
                { value: 'pending', label: 'Pending', count: count('pending') },
                { value: 'approved', label: 'Approved', count: count('approved') },
                { value: 'rejected', label: 'Rejected', count: count('rejected') },
              ]}
            />
          </div>
          {visible.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={all.length === 0 ? 'No registrations yet' : 'Nothing here'}
              description={all.length === 0 ? 'Teams that register on the website will appear here.' : 'No registrations match this filter.'}
              className="m-5 border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem]">
                <thead>
                  <tr>
                    <th className={th}>Team</th>
                    <th className={th}>Contact</th>
                    <th className={th}>Players</th>
                    <th className={th}>Photo</th>
                    <th className={th}>Status</th>
                    <th className={th}>Submitted</th>
                    <th className={`${th} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.id} className={tr}>
                      <td className={td}>
                        <p className="font-semibold text-fog-50">{r.teamName}</p>
                        <p className="text-xs text-fog-500">
                          {r.city}, {r.state}
                        </p>
                      </td>
                      <td className={td}>
                        <p className="flex items-center gap-1.5 text-fog-300">
                          <Phone className="size-3 text-fog-500" aria-hidden />
                          <span className="tabular-nums">{formatPhone(r.contactPhone)}</span>
                        </p>
                        <p className="max-w-56 truncate text-xs text-fog-500">{r.email}</p>
                      </td>
                      <td className={`${td} tabular-nums text-fog-300`}>
                        {r.players.length}/{PLAYER_COUNT}
                      </td>
                      <td className={td}>
                        {r.photoPath ? (
                          <Camera className="size-4 text-volt-400" aria-label="Photo uploaded" />
                        ) : (
                          <span className="text-fog-600" aria-label="No photo">—</span>
                        )}
                      </td>
                      <td className={td}>
                        <StatusBadge registration={r} />
                      </td>
                      <td className={`${td} whitespace-nowrap text-fog-400`} title={submittedAt(r.createdAt)}>
                        {formatRelative(r.createdAt)}
                      </td>
                      <td className={td}>
                        <div className="flex justify-end">
                          <Button variant="secondary" size="sm" onClick={() => setOpenId(r.id)} aria-label={`View ${r.teamName}`}>
                            <Eye /> View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {open && <RegistrationDialog registration={open} onClose={() => setOpenId(null)} onChanged={() => void refresh()} />}
    </AdminPanel>
  )
}
