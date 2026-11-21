import type { LucideIcon } from 'lucide-react'
import { Activity, Gift, Tv } from 'lucide-react'

/**
 * Static marketing copy. Tournament data (teams, fixtures, stats) lives in the
 * database; only presentational copy that rarely changes belongs here.
 */
export interface FeatureItem {
  title: string
  description: string
  icon: LucideIcon
}

export const EXCITEMENT_FEATURES: FeatureItem[] = [
  {
    title: 'Live Streaming',
    description: 'Catch every ball of the festive-season showdown live, wherever you are.',
    icon: Tv,
  },
  {
    title: 'Real-Time Stats',
    description: 'Standings, fixtures and results updated by the organisers as the action unfolds.',
    icon: Activity,
  },
  {
    title: 'Exclusive Rewards',
    description: 'Compete for the championship trophy, prize pool and season honours.',
    icon: Gift,
  },
]

export const TOURNAMENT_INTRO = {
  eyebrow: 'The Tournament',
  title: 'Feel the Excitement',
  body: 'From packed grounds to last-over thrillers — the Sankranthi Special Cricket League brings the festive spirit to every boundary, wicket and celebration.',
}

export const JOIN_CTA = {
  eyebrow: 'Registrations',
  titleLead: 'Ready for the',
  titleAccent: 'Challenge?',
  body: 'Assemble your squad, take the field this Sankranthi and chase the trophy. Your journey to the title starts here.',
}
