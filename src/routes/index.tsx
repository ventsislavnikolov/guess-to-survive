import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Crown,
  ShieldCheck,
  Sparkles,
  Swords,
  TimerReset,
} from "lucide-react";
import { type ReactNode, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  formatExampleLeagueBadge,
  formatExamplePickHeadline,
  formatExamplePickHelper,
  useExampleRoundSnapshot,
} from "@/hooks/use-example-round";
import { useGames } from "@/hooks/use-games";
import { setPageMeta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

const FEATURED_SKELETON_KEYS = [
  "featured-skeleton-1",
  "featured-skeleton-2",
  "featured-skeleton-3",
  "featured-skeleton-4",
  "featured-skeleton-5",
  "featured-skeleton-6",
];

function formatCurrency(value: number | null, currency: string) {
  if (value === null || value === 0) {
    return "Free";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      style: "currency",
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function IndexRoute() {
  const { user } = useAuth();
  const exampleRound = useExampleRoundSnapshot();
  const featuredGames = useGames({
    page: 1,
    pageSize: 6,
    sortBy: "starting_soonest",
    status: "pending",
    visibility: "public",
  });

  useEffect(() => {
    setPageMeta({
      description:
        "Pick one football team per round. If they win, you survive. If they lose or draw, you are out. Last one standing wins.",
      title: "Guess to Survive | Football survival pools",
      url: window.location.href,
    });
  }, []);

  const games = featuredGames.data?.games ?? [];
  const example = exampleRound.data;

  const heroLeagueBadge = formatExampleLeagueBadge(example?.league ?? null);
  const examplePickHeadline = example
    ? formatExamplePickHeadline(example.pickTeam)
    : "Example pick";
  const examplePickHelper = example
    ? formatExamplePickHelper(example.pickTeam)
    : "This preview updates automatically from real fixtures.";
  const exampleScoreline = example?.resultScoreline ?? "—";
  let exampleOutcome = "TBD";
  if (example) {
    exampleOutcome = example.outcomeLabel;
  } else if (exampleRound.isLoading) {
    exampleOutcome = "Loading";
  }

  const kickoffLabel = (() => {
    if (!example?.kickoffTime) {
      return "—";
    }

    try {
      const kickoffDate = new Date(example.kickoffTime);
      if (!Number.isFinite(kickoffDate.getTime())) {
        return "—";
      }

      return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
      }).format(kickoffDate);
    } catch {
      return "—";
    }
  })();

  let featuredGridContent: ReactNode;
  if (featuredGames.isLoading) {
    featuredGridContent = FEATURED_SKELETON_KEYS.map((key) => (
      <FeaturedSkeleton key={key} />
    ));
  } else if (featuredGames.isError) {
    featuredGridContent = (
      <div className="rounded-2xl border border-border bg-card/70 p-6 text-muted-foreground text-sm md:col-span-2 lg:col-span-3">
        <p className="font-medium text-foreground">
          Unable to load featured games.
        </p>
        <p className="mt-2">
          {featuredGames.error instanceof Error
            ? featuredGames.error.message
            : "Please try again."}
        </p>
        <div className="mt-4">
          <SecondaryCta to="/games">Open game browser</SecondaryCta>
        </div>
      </div>
    );
  } else if (games.length > 0) {
    featuredGridContent = games.map((game) => (
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
            className="pointer-events-none absolute inset-0 opacity-0 transition [background-image:radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_88%_76%,rgba(16,185,129,0.18),transparent_42%)] group-hover:opacity-100"
          />
          <div className="relative flex h-full flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.22em]">
                  Code {game.code ?? "N/A"}
                </p>
                <p className="mt-2 line-clamp-2 font-display font-semibold text-foreground text-xl leading-tight">
                  {game.name}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-center backdrop-blur">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.22em]">
                  Entry
                </p>
                <p className="mt-1 font-semibold text-foreground text-xs">
                  {formatCurrency(game.entry_fee, game.currency)}
                </p>
              </div>
            </div>

            <div className="grid gap-2 text-muted-foreground text-sm">
              <div className="flex items-center justify-between gap-3">
                <span>Starting round</span>
                <span className="font-medium text-foreground">
                  {game.starting_round}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Players</span>
                <span className="font-medium text-foreground">
                  {game.player_count ?? 0} / {game.max_players ?? "∞"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Minimum to start</span>
                <span className="font-medium text-foreground">
                  {game.min_players}
                </span>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 border-border/80 border-t pt-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.22em]">
                Pending
              </p>
              <span className="inline-flex items-center gap-2 font-medium text-foreground text-sm">
                View{" "}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    ));
  } else {
    featuredGridContent = (
      <div className="rounded-2xl border border-border bg-card/70 p-6 text-muted-foreground text-sm md:col-span-2 lg:col-span-3">
        <p className="font-medium text-foreground">
          No pending public games yet.
        </p>
        <p className="mt-2">
          Be the first to create one and share the invite link.
        </p>
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
    );
  }

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),transparent_42%),linear-gradient(225deg,rgba(56,189,248,0.16),transparent_45%)] p-6 shadow-sm backdrop-blur-sm sm:p-10 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.22),transparent_40%),linear-gradient(225deg,rgba(56,189,248,0.22),transparent_42%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:44px_44px] dark:opacity-45 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.25),transparent_62%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18),transparent_62%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -bottom-32 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.2),transparent_60%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.16),transparent_60%)]"
        />

        <div className="relative grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="fade-in slide-in-from-bottom-4 animate-in duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[11px] text-muted-foreground uppercase tracking-[0.22em] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {heroLeagueBadge}
            </div>

            <h1 className="mt-4 font-display font-semibold text-4xl text-foreground leading-[1.05] sm:text-5xl">
              Survive.
              <span className="text-foreground/70"> Predict.</span> Win.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Pick one team to win each round. If they win, you stay alive. If
              they lose or draw, you are out. You can only use each team once
              per game.
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

            <div className="mt-7 flex flex-wrap gap-2 text-muted-foreground text-xs">
              <Pill
                icon={<Swords className="h-3.5 w-3.5" />}
                label="Lose or draw = out"
              />
              <Pill
                icon={<TimerReset className="h-3.5 w-3.5" />}
                label="Locks at kickoff"
              />
              <Pill
                icon={<Crown className="h-3.5 w-3.5" />}
                label="Last survivor wins"
              />
              <Pill
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
                label="18+ for paid games"
              />
            </div>
          </div>

          <div className="fade-in slide-in-from-bottom-4 animate-in duration-700 md:[animation-delay:120ms]">
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-background/60 p-5 shadow-sm backdrop-blur sm:p-6">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.2),transparent_45%)] dark:opacity-70"
              />
              <div className="relative space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.22em]">
                      Example round
                    </p>
                    <p className="mt-2 font-display font-semibold text-foreground text-xl leading-tight">
                      {examplePickHeadline}
                    </p>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {examplePickHelper}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.22em]">
                      Result
                    </p>
                    <p className="mt-1 font-display font-semibold text-foreground text-lg">
                      {exampleScoreline}
                    </p>
                    <p className="font-medium text-foreground text-xs">
                      {exampleOutcome}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniStat
                    label="Round"
                    value={example ? `${example.round}` : "—"}
                  />
                  <MiniStat label="Kickoff" value={kickoffLabel} />
                  <MiniStat
                    label="League"
                    value={example?.league?.code ?? "—"}
                  />
                </div>

                <div className="rounded-xl border border-border/70 bg-card/50 p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.22em]">
                    The twist
                  </p>
                  <p className="mt-2 text-foreground text-sm">
                    Your safest pick today becomes your hardest pick tomorrow.
                    <span className="text-muted-foreground">
                      {" "}
                      Every team is a one-time card.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.22em]">
            How it works
          </p>
          <h2 className="font-display font-semibold text-3xl text-foreground leading-tight sm:text-4xl">
            One pick.
            <span className="text-foreground/70"> Real matches.</span> Pure
            pressure.
          </h2>
          <p className="max-w-xl text-muted-foreground text-sm sm:text-base">
            Designed for friend groups and public pools. Play free for practice,
            or join paid games for winner-takes pool prizes.
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
            text="Pick a public game, or create a private one for your group."
            title="Join a pool"
          />
          <StepCard
            icon={<TimerReset className="h-5 w-5" />}
            index="02"
            text="Choose one team to win that round. Change anytime before lock."
            title="Pick before kickoff"
          />
          <StepCard
            icon={<Swords className="h-5 w-5" />}
            index="03"
            text="If your team wins, you advance. Lose or draw and you’re eliminated."
            title="Win = survive"
          />
          <StepCard
            icon={<Crown className="h-5 w-5" />}
            index="04"
            text="Outlast everyone. If multiple survivors remain at the end, the pool splits."
            title="Last one standing"
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-[0.22em]">
              Featured
            </p>
            <h2 className="mt-2 font-display font-semibold text-3xl text-foreground sm:text-4xl">
              Public games starting soon
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm sm:text-base">
              Jump into a pending pool and lock your first pick. Or browse
              everything in the game browser.
            </p>
          </div>
          <SecondaryCta className="sm:self-end" to="/games">
            Open game browser <ArrowRight className="h-4 w-4" />
          </SecondaryCta>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featuredGridContent}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-[linear-gradient(135deg,rgba(251,191,36,0.22),transparent_42%),linear-gradient(225deg,rgba(34,197,94,0.18),transparent_45%)] p-6 shadow-sm sm:p-10 dark:bg-[linear-gradient(135deg,rgba(251,191,36,0.18),transparent_42%),linear-gradient(225deg,rgba(34,197,94,0.18),transparent_45%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(90deg,transparent,transparent_18px,rgba(0,0,0,0.07)_19px,rgba(0,0,0,0.07)_20px)] dark:opacity-45 dark:[background-image:repeating-linear-gradient(90deg,transparent,transparent_18px,rgba(255,255,255,0.08)_19px,rgba(255,255,255,0.08)_20px)]"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.22em]">
              Ready?
            </p>
            <h2 className="mt-3 font-display font-semibold text-3xl text-foreground leading-tight sm:text-4xl">
              Your first pick is the easiest.
              <span className="text-foreground/70">
                {" "}
                Your last pick is the story.
              </span>
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              Create a private pool, invite your group, and start the pressure.
              Or join a public game and see how long you can survive.
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
  );
}

