import { CalendarDays, Play } from 'lucide-react'
import { useState } from 'react'
import { StadiumScene } from '@/components/brand/StadiumScene'
import { Eyebrow } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Reveal } from '@/components/ui/reveal'
import { EXCITEMENT_FEATURES, TOURNAMENT_INTRO } from '@/config/content'
import { TOURNAMENT } from '@/config/site'
import { formatDateRange } from '@/lib/datetime'
import { resolveVideoSource } from '@/lib/video'
import { useTournament } from '@/state/TournamentProvider'

export function TournamentInfo() {
  const { settings } = useTournament()
  const [playing, setPlaying] = useState(false)
  const video = resolveVideoSource(settings.promoVideoUrl)
  const range = formatDateRange(settings.startDate, settings.endDate)

  return (
    <section className="container-page section-y" aria-labelledby="excitement-title">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <Reveal>
          <div className="group relative overflow-hidden rounded-panel border border-white/[0.07] shadow-card">
            <StadiumScene className="aspect-[4/3.2] w-full transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.02]" />
            {video && (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="absolute left-1/2 top-[62%] grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-volt-400 text-ink-950 shadow-glow transition-transform duration-500 ease-out-expo hover:scale-110"
                aria-label="Play tournament video"
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-volt-400/40 [animation-duration:2.4s]" />
                <Play className="relative ml-1 size-7 fill-current" />
              </button>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 sm:bottom-6 sm:left-6 sm:right-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-950/60 px-3.5 py-2 text-xs font-semibold text-fog-100 backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-volt-400" /> {TOURNAMENT.shortName}
              </span>
              {range && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-950/60 px-3.5 py-2 text-xs font-semibold text-fog-300 backdrop-blur-md">
                  <CalendarDays className="size-3.5 text-volt-400" /> {range}
                </span>
              )}
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <Eyebrow>{TOURNAMENT_INTRO.eyebrow}</Eyebrow>
            <h2 id="excitement-title" className="mt-4 font-heading text-[2rem] uppercase leading-[0.95] text-fog-50 sm:text-[2.75rem]">
              {TOURNAMENT_INTRO.title}
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-fog-400">{TOURNAMENT_INTRO.body}</p>
          </Reveal>
          <ul className="mt-10 space-y-3">
            {EXCITEMENT_FEATURES.map(({ title, description, icon: Icon }, i) => (
              <li key={title}>
                <Reveal delay={0.08 * (i + 1)}>
                  <div className="group flex items-start gap-5 rounded-card border border-transparent p-4 transition-colors duration-500 hover:border-white/[0.06] hover:bg-white/[0.02] sm:-mx-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-volt-400/20 bg-volt-400/10 text-volt-400 transition-shadow duration-500 group-hover:shadow-glow-sm">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-heading text-lg text-fog-50">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-fog-400">{description}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {video && (
        <Dialog open={playing} onOpenChange={setPlaying}>
          <DialogContent title="Tournament video" size="xl" bare className="overflow-hidden bg-black">
            <div className="aspect-video w-full">
              {playing &&
                (video.kind === 'embed' ? (
                  <iframe
                    src={video.src}
                    title="Tournament video"
                    className="size-full"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <video src={video.src} className="size-full" controls autoPlay playsInline />
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  )
}
