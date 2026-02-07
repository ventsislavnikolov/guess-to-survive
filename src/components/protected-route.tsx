import { Navigate } from '@tanstack/react-router'

import { useAuth } from '@/hooks/use-auth'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <main className="grid min-h-[60vh] place-items-center p-6">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" />
  }

  return <>{children}</>
}
