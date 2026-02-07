import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexRoute,
})

function IndexRoute() {
  return (
    <section className="w-full rounded-xl border border-slate-800 bg-slate-900/70 p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Setup</p>
        <h1 className="mt-3 text-3xl font-semibold">Guess to Survive</h1>
      <p className="mt-2 max-w-2xl text-slate-300">
        Foundation is ready. Authentication and Supabase integration are in place, and the next
        step is building core game flows.
      </p>
    </section>
  )
}
