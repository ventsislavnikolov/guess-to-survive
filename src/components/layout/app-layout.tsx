import { AppFooter } from '@/components/layout/app-footer'
import { AppHeader } from '@/components/layout/app-header'

type AppLayoutProps = {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 10% 5%, rgba(56, 189, 248, 0.18), transparent 35%), radial-gradient(circle at 90% 0%, rgba(16, 185, 129, 0.15), transparent 30%)',
        }}
      />
      <div className="relative flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <AppFooter />
      </div>
    </div>
  )
}
