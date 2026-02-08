import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Crown, ShieldCheck, Sparkles, Swords, TimerReset } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useGames } from '@/hooks/use-games'
import { setPageMeta } from '@/lib/meta'

export const Route = createFileRoute('/')({
  component: IndexRoute,
})

function formatCurrency(value: number | null, currency: string) {
  if (value === null || value === 0) {
    return 'Free'
  }

  try {
    return new Intl.NumberFormat('en-US', { currency, style: 'currency' }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

function IndexRoute() {
  const { user } = useAuth()
  const featuredGames = useGames({
    page: 1,
    pageSize: 6,
    sortBy: 'starting_soonest',
    status: 'pending',
    visibility: 'public',
  })

  useEffect(() => {
    setPageMeta({
      description:
        'Pick one football team per round. If they win, you survive. If they lose or draw, you are out. Last one standing wins.',
      title: 'Guess to Survive | Football survival pools',
      url: window.location.href,
    })
  }, [])

  const games = featuredGames.data?.games ?? []

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),transparent_42%),linear-gradient(225deg,rgba(56,189,248,0.16),transparent_45%)] p-6 shadow-sm backdrop-blur-sm dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.22),transparent_40%),linear-gradient(225deg,rgba(56,189,248,0.22),transparent_42%)] sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:44px_44px] dark:opacity-45 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.25),transparent_62%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18),transparent_62%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-28 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.2),transparent_60%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.16),transparent_60%)]"
        />

        <div className="relative grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              EPL survival pools
            </div>

            <h1 className="font-display mt-4 text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl">
              Survive.
              <span className="text-foreground/70"> Predict.</span> Win.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Pick one team to win each round. If they win, you stay alive. If they lose or draw, you are out. You
              can only use each team once per game.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {user ? (
                <>
                  <PrimaryCta to="/games">
                    Browse games <ArrowRight className="h-4 w-4" />
                  </PrimaryCta>
                  <SecondaryCta to="/games/create">Create a game</SecondaryCta>
                </>
              ) : (
                <>
                  <PrimaryCta to="/auth/signup">
                    Start playing <ArrowRight className="h-4 w-4" />
                  </PrimaryCta>
                  <SecondaryCta to="/games">See public games</SecondaryCta>
                </>
              )}

              <SecondaryCta to="/how-it-works">How it works</SecondaryCta>
            </div>

            <div className="mt-7 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Pill icon={<Swords className="h-3.5 w-3.5" />} label="Lose or draw = out" />
              <Pill icon={<TimerReset className="h-3.5 w-3.5" />} label="Locks at kickoff" />
              <Pill icon={<Crown className="h-3.5 w-3.5" />} label="Last survivor wins" />
              <Pill icon={<ShieldCheck className="h-3.5 w-3.5" />} label="18+ for paid games" />
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 md:[animation-delay:120ms]">
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-background/60 p-5 shadow-sm backdrop-blur sm:p-6">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.2),transparent_45%)] dark:opacity-70"
              />
              <div className="relative space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Example round</p>
                    <p className="font-display mt-2 text-xl font-semibold leading-tight text-foreground">
                      Your pick: Arsenal
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">You cannot use Arsenal again this game.</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Result</p>
                    <p className="font-display mt-1 text-lg font-semibold text-foreground">2-1</p>
                    <p className="text-xs font-medium text-foreground">Survived</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniStat label="Round" value="6" />
                  <MiniStat label="Alive" value="124" />
                  <MiniStat label="Eliminated" value="57" />
                </div>

                <div className="rounded-xl border border-border/70 bg-card/50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">The twist</p>
                  <p className="mt-2 text-sm text-foreground">
                    Your safest pick today becomes your hardest pick tomorrow.
                    <span className="text-muted-foreground"> Every team is a one-time card.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">How it works</p>
          <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            One pick.
            <span className="text-foreground/70"> Real matches.</span> Pure pressure.
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Designed for friend groups and public pools. Play free for practice, or join paid games for winner-takes
            pool prizes.
          </p>
          <div className="pt-2">
            <SecondaryCta to="/how-it-works">
              Read the full guide <ArrowRight className="h-4 w-4" />
            </SecondaryCta>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StepCard
            icon={<Sparkles className="h-5 w-5" />}
            index="01"
            title="Join a pool"
            text="Pick a public game, or create a private one for your group."
          />
          <StepCard
            icon={<TimerReset className="h-5 w-5" />}
            index="02"
            title="Pick before kickoff"
            text="Choose one team to win that round. Change anytime before lock."
          />
          <StepCard
            icon={<Swords className="h-5 w-5" />}
            index="03"
            title="Win = survive"
            text="If your team wins, you advance. Lose or draw and you’re eliminated."
          />
          <StepCard
            icon={<Crown className="h-5 w-5" />}
            index="04"
            title="Last one standing"
            text="Outlast everyone. If multiple survivors remain at the end, the pool splits."
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Featured</p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
              Public games starting soon
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Jump into a pending pool and lock your first pick. Or browse everything in the game browser.
            </p>
          </div>
          <SecondaryCta className="sm:self-end" to="/games">
            Open game browser <ArrowRight className="h-4 w-4" />
          </SecondaryCta>
        </div>

	        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
	          {featuredGames.isLoading ? (
	            Array.from({ length: 6 }).map((_, index) => <FeaturedSkeleton key={index} />)
	          ) : featuredGames.isError ? (
	            <div className="rounded-2xl border border-border bg-card/70 p-6 text-sm text-muted-foreground md:col-span-2 lg:col-span-3">
	              <p className="font-medium text-foreground">Unable to load featured games.</p>
	              <p className="mt-2">
	                {featuredGames.error instanceof Error ? featuredGames.error.message : 'Please try again.'}
	              </p>
	              <div className="mt-4">
	                <SecondaryCta to="/games">Open game browser</SecondaryCta>
	              </div>
	            </div>
	          ) : games.length > 0 ? (
	            games.map((game) => (
	              <Link
	                className="group block"
	                key={game.id}
                params={{ gameId: game.id }}
                search={{}}
                to="/games/$gameId"
              >
                <div className="relative h-full overflow-hidden rounded-2xl border border-border/80 bg-card/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card hover:shadow-md">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 [background-image:radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_88%_76%,rgba(16,185,129,0.18),transparent_42%)]"
                  />
                  <div className="relative flex h-full flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          Code {game.code ?? 'N/A'}
                        </p>
                        <p className="font-display mt-2 line-clamp-2 text-xl font-semibold leading-tight text-foreground">
                          {game.name}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-center backdrop-blur">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Entry</p>
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {formatCurrency(game.entry_fee, game.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <span>Starting round</span>
                        <span className="font-medium text-foreground">{game.starting_round}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Players</span>
                        <span className="font-medium text-foreground">
                          {game.player_count ?? 0} / {game.max_players ?? '∞'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Minimum to start</span>
                        <span className="font-medium text-foreground">{game.min_players}</span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/80 pt-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Pending</p>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                        View <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-border bg-card/70 p-6 text-sm text-muted-foreground md:col-span-2 lg:col-span-3">
              <p className="font-medium text-foreground">No pending public games yet.</p>
              <p className="mt-2">Be the first to create one and share the invite link.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {user ? (
                  <PrimaryCta to="/games/create">
                    Create a game <ArrowRight className="h-4 w-4" />
                  </PrimaryCta>
                ) : (
                  <PrimaryCta to="/auth/signup">
                    Sign up <ArrowRight className="h-4 w-4" />
                  </PrimaryCta>
                )}
                <SecondaryCta to="/games">Browse games</SecondaryCta>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-[linear-gradient(135deg,rgba(251,191,36,0.22),transparent_42%),linear-gradient(225deg,rgba(34,197,94,0.18),transparent_45%)] p-6 shadow-sm dark:bg-[linear-gradient(135deg,rgba(251,191,36,0.18),transparent_42%),linear-gradient(225deg,rgba(34,197,94,0.18),transparent_45%)] sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(90deg,transparent,transparent_18px,rgba(0,0,0,0.07)_19px,rgba(0,0,0,0.07)_20px)] dark:opacity-45 dark:[background-image:repeating-linear-gradient(90deg,transparent,transparent_18px,rgba(255,255,255,0.08)_19px,rgba(255,255,255,0.08)_20px)]"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Ready?</p>
            <h2 className="font-display mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Your first pick is the easiest.
              <span className="text-foreground/70"> Your last pick is the story.</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Create a private pool, invite your group, and start the pressure. Or join a public game and see how
              long you can survive.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <PrimaryCta to="/games/create">
                  Create a pool <ArrowRight className="h-4 w-4" />
                </PrimaryCta>
                <SecondaryCta to="/games">Join a public game</SecondaryCta>
              </>
            ) : (
              <>
                <PrimaryCta to="/auth/signup">
                  Start free <ArrowRight className="h-4 w-4" />
                </PrimaryCta>
                <SecondaryCta to="/auth/login">Login</SecondaryCta>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function PrimaryCta({ children, className, to }: { children: ReactNode; className?: string; to: string }) {
  return (
    <Button
      asChild
      className={`h-10 gap-2 rounded-xl px-5 font-medium shadow-sm transition hover:-translate-y-0.5 ${className ?? ''}`}
      size="sm"
    >
      <Link to={to}>{children}</Link>
    </Button>
  )
}

function SecondaryCta({ children, className, to }: { children: ReactNode; className?: string; to: string }) {
  return (
    <Button
      asChild
      className={`h-10 gap-2 rounded-xl px-5 font-medium ${className ?? ''}`}
      size="sm"
      variant="outline"
    >
      <Link to={to}>{children}</Link>
    </Button>
  )
}

function Pill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/55 px-3 py-1 backdrop-blur">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/55 px-3 py-3 text-center backdrop-blur">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="font-display mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

function StepCard({
  icon,
  index,
  text,
  title,
}: {
  icon: ReactNode
  index: string
  text: string
  title: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/70 p-5 shadow-sm transition hover:border-primary/35 hover:bg-card">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/60 text-foreground">
          {icon}
        </div>
        <p className="font-display text-xs font-semibold tracking-[0.24em] text-muted-foreground">{index}</p>
      </div>
      <p className="font-display mt-4 text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function FeaturedSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-5">
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-muted/60" />
        <div className="h-5 w-3/4 rounded bg-muted/60" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full rounded bg-muted/50" />
        <div className="h-4 w-11/12 rounded bg-muted/50" />
        <div className="h-4 w-2/3 rounded bg-muted/50" />
      </div>
      <div className="mt-6 h-9 w-32 rounded bg-muted/60" />
    </div>
  )
}
