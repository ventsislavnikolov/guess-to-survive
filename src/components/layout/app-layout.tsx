import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_5%,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.12),transparent_30%)] opacity-70 dark:bg-[radial-gradient(circle_at_10%_5%,rgba(56,189,248,0.2),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.16),transparent_30%)]"
      />
      <div className="relative flex min-h-screen flex-col">
        <a
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:font-medium focus:text-foreground focus:text-sm focus:shadow-sm"
          href="#main-content"
        >
          Skip to content
        </a>
        <AppHeader />
        <main
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6"
          id="main-content"
        >
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
