import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function AppHeader() {
  const { signOut, user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link className="group" onClick={closeMobile} to="/">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground/80">
            Guess to Survive
          </p>
          <p className="text-sm font-semibold text-foreground">Football Survival Game</p>
        </Link>

        <nav className="hidden items-center gap-2 text-sm md:flex">
          <Link
            activeProps={{ className: 'bg-accent text-accent-foreground' }}
            className="rounded-md px-3 py-2 text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
            to="/"
          >
            Home
          </Link>
          <Link
            activeProps={{ className: 'bg-accent text-accent-foreground' }}
            className="rounded-md px-3 py-2 text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
            to="/games"
          >
            Games
          </Link>
          {user ? (
            <>
              <Link
                activeProps={{ className: 'bg-accent text-accent-foreground' }}
                className="rounded-md px-3 py-2 text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
                to="/games/create"
              >
                Create game
              </Link>
              <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
              <Button className="h-9" onClick={() => void signOut()} size="sm" variant="outline">
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth/login">
                <Button className="h-9" size="sm" variant="ghost">
                  Login
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button className="h-9" size="sm">
                  Sign up
                </Button>
              </Link>
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
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border/80 bg-background md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6">
            <Link
              activeProps={{ className: 'bg-accent text-accent-foreground' }}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/70 hover:text-foreground"
              onClick={closeMobile}
              to="/"
            >
              Home
            </Link>
            <Link
              activeProps={{ className: 'bg-accent text-accent-foreground' }}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/70 hover:text-foreground"
              onClick={closeMobile}
              to="/games"
            >
              Games
            </Link>
            {user ? (
              <>
                <Link
                  activeProps={{ className: 'bg-accent text-accent-foreground' }}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  onClick={closeMobile}
                  to="/games/create"
                >
                  Create game
                </Link>
                <p className="px-3 py-1 text-xs text-muted-foreground">{user.email}</p>
                <Button
                  className="justify-start"
                  onClick={() => {
                    closeMobile()
                    void signOut()
                  }}
                  variant="outline"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link className="w-full" onClick={closeMobile} to="/auth/login">
                  <Button className="w-full justify-start" variant="ghost">
                    Login
                  </Button>
                </Link>
                <Link className="w-full" onClick={closeMobile} to="/auth/signup">
                  <Button className="w-full justify-start">Sign up</Button>
                </Link>
              </>
            )}
            <div className="px-1 pt-2">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
