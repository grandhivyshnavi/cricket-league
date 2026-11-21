import type { ReactNode } from 'react'
import { Eyebrow } from '@/components/ui/badge'
import { Reveal } from '@/components/ui/reveal'

interface PageHeaderProps {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <section className="container-page pb-10 pt-12 sm:pt-16 lg:pb-14 lg:pt-20">
      <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-5 font-poster text-[3rem] uppercase leading-[0.9] text-fog-50 sm:text-7xl lg:text-[5.5rem]">
            {title}
          </h1>
          {description && <p className="mt-6 max-w-xl text-base leading-relaxed text-fog-400">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </Reveal>
    </section>
  )
}
