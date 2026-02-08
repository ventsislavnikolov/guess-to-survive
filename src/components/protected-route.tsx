import { Navigate } from "@tanstack/react-router";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <section
        aria-label="Checking session"
        className="grid min-h-[60vh] place-items-center p-6"
      >
        <LoadingSpinner label="Checking session..." />
      </section>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  return <>{children}</>;
}
