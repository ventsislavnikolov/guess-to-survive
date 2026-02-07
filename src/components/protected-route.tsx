import { Navigate } from '@tanstack/react-router'

import { useAuth } from '@/hooks/use-auth'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
        <p className="text-sm text-slate-300">Checking session...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" />
  }

  return <>{children}</>
}
