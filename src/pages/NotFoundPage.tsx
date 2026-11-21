import { ArrowLeft } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { ROUTES } from '@/config/site'

export default function NotFoundPage() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-poster text-[7rem] leading-none text-volt-400 text-glow sm:text-[10rem]">404</p>
      <h1 className="mt-4 font-heading text-2xl uppercase text-fog-50 sm:text-3xl">Out of the ground</h1>
      <p className="mt-3 max-w-sm text-fog-400">The page you're looking for has been hit for six. Let's get you back to the action.</p>
      <ButtonLink to={ROUTES.home} className="mt-8" variant="secondary">
        <ArrowLeft /> Back to home
      </ButtonLink>
    </section>
  )
}
