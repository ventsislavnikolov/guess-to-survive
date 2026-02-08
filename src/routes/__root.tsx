import { createRootRoute, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AnalyticsRouteTracker } from "@/components/analytics-route-tracker";
import { AppErrorBoundary } from "@/components/error-boundary";
import { AppLayout } from "@/components/layout/app-layout";
import { Toaster } from "@/components/ui/sonner";

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-router-devtools").then((mod) => ({
        default: mod.TanStackRouterDevtools,
      }))
    )
  : null;

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: AppErrorBoundary,
});

function RootComponent() {
  return (
    <>
      <AnalyticsRouteTracker />
      <AppLayout>
        <Outlet />
      </AppLayout>
      <Toaster position="top-right" richColors />
      {import.meta.env.DEV && TanStackRouterDevtools ? (
        <Suspense fallback={null}>
          <TanStackRouterDevtools />
        </Suspense>
      ) : null}
    </>
  );
}
