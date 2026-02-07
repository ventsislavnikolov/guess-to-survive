import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function AppHeader() {
  const { signOut, user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link className="group" onClick={closeMobile} to="/">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-300">
            Guess to Survive
          </p>
          <p className="text-sm font-semibold text-slate-100">Football Survival Game</p>
        </Link>

        <nav className="hidden items-center gap-2 text-sm md:flex">
          <Link
            activeProps={{ className: 'text-slate-100' }}
            className="rounded-md px-3 py-2 text-slate-300 transition hover:bg-slate-800/80 hover:text-slate-100"
            to="/"
          >
            Home
          </Link>
          {user ? (
            <>
              <span className="hidden text-xs text-slate-400 sm:inline">{user.email}</span>
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
        <div className="border-t border-slate-800/80 bg-slate-950 md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6">
            <Link
              activeProps={{ className: 'bg-slate-800 text-slate-100' }}
              className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/80 hover:text-slate-100"
              onClick={closeMobile}
              to="/"
            >
              Home
            </Link>
            {user ? (
              <>
                <p className="px-3 py-1 text-xs text-slate-400">{user.email}</p>
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
          </nav>
        </div>
      ) : null}
    </header>
  )
}
