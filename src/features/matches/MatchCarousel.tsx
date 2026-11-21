import { useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Match } from '@/types/domain'
import { MatchCard } from './MatchCard'

const GAP_PX = 20

export function useCarousel(itemCount: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({ prev: false, next: false })
  const reduceMotion = useReducedMotion()

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setState({ prev: el.scrollLeft > 4, next: el.scrollLeft < max - 4 })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update, itemCount])

  const scroll = useCallback(
    (dir: 1 | -1) => {
      const el = ref.current
      const card = el?.firstElementChild as HTMLElement | null
      if (!el || !card) return
      el.scrollBy({ left: dir * (card.offsetWidth + GAP_PX), behavior: reduceMotion ? 'auto' : 'smooth' })
    },
    [reduceMotion],
  )

  return { ref, canPrev: state.prev, canNext: state.next, scroll }
}

export function CarouselControls({
  canPrev,
  canNext,
  onScroll,
  label,
}: {
  canPrev: boolean
  canNext: boolean
  onScroll(dir: 1 | -1): void
  label: string
}) {
  const btn =
    'grid size-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-fog-50 transition-[border-color,background-color,color,opacity] duration-300 hover:border-volt-400/45 hover:bg-volt-400/10 hover:text-volt-300 disabled:pointer-events-none disabled:opacity-30'
  return (
    <div className="flex items-center gap-2" role="group" aria-label={`${label} navigation`}>
      <button type="button" className={btn} onClick={() => onScroll(-1)} disabled={!canPrev} aria-label={`Previous ${label}`}>
        <ChevronLeft className="size-5" />
      </button>
      <button type="button" className={btn} onClick={() => onScroll(1)} disabled={!canNext} aria-label={`Next ${label}`}>
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}

export function MatchTrack({ matches, carousel }: { matches: Match[]; carousel: ReturnType<typeof useCarousel> }) {
  return (
    <div className="relative">
      <div
        ref={carousel.ref}
        className="no-scrollbar -my-3 grid snap-x snap-mandatory auto-cols-[86%] grid-flow-col gap-5 overflow-x-auto overscroll-x-contain py-3 sm:auto-cols-[calc((100%-1.25rem)/2)] lg:auto-cols-[calc((100%-2.5rem)/3)]"
        tabIndex={0}
        aria-label="Upcoming matches"
      >
        {matches.map((m) => (
          <div key={m.id} className="snap-start">
            <MatchCard match={m} />
          </div>
        ))}
      </div>
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-ink-950 to-transparent transition-opacity duration-300 lg:hidden',
          carousel.canNext ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden
      />
    </div>
  )
}
