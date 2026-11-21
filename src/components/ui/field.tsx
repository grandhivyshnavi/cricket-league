import { ChevronDown } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const control =
  'w-full rounded-control border border-white/10 bg-ink-900/80 text-sm text-fog-50 placeholder:text-fog-500 transition-[border-color,box-shadow] duration-200 hover:border-white/20 focus:border-volt-400/60 focus:outline-none focus:ring-4 focus:ring-volt-400/10 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger-400/70'

interface FieldProps {
  id: string
  label: string
  hint?: ReactNode
  error?: string | null
  optional?: boolean
  children: ReactNode
  className?: string
}

export function Field({ id, label, hint, error, optional, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-[13px] font-semibold text-fog-200">
        {label}
        {optional && <span className="text-[11px] font-medium text-fog-500">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger-400">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs leading-relaxed text-fog-500">{hint}</p>
      )}
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-11 px-3.5', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-24 resize-y px-3.5 py-3 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(control, 'h-11 cursor-pointer appearance-none pl-3.5 pr-10', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-fog-400" />
    </div>
  )
}
