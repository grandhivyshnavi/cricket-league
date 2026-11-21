import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

interface DialogContentProps {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Hides the visual header while keeping it accessible (e.g. video player). */
  bare?: boolean
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-5xl' }

export function DialogContent({ title, description, children, className, size = 'md', bare }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm data-[state=open]:animate-overlay-in" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-panel surface focus:outline-none data-[state=open]:animate-dialog-in',
          bare ? 'p-0' : 'p-6 sm:p-8',
          sizes[size],
          className,
        )}
      >
        <div className={cn(bare ? 'sr-only' : 'mb-6 pr-10')}>
          <DialogPrimitive.Title className="font-heading text-xl text-fog-50 sm:text-2xl">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-fog-400">
              {description}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          )}
        </div>
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full border border-white/10 bg-ink-900/80 text-fog-300 transition-colors hover:border-volt-400/40 hover:text-fog-50"
          aria-label="Close"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)}>{children}</div>
  )
}
