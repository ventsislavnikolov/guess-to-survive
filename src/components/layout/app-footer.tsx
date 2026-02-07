export function AppFooter() {
  return (
    <footer className="border-t border-border/80 bg-background/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <p>© {new Date().getFullYear()} Guess to Survive</p>
        <p>Made for football prediction fans</p>
      </div>
    </footer>
  )
}
