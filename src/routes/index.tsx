import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexRoute,
})

function IndexRoute() {
  return (
    <section className="w-full rounded-xl border border-border bg-card/70 p-8">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Setup</p>
      <h1 className="mt-3 text-3xl font-semibold text-card-foreground">Guess to Survive</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Foundation is ready. Authentication and Supabase integration are in place, and the next
        step is building core game flows.
      </p>
    </section>
  )
}
