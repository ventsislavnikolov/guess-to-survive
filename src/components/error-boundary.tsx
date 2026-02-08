import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AppErrorBoundary({ error, reset }: ErrorComponentProps) {
  return (
    <main className="grid min-h-[70vh] place-items-center p-6">
      <Card className="w-full max-w-xl border-border bg-card/80 text-card-foreground">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred while rendering this page.
          </p>
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
            {error.message}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={reset} type="button" variant="outline">
              Try again
            </Button>
            <Button asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
          {import.meta.env.DEV && error.stack ? (
            <details className="rounded-md border border-border bg-muted/40 p-3 text-muted-foreground text-xs">
              <summary className="cursor-pointer select-none">
                Stack trace
              </summary>
              <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
            </details>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
