import { Trophy } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useProfileStats } from "@/hooks/use-profile-stats";

function formatCurrency(value: number, currency: string) {
  if (!Number.isFinite(value) || value <= 0) {
    return "-";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      style: "currency",
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/70 p-3">
      <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-2 font-semibold text-foreground text-xl">{value}</p>
    </div>
  );
}

export function ProfileStatsCard() {
  const { data: stats, error, isError, isLoading } = useProfileStats();
  const currency = "USD";

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-muted-foreground" />
          Stats
        </CardTitle>
        <CardDescription>Your performance across all games.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <LoadingSpinner label="Loading stats..." /> : null}
        {!isLoading && isError ? (
          <p className="text-destructive text-sm">
            {error instanceof Error ? error.message : "Could not load stats."}
          </p>
        ) : null}
        {!(isLoading || isError) && stats ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Games played" value={stats.gamesPlayed} />
            <Stat label="Games won" value={stats.gamesWon} />
            <Stat label="Win rate" value={`${stats.winRate.toFixed(2)}%`} />
            <Stat
              label="Total winnings"
              value={formatCurrency(stats.totalWinnings, currency)}
            />
            <Stat label="Longest streak" value={stats.longestStreak} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
