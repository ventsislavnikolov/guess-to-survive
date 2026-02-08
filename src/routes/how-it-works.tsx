import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Check, Crown, ShieldCheck, Swords, TimerReset } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { setPageMeta } from '@/lib/meta'

export const Route = createFileRoute('/how-it-works')({
  component: HowItWorksPage,
})

function HowItWorksPage() {
  const { user } = useAuth()

  useEffect(() => {
    setPageMeta({
      description:
        'Learn how Guess to Survive works: join a game, pick one team per round, survive on wins, get eliminated on losses or draws.',
      title: 'How it works | Guess to Survive',
      url: window.location.href,
    })
  }, [])

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-[linear-gradient(135deg,rgba(56,189,248,0.18),transparent_40%),linear-gradient(225deg,rgba(16,185,129,0.18),transparent_42%)] p-6 shadow-sm dark:bg-[linear-gradient(135deg,rgba(56,189,248,0.22),transparent_40%),linear-gradient(225deg,rgba(16,185,129,0.22),transparent_42%)] sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:44px_44px] dark:opacity-45 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]"
        />

        <div className="relative">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Guide</p>
          <h1 className="font-display mt-4 text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl">
            How Guess to Survive works
          </h1>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
            This is a football survival game built on real fixtures. The rules are simple. The decisions are not.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild className="h-10 rounded-xl px-5" size="sm" variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
            <Button asChild className="h-10 gap-2 rounded-xl px-5 shadow-sm" size="sm">
              <Link to="/games">
                Browse games <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Pill icon={<TimerReset className="h-3.5 w-3.5" />} label="Locks at kickoff" />
            <Pill icon={<Swords className="h-3.5 w-3.5" />} label="Lose or draw = out" />
            <Pill icon={<Crown className="h-3.5 w-3.5" />} label="Last survivor wins" />
            <Pill icon={<ShieldCheck className="h-3.5 w-3.5" />} label="18+ for paid games" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Step
          index="01"
          title="Join a game"
          text="Pick a public pool from the game browser, or create a private pool for your group and share the invite."
        />
        <Step
          index="02"
          title="Pick one team to win"
          text="Each round you pick one team that is playing that round. You can change your pick any time before the round locks."
        />
        <Step
          index="03"
          title="Kickoff locks the round"
          text="At the first match kickoff, picks lock. If you didn’t pick, the system will auto-assign a team for you (if available)."
        />
        <Step
          index="04"
          title="Win = survive. Lose or draw = eliminated"
          text="If your chosen team wins their match, you advance. If they lose or draw, you’re out."
        />
        <Step
          index="05"
          title="No repeats"
          text="Once you use a team in a game, you can’t pick that team again in that same game. Every round gets harder."
        />
        <Step
          index="06"
          title="Last survivor wins the pool"
          text="In paid games, the prize pool goes to the last remaining player. If multiple survivors remain at season end, the pool splits."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Example</p>
          <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">A round in 30 seconds</h2>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Your goal is to make it to the next round with as little risk as possible, while saving strong teams for
            later rounds.
          </p>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card/70 p-6 shadow-sm sm:p-8">
          <ol className="space-y-5">
            <TimelineItem
              title="You pick Arsenal to win"
              text="It’s Round 6. Arsenal are favorites, but you’re spending a valuable pick."
            />
            <TimelineItem
              title="Kickoff locks your choice"
              text="You can’t change after the first match starts. No late switches."
            />
            <TimelineItem
              title="Arsenal win 2–1"
              text="You survive to the next round. Arsenal are now unavailable for you in this game."
            />
            <TimelineItem title="Next round gets sharper" text="You must pick a different team. The pool shrinks." />
          </ol>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">FAQ</p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Quick answers, no fluff
          </h2>
        </div>

        <div className="grid gap-3">
          <FaqItem
            title="What happens if I forget to pick?"
            text="If you don’t pick before lock, the system will auto-assign the first available team alphabetically that you haven’t used yet."
          />
          <FaqItem
            title="Can I change my pick?"
            text="Yes. You can change your pick as many times as you want until the round locks at kickoff."
          />
          <FaqItem
            title="What counts as elimination?"
            text="If your team loses or draws, you’re eliminated. Only wins keep you alive."
          />
          <FaqItem
            title="Can I reuse teams?"
            text="Not within the same game. Once you use a team, it’s gone for you in that game."
          />
          <FaqItem
            title="Is this gambling?"
            text="Guess to Survive is a game of skill based on publicly available match results. Only play with money you can afford to lose."
          />
          <FaqItem
            title="Where can I see the legal terms?"
            text="You can read the Terms of Service and Privacy Policy any time from the footer links."
          />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-[linear-gradient(135deg,rgba(251,191,36,0.22),transparent_42%),linear-gradient(225deg,rgba(16,185,129,0.16),transparent_45%)] p-6 shadow-sm dark:bg-[linear-gradient(135deg,rgba(251,191,36,0.18),transparent_42%),linear-gradient(225deg,rgba(16,185,129,0.18),transparent_45%)] sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(90deg,transparent,transparent_18px,rgba(0,0,0,0.07)_19px,rgba(0,0,0,0.07)_20px)] dark:opacity-45 dark:[background-image:repeating-linear-gradient(90deg,transparent,transparent_18px,rgba(255,255,255,0.08)_19px,rgba(255,255,255,0.08)_20px)]"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Next step</p>
            <h2 className="font-display mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Pick a pool and make it real
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              You can join a free pool to learn the flow, or jump into a paid pool when you’re ready.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <Button asChild className="h-10 gap-2 rounded-xl px-5 shadow-sm" size="sm">
                <Link to="/games">
                  Browse games <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="h-10 gap-2 rounded-xl px-5 shadow-sm" size="sm">
                <Link to="/auth/signup">
                  Start playing <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild className="h-10 rounded-xl px-5" size="sm" variant="outline">
              <Link to="/terms">Terms</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
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

function Step({ index, text, title }: { index: string; text: string; title: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/70 p-6 shadow-sm transition hover:border-primary/35 hover:bg-card sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <p className="font-display text-xs font-semibold tracking-[0.24em] text-muted-foreground">{index}</p>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/60 text-foreground">
          <Check className="h-4 w-4" />
        </span>
      </div>
      <p className="font-display mt-4 text-xl font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function TimelineItem({ text, title }: { text: string; title: string }) {
  return (
    <li className="grid grid-cols-[22px_1fr] gap-4">
      <span className="mt-1.5 h-4 w-4 rounded-full border border-border bg-background/80" aria-hidden />
      <div>
        <p className="font-display text-base font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
    </li>
  )
}

function FaqItem({ text, title }: { text: string; title: string }) {
  return (
    <details className="group rounded-2xl border border-border/80 bg-card/70 px-5 py-4 shadow-sm transition hover:bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span className="font-display text-base font-semibold text-foreground">{title}</span>
        <span className="font-display text-sm font-semibold text-muted-foreground transition group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </details>
  )
}