function PrimaryCta({
  children,
  className,
  to,
}: {
  children: ReactNode;
  className?: string;
  to: string;
}) {
  return (
    <Button
      asChild
      className={`h-10 gap-2 rounded-xl px-5 font-medium shadow-sm transition hover:-translate-y-0.5 ${className ?? ""}`}
      size="sm"
    >
      <Link to={to}>{children}</Link>
    </Button>
  );
}

function SecondaryCta({
  children,
  className,
  to,
}: {
  children: ReactNode;
  className?: string;
  to: string;
}) {
  return (
    <Button
      asChild
      className={`h-10 gap-2 rounded-xl px-5 font-medium ${className ?? ""}`}
      size="sm"
      variant="outline"
    >
      <Link to={to}>{children}</Link>
    </Button>
  );
}

function Pill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/55 px-3 py-1 backdrop-blur">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/55 px-3 py-3 text-center backdrop-blur">
      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.22em]">
        {label}
      </p>
      <p className="mt-1 font-display font-semibold text-foreground text-lg">
        {value}
      </p>
    </div>
  );
}

function StepCard({
  icon,
  index,
  text,
  title,
}: {
  icon: ReactNode;
  index: string;
  text: string;
  title: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/70 p-5 shadow-sm transition hover:border-primary/35 hover:bg-card">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition hover:opacity-100"
      />
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/60 text-foreground">
          {icon}
        </div>
        <p className="font-display font-semibold text-muted-foreground text-xs tracking-[0.24em]">
          {index}
        </p>
      </div>
      <p className="mt-4 font-display font-semibold text-foreground text-lg">
        {title}
      </p>
      <p className="mt-2 text-muted-foreground text-sm">{text}</p>
    </div>
  );
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
  );
}
