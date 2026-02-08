import { Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface GameInviteShareCardProps {
  code: string | null;
  currency: string;
  entryFee: number | null;
  name: string;
  playerCount: number;
  status: string;
}

function formatCurrency(value: number | null, currency: string) {
  if (value === null || value === 0) {
    return "Free";
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

export function GameInviteShareCard({
  code,
  currency,
  entryFee,
  name,
  playerCount,
  status,
}: GameInviteShareCardProps) {
  return (
    <Card className="border-border bg-card/70">
      <CardHeader>
        <CardTitle>Invite friends</CardTitle>
        <CardDescription>
          Share this game link so others can join before it starts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
            Guess to Survive
          </p>
          <p className="mt-2 font-semibold text-foreground text-lg">{name}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              {playerCount} players
            </span>
            <span>•</span>
            <span>{formatCurrency(entryFee, currency)}</span>
            <span>•</span>
            <span className="capitalize">{status}</span>
          </div>
          {code ? (
            <p className="mt-3 text-muted-foreground text-xs">Code: {code}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
