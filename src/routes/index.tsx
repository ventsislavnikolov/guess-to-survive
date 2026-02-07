import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexRoute,
})

function IndexRoute() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <section className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900/70 p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Setup</p>
        <h1 className="mt-3 text-3xl font-semibold">Guess to Survive</h1>
        <p className="mt-2 text-slate-300">Vite, TanStack Router, and Tailwind are configured.</p>
      </section>
    </main>
  )
}
