import { Link } from "@tanstack/react-router";

export function AppFooter() {
  return (
    <footer className="border-border/80 border-t bg-background/80">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <Link className="inline-block" to="/">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                Guess to Survive
              </p>
              <p className="mt-2 font-display font-semibold text-foreground text-lg">
                Football survival pools
              </p>
            </Link>
            <p className="max-w-md text-muted-foreground text-sm">
              A one-pick-per-round survival game built on real fixtures. Play
              free, or join paid pools when you’re ready.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.22em]">
                Play
              </p>
              <div className="grid gap-1">
                <Link
                  className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  to="/games"
                >
                  Browse games
                </Link>
                <Link
                  className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  to="/games/create"
                >
                  Create a game
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.22em]">
                Learn
              </p>
              <div className="grid gap-1">
                <Link
                  className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  to="/how-it-works"
                >
                  How it works
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.22em]">
                Legal
              </p>
              <div className="grid gap-1">
                <Link
                  className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  to="/terms"
                >
                  Terms
                </Link>
                <Link
                  className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  to="/privacy"
                >
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-border/80 border-t pt-6 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Guess to Survive</p>
          <p>
            18+ for paid games. Only play with money you can afford to lose.
          </p>
        </div>
      </div>
    </footer>
  );
}
