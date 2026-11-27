import { IndianRupee } from 'lucide-react'
import { REGISTRATION_FEE } from '@/config/site'

export function RegistrationFee() {
  return (
    <div className="inline-flex flex-col items-center gap-3 rounded-2xl border border-volt-400/15 bg-white/[0.02] px-8 py-5 backdrop-blur-sm">
      <span className="grid size-10 place-items-center rounded-full border border-volt-400/20 bg-volt-400/[0.07]">
        <IndianRupee className="size-4.5 text-volt-400" aria-hidden />
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-fog-500">
        Registration Fee
      </span>
      <span className="font-heading text-2xl tabular-nums leading-none text-volt-300">
        {REGISTRATION_FEE}
      </span>
    </div>
  )
}
