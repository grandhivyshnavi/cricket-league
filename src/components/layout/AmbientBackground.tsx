/** Fixed, GPU-friendly ambient lighting behind every page. */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -top-[22rem] left-1/2 h-[46rem] w-[80rem] -translate-x-1/2 animate-drift bg-[radial-gradient(closest-side,rgb(195_240_60/0.13),transparent)]" />
      <div className="absolute -right-64 top-[40%] h-[40rem] w-[40rem] bg-[radial-gradient(closest-side,rgb(195_240_60/0.06),transparent)]" />
      <div className="absolute -left-72 bottom-0 h-[36rem] w-[36rem] bg-[radial-gradient(closest-side,rgb(195_240_60/0.05),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.022)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.022)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_30%,transparent_100%)]" />
    </div>
  )
}
