import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AdminPanel({ title, description, actions, children, className }: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('overflow-hidden rounded-panel surface', className)}>
      <header className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <h2 className="font-heading text-lg uppercase text-fog-50">{title}</h2>
          {description && <p className="mt-1 text-sm text-fog-400">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  )
}

export const th = 'px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-fog-500 first:pl-5 last:pr-5 sm:first:pl-7 sm:last:pr-7'
export const td = 'px-4 py-4 align-middle text-sm first:pl-5 last:pr-5 sm:first:pl-7 sm:last:pr-7'
export const tr = 'border-t border-white/[0.04] transition-colors hover:bg-white/[0.015]'
