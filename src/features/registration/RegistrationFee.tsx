import { REGISTRATION_FEE } from '@/config/site'

export function RegistrationFee() {
  return (
    <div className="text-right">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-fog-500">
        Registration Fee
      </p>
      <p
        className="mt-1 font-heading text-[1.75rem] tabular-nums leading-none text-volt-400 sm:text-[2rem]"
        style={{ textShadow: '0 0 20px rgba(195,240,60,0.35)' }}
      >
        {REGISTRATION_FEE}
      </p>
    </div>
  )
}
