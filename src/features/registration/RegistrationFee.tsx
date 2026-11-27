import { IndianRupee } from 'lucide-react'
import { REGISTRATION_FEE } from '@/config/site'

export function RegistrationFee() {
  return (
    <div className="flex items-center gap-3 rounded-card border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <span className="grid size-8 place-items-center rounded-lg border border-volt-400/20 bg-volt-400/10 text-volt-400">
        <IndianRupee className="size-4" aria-hidden />
      </span>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-fog-500">Registration Fee</span>
        <span className="font-heading text-lg tabular-nums text-volt-300">{REGISTRATION_FEE}</span>
      </div>
    </div>
  )
}
