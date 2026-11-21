import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Eyebrow } from './badge'

interface SectionHeadingProps {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
  as?: 'h1' | 'h2'
}

export function SectionHeading({ eyebrow, title, description, actions, className, as: Tag = 'h2' }: SectionHeadingProps) {
  return (
    <div className={cn('flex flex-col gap-6 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Tag className="mt-4 font-heading text-[2rem] uppercase leading-[0.95] text-fog-50 sm:text-[2.75rem]">
          {title}
        </Tag>
        {description && <p className="mt-4 text-[15px] leading-relaxed text-fog-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
