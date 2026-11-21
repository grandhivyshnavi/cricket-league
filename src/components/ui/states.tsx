import { CircleExclamationPoint, LoaderCircle, RefreshCw, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-control', className)} aria-hidden />
}

export function Spinner({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center justify-center gap-3 text-sm text-fog-400', className)}>
      <LoaderCircle className="size-5 animate-spin text-volt-400" aria-hidden />
      <span>{label}</span>
    </div>
  )
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-white/10 bg-white/[0.015] px-6 py-14 text-center',
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-2xl border border-volt-400/20 bg-volt-400/10 text-volt-400">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-5 font-heading text-lg text-fog-50">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-fog-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-danger-500/20 bg-danger-500/[0.04] px-6 py-12 text-center',
        className,
      )}
    >
      <CircleExclamationPoint className="size-6 text-danger-400" aria-hidden />
      <p className="mt-4 font-heading text-lg text-fog-50">We couldn't load this right now</p>
      <p className="mt-1.5 max-w-sm text-sm text-fog-400">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-6" onClick={onRetry}>
          <RefreshCw /> Try again
        </Button>
      )}
    </div>
  )
}
