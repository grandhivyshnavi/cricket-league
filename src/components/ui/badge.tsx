import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase leading-none tracking-[0.12em]',
  {
    variants: {
      tone: {
        volt: 'border-volt-400/25 bg-volt-400/10 text-volt-300',
        neutral: 'border-white/10 bg-white/[0.04] text-fog-300',
        live: 'border-volt-400/30 bg-volt-400/15 text-volt-200',
        gold: 'border-gold-400/30 bg-gold-400/10 text-gold-400',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-volt-400',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-volt-400 shadow-[0_0_10px_2px_rgb(195_240_60/0.6)]" aria-hidden />
      {children}
    </span>
  )
}
