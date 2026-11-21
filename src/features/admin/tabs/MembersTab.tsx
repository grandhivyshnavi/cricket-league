import { Crown, ShieldCheck, ShieldMinus, Trash, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/states'
import { isDemoMode } from '@/data'
import {
  getDemoMembers,
  promoteDemoMember,
  demoteDemoMember,
  removeDemoMember,
  type DemoMember,
} from '@/data/demo/demoAuth'
import { formatRelative } from '@/lib/datetime'
import { useAuth } from '@/state/AuthProvider'
import { AdminPanel, td, th, tr } from '../ui'

interface MemberAction {
  type: 'promote' | 'demote' | 'remove'
  member: DemoMember
}

export function MembersTab() {
  const { user } = useAuth()
  const [members, setMembers] = useState<DemoMember[]>([])
  const [action, setAction] = useState<MemberAction | null>(null)

  const refresh = useCallback(() => {
    if (isDemoMode) setMembers(getDemoMembers())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleConfirm = async () => {
    if (!action) return
    const { type, member } = action
    if (type === 'promote') {
      promoteDemoMember(member.id)
      toast.success(`${member.fullName || member.email} promoted to admin`)
    } else if (type === 'demote') {
      demoteDemoMember(member.id)
      toast.success(`${member.fullName || member.email} demoted to user`)
    } else {
      removeDemoMember(member.id)
      toast.success(`${member.fullName || member.email} removed`)
    }
    refresh()
  }

  const admins = members.filter((m) => m.role === 'admin')
  const users = members.filter((m) => m.role === 'user')
  const sorted = [...admins, ...users]

  return (
    <>
      <AdminPanel
        title="Members"
        description={`${members.length} registered member${members.length === 1 ? '' : 's'} (excluding the built-in demo admin)`}
      >
        {!isDemoMode ? (
          <div className="px-5 py-10 text-center sm:px-7">
            <p className="text-sm text-fog-400">
              Member management requires Supabase. In production, use the Supabase dashboard or SQL
              editor to manage profiles and roles.
            </p>
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members yet"
            description="Admin accounts are pre-configured. Use the Supabase dashboard or database to add management members."
            className="m-5 border-0"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem]">
              <thead>
                <tr>
                  <th className={th}>Member</th>
                  <th className={th}>Role</th>
                  <th className={th}>Joined</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => {
                  const isCurrentUser = m.id === user?.id
                  return (
                    <tr key={m.id} className={tr}>
                      <td className={td}>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate font-semibold text-fog-50">
                            {m.fullName || m.email}
                            {isCurrentUser && (
                              <span className="text-xs font-normal text-fog-500">(you)</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-fog-500">{m.email}</p>
                        </div>
                      </td>
                      <td className={td}>
                        {m.role === 'admin' ? (
                          <Badge tone="volt">
                            <Crown className="size-3" /> Admin
                          </Badge>
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
                            aria-label={`Remove ${m.fullName || m.email}`}
                            title={isCurrentUser ? "Can't remove yourself" : 'Remove member'}
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

      {action && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setAction(null)}
          tone={action.type === 'remove' ? 'danger' : 'primary'}
          title={
            action.type === 'promote'
              ? `Promote ${action.member.fullName || action.member.email}?`
              : action.type === 'demote'
                ? `Demote ${action.member.fullName || action.member.email}?`
                : `Remove ${action.member.fullName || action.member.email}?`
          }
          description={
            action.type === 'promote'
              ? 'This person will be able to manage teams, matches, leaderboard and tournament settings.'
              : action.type === 'demote'
                ? 'This person will lose admin access and can only view public tournament information.'
                : 'This will permanently remove this member. They will need to sign up again.'
          }
          confirmLabel={action.type === 'promote' ? 'Promote to admin' : action.type === 'demote' ? 'Demote to user' : 'Remove member'}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
