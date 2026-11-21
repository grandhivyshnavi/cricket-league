import { Crown, Eye, EyeOff, Plus, ShieldCheck, ShieldMinus, Trash, UserPlus, Users } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/field'
import { EmptyState, Spinner } from '@/components/ui/states'
import { isDemoMode } from '@/data'
import {
  getDemoMembers,
  promoteDemoMember,
  demoteDemoMember,
  removeDemoMember,
  type DemoMember,
} from '@/data/demo/demoAuth'
import {
  listUsers,
  createUser,
  updateUserRole,
  deleteUser,
  type ManagedUser,
} from '@/data/supabase/adminUsers'
import { formatRelative } from '@/lib/datetime'
import { getErrorMessage, isValidEmail } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'
import { AdminPanel, td, th, tr } from '../ui'

type Member = ManagedUser | DemoMember

interface MemberAction {
  type: 'promote' | 'demote' | 'remove'
  member: Member
}

/* ------------------------------------------------------------------ */
/*  Add User Dialog                                                    */
/* ------------------------------------------------------------------ */

function AddUserDialog({ open, onOpenChange, onCreated }: {
  open: boolean
  onOpenChange(open: boolean): void
  onCreated(): void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'user'>('user')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setRole('user')
    setShowPassword(false)
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { setError('Full name is required.'); return }
    if (!isValidEmail(email)) { setError('Enter a valid email address.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setError(null)
    setPending(true)
    try {
      await createUser({ email: email.trim(), password, fullName: fullName.trim(), role })
      toast.success(`User ${email} created`)
      reset()
      onCreated()
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!pending) { onOpenChange(o); if (!o) reset() } }}>
      <DialogContent title="Add user" description="Create a new user account and assign their role.">
        <form onSubmit={handleSubmit} noValidate className="grid gap-5">
          <Field id="u-name" label="Full name" error={!fullName.trim() && error?.includes('name') ? error : undefined}>
            <Input id="u-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field id="u-email" label="Email address">
            <Input id="u-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field id="u-password" label="Password">
            <div className="relative">
              <Input
                id="u-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-fog-500 hover:text-fog-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <Field id="u-confirm" label="Confirm password">
            <Input
              id="u-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
          <Field id="u-role" label="Role">
            <Select id="u-role" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')}>
              <option value="user">User</option>
              <option value="admin">Administrator</option>
            </Select>
          </Field>
          {error && (
            <p className="text-xs font-medium text-danger-400" role="alert">{error}</p>
          )}
          <DialogFooter className="mt-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" loading={pending}><UserPlus /> Create user</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/*  Members Tab                                                        */
/* ------------------------------------------------------------------ */

export function MembersTab() {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<MemberAction | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const refresh = useCallback(async () => {
    if (isDemoMode) {
      setMembers(getDemoMembers())
      setLoading(false)
    } else {
      try {
        const users = await listUsers()
        setMembers(users)
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const handleConfirm = async () => {
    if (!action) return
    const { type, member } = action
    const name = ('fullName' in member ? member.fullName : '') || member.email

    if (isDemoMode) {
      if (type === 'promote') { promoteDemoMember(member.id); toast.success(`${name} promoted to admin`) }
      else if (type === 'demote') { demoteDemoMember(member.id); toast.success(`${name} demoted to user`) }
      else { removeDemoMember(member.id); toast.success(`${name} removed`) }
      void refresh()
    } else {
      try {
        if (type === 'promote') { await updateUserRole(member.id, 'admin'); toast.success(`${name} promoted to admin`) }
        else if (type === 'demote') { await updateUserRole(member.id, 'user'); toast.success(`${name} demoted to user`) }
        else { await deleteUser(member.id); toast.success(`${name} removed`) }
        void refresh()
      } catch (err) {
        toast.error(getErrorMessage(err))
      }
    }
  }

  const admins = members.filter((m) => m.role === 'admin')
  const users = members.filter((m) => m.role === 'user')
  const sorted = [...admins, ...users]

  return (
    <>
      <AdminPanel
        title="User Management"
        description={loading ? 'Loading…' : `${members.length} registered user${members.length === 1 ? '' : 's'}`}
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus /> Add user
          </Button>
        }
      >
        {loading ? (
          <Spinner label="Loading users" className="py-16" />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users yet"
            description="Click 'Add user' to create the first account."
            className="m-5 border-0"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem]">
              <thead>
                <tr>
                  <th className={th}>User</th>
                  <th className={th}>Role</th>
                  <th className={th}>Joined</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => {
                  const isCurrentUser = m.id === user?.id
                  const name = ('fullName' in m ? m.fullName : '') || m.email
                  return (
                    <tr key={m.id} className={tr}>
                      <td className={td}>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate font-semibold text-fog-50">
                            {name}
                            {isCurrentUser && (
                              <span className="text-xs font-normal text-fog-500">(you)</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-fog-500">{m.email}</p>
                        </div>
                      </td>
                      <td className={td}>
                        {m.role === 'admin' ? (
                          <Badge tone="volt"><Crown className="size-3" /> Admin</Badge>
                        ) : (
                          <Badge tone="neutral">User</Badge>
                        )}
                      </td>
                      <td className={`${td} whitespace-nowrap text-fog-400`}>
                        {formatRelative(m.createdAt)}
                      </td>
                      <td className={td}>
                        <div className="flex items-center justify-end gap-1">
                          {m.role === 'user' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setAction({ type: 'promote', member: m })}
                              title="Promote to admin"
                            >
                              <ShieldCheck /> Promote
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAction({ type: 'demote', member: m })}
                              disabled={isCurrentUser}
                              title={isCurrentUser ? "Can't demote yourself" : 'Demote to user'}
                            >
                              <ShieldMinus /> Demote
                            </Button>
                          )}
                          <Button
                            variant="danger-ghost"
                            size="icon-sm"
                            onClick={() => setAction({ type: 'remove', member: m })}
                            disabled={isCurrentUser}
                            aria-label={`Remove ${name}`}
                            title={isCurrentUser ? "Can't remove yourself" : 'Remove user'}
                          >
                            <Trash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} onCreated={() => void refresh()} />

      {action && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setAction(null)}
          tone={action.type === 'remove' ? 'danger' : 'primary'}
          title={
            action.type === 'promote'
              ? `Promote ${('fullName' in action.member ? action.member.fullName : '') || action.member.email}?`
              : action.type === 'demote'
                ? `Demote ${('fullName' in action.member ? action.member.fullName : '') || action.member.email}?`
                : `Remove ${('fullName' in action.member ? action.member.fullName : '') || action.member.email}?`
          }
          description={
            action.type === 'promote'
              ? 'This person will be able to manage teams, matches, leaderboard and tournament settings.'
              : action.type === 'demote'
                ? 'This person will lose admin access and can only view public tournament information.'
                : 'This will permanently delete this user account. They will need to be re-created.'
          }
          confirmLabel={action.type === 'promote' ? 'Promote to admin' : action.type === 'demote' ? 'Demote to user' : 'Remove user'}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
