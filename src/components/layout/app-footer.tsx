export function AppFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-slate-400 sm:px-6">
        <p>© {new Date().getFullYear()} Guess to Survive</p>
        <p>Made for football prediction fans</p>
      </div>
    </footer>
  )
}
