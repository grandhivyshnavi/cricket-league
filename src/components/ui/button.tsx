import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-[-0.005em] transition-[transform,background-color,box-shadow,color,border-color] duration-300 ease-out-expo active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-volt-400 text-ink-950 shadow-glow-sm hover:-translate-y-px hover:bg-volt-300 hover:shadow-glow',
        secondary:
          'border border-white/10 bg-white/[0.04] text-fog-50 backdrop-blur-md hover:-translate-y-px hover:border-volt-400/35 hover:bg-white/[0.07]',
        ghost: 'text-fog-300 hover:bg-white/[0.06] hover:text-fog-50',
        danger: 'bg-danger-500 text-white hover:bg-danger-400',
        'danger-ghost': 'text-fog-400 hover:bg-danger-500/10 hover:text-danger-400',
      },
      size: {
        sm: 'h-9 px-4 text-[13px] [&_svg]:size-4',
        md: 'h-11 px-5 text-sm [&_svg]:size-4',
        lg: 'h-13 px-7 text-[15px] [&_svg]:size-[18px]',
        icon: 'size-10 [&_svg]:size-[18px]',
        'icon-sm': 'size-8 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type Variants = VariantProps<typeof buttonVariants>

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, Variants {
  loading?: boolean
}

export function Button({ className, variant, size, loading, disabled, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function ButtonLink({ className, variant, size, ...props }: LinkProps & Variants) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

/** Arrow that nudges forward on button hover. */
export const arrowNudge = 'transition-transform duration-300 ease-out-expo group-hover/btn:translate-x-0.5'
