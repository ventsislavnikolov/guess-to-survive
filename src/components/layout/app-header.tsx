import { Link } from "@tanstack/react-router";
import { Bell, Menu, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";

export function AppHeader() {
  const { signOut, user } = useAuth();
  const unreadCount = useUnreadNotificationCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);
  const handleSignOut = () => {
    signOut().catch((error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to sign out."
      );
    });
  };

  return (
    <header className="border-border/80 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link className="group" onClick={closeMobile} to="/">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] group-hover:text-foreground/80">
            Guess to Survive
          </p>
          <p className="font-semibold text-foreground text-sm">
            Football Survival Game
          </p>
        </Link>

        <nav className="hidden items-center gap-2 text-sm md:flex">
          <Link
            activeProps={{ className: "bg-accent text-accent-foreground" }}
            className="rounded-md px-3 py-2 text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
            to="/"
          >
            Home
          </Link>
          <Link
            activeProps={{ className: "bg-accent text-accent-foreground" }}
            className="rounded-md px-3 py-2 text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
            to="/games"
          >
            Games
          </Link>
          <Link
            activeProps={{ className: "bg-accent text-accent-foreground" }}
            className="rounded-md px-3 py-2 text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
            to="/how-it-works"
          >
            How it works
          </Link>
          {user ? (
            <>
              <Link
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                className="rounded-md px-3 py-2 text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
                to="/games/create"
              >
                Create game
              </Link>
              <Link
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                aria-label="Notifications"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
                to="/notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute top-1 right-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-semibold text-[10px] text-primary-foreground leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </Link>
              <Link
                className="hidden max-w-[220px] truncate rounded-md px-2 py-1 text-muted-foreground text-xs transition hover:bg-accent/60 hover:text-foreground sm:inline"
                to="/profile"
              >
                {user.email}
              </Link>
              <Button
                className="h-9"
                onClick={handleSignOut}
                size="sm"
                variant="outline"
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="h-9" size="sm" variant="ghost">
                <Link to="/auth/login">Login</Link>
              </Button>
              <Button asChild className="h-9" size="sm">
                <Link to="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
          <ThemeToggle />
        </nav>

        <Button
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
          className="md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          size="icon"
          variant="ghost"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {mobileOpen ? (
        <div className="border-border/80 border-t bg-background md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6">
            <Link
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="rounded-md px-3 py-2 text-muted-foreground text-sm hover:bg-accent/70 hover:text-foreground"
              onClick={closeMobile}
              to="/"
            >
              Home
            </Link>
            <Link
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="rounded-md px-3 py-2 text-muted-foreground text-sm hover:bg-accent/70 hover:text-foreground"
              onClick={closeMobile}
              to="/games"
            >
              Games
            </Link>
            <Link
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="rounded-md px-3 py-2 text-muted-foreground text-sm hover:bg-accent/70 hover:text-foreground"
              onClick={closeMobile}
              to="/how-it-works"
            >
              How it works
            </Link>
            {user ? (
              <>
                <Link
                  activeProps={{
                    className: "bg-accent text-accent-foreground",
                  }}
                  className="rounded-md px-3 py-2 text-muted-foreground text-sm hover:bg-accent/70 hover:text-foreground"
                  onClick={closeMobile}
                  to="/games/create"
                >
                  Create game
                </Link>
                <Link
                  activeProps={{
                    className: "bg-accent text-accent-foreground",
                  }}
                  className="rounded-md px-3 py-2 text-muted-foreground text-sm hover:bg-accent/70 hover:text-foreground"
                  onClick={closeMobile}
                  to="/profile"
                >
                  Profile
                </Link>
                <Link
                  activeProps={{
                    className: "bg-accent text-accent-foreground",
                  }}
                  className="relative rounded-md px-3 py-2 text-muted-foreground text-sm hover:bg-accent/70 hover:text-foreground"
                  onClick={closeMobile}
                  to="/notifications"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </span>
                  {unreadCount > 0 ? (
                    <span className="absolute top-1 right-2 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-semibold text-[10px] text-primary-foreground leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </Link>
                <p className="px-3 py-1 text-muted-foreground text-xs">
                  {user.email}
                </p>
                <Button
                  className="justify-start"
                  onClick={() => {
                    closeMobile();
                    handleSignOut();
                  }}
                  variant="outline"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  className="w-full justify-start"
                  onClick={closeMobile}
                  variant="ghost"
                >
                  <Link to="/auth/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start"
                  onClick={closeMobile}
                >
                  <Link to="/auth/signup">Sign up</Link>
                </Button>
              </>
            )}
            <div className="px-1 pt-2">
              <ThemeToggle />
            </div>
            <div className="grid gap-1 px-1 pt-1 text-muted-foreground text-xs">
              <Link
                className="rounded-md px-3 py-2 hover:bg-accent/70 hover:text-foreground"
                onClick={closeMobile}
                to="/terms"
              >
                Terms
              </Link>
              <Link
                className="rounded-md px-3 py-2 hover:bg-accent/70 hover:text-foreground"
                onClick={closeMobile}
                to="/privacy"
              >
                Privacy
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
