import { motion } from 'framer-motion'
import { useId } from 'react'
import { cn } from '@/lib/utils'

interface Option<T extends string> {
  value: T
  label: string
  count?: number
}

interface SegmentedProps<T extends string> {
  value: T
  onChange(value: NoInfer<T>): void
  options: Option<NoInfer<T>>[]
  label: string
  className?: string
}

export function Segmented<T extends string>({ value, onChange, options, label, className }: SegmentedProps<T>) {
  const id = useId()
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/[0.07] bg-white/[0.025] p-1',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors duration-300',
              active ? 'text-ink-950' : 'text-fog-400 hover:text-fog-50',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-volt-400"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
            {o.count !== undefined && (
              <span
                className={cn(
                  'relative rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                  active ? 'bg-ink-950/15 text-ink-950' : 'bg-white/[0.06] text-fog-400',
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
