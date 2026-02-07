import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function AppHeader() {
  const { signOut, user } = useAuth()

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link className="group" to="/">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-300">
            Guess to Survive
          </p>
          <p className="text-sm font-semibold text-slate-100">Football Survival Game</p>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
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
      </div>
    </header>
  )
}
