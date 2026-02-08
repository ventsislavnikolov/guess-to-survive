import { createFileRoute, Link } from "@tanstack/react-router";

import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { usePaymentHistory } from "@/hooks/use-profile";

export const Route = createFileRoute("/spending-history")({
  component: SpendingHistoryRoute,
});

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      style: "currency",
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function SpendingHistoryRoute() {
  return (
    <ProtectedRoute>
      <SpendingHistoryPage />
    </ProtectedRoute>
  );
}

function SpendingHistoryPage() {
  const { data, error, isError, isLoading } = usePaymentHistory();

  const payments = data ?? [];
  const currency = payments.at(0)?.currency ?? "USD";
  const paid = payments.filter((payment) => (payment.total_amount ?? 0) > 0);

  const grossSpent = paid.reduce(
    (sum, payment) => sum + (payment.total_amount ?? 0),
    0
  );
  const refunded = paid.reduce(
    (sum, payment) => sum + (payment.refunded_amount ?? 0),
    0
  );
  const netSpent = Math.max(0, grossSpent - refunded);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
            Responsible gaming
          </p>
          <h1 className="mt-1 font-semibold text-2xl text-foreground">
            Spending history
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Review paid game entries, refunds, and totals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/profile">Back to profile</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Gross spent</CardTitle>
            <CardDescription>
              Total charged (including refunded).
            </CardDescription>
          </CardHeader>
          <CardContent className="font-semibold text-2xl">
            {formatCurrency(grossSpent, currency)}
          </CardContent>
        </Card>
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Refunded</CardTitle>
            <CardDescription>Total amount refunded.</CardDescription>
          </CardHeader>
          <CardContent className="font-semibold text-2xl">
            {formatCurrency(refunded, currency)}
          </CardContent>
        </Card>
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Net spent</CardTitle>
            <CardDescription>Gross minus refunds.</CardDescription>
          </CardHeader>
          <CardContent className="font-semibold text-2xl">
            {formatCurrency(netSpent, currency)}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Payments are visible only to you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <LoadingSpinner label="Loading spending history..." />
          ) : null}
          {!isLoading && isError ? (
            <p className="text-destructive text-sm">
              {error instanceof Error
                ? error.message
                : "Could not load payments."}
            </p>
          ) : null}
          {!(isLoading || isError) && paid.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No paid entries yet.
            </p>
          ) : null}
          {isLoading || isError
            ? null
            : paid.map((payment) => (
                <div
                  className="space-y-2 rounded-lg border border-border/60 bg-card/70 p-3 text-sm"
                  key={payment.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {payment.game_name ??
                          `Game ${payment.game_id.slice(0, 8)}`}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDateTime(payment.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(
                          payment.total_amount ?? 0,
                          payment.currency
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {payment.status.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  {payment.refund_requested_at ? (
                    <p className="text-muted-foreground text-xs">
                      Refund requested:{" "}
                      {formatDateTime(payment.refund_requested_at)}
                    </p>
                  ) : null}
                  {payment.refunded_at ? (
                    <p className="text-muted-foreground text-xs">
                      Refunded at: {formatDateTime(payment.refunded_at)}
                      {payment.refunded_amount !== null
                        ? ` (${formatCurrency(payment.refunded_amount, payment.currency)})`
                        : ""}
                    </p>
                  ) : null}
                  {payment.refund_failure_reason ? (
                    <p className="text-destructive text-xs">
                      Refund error: {payment.refund_failure_reason}
                    </p>
                  ) : null}
                </div>
              ))}
        </CardContent>
      </Card>

      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle className="text-base">Need a break?</CardTitle>
          <CardDescription>
            Enable self-exclusion to block paid games for a set time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/profile">Manage self-exclusion</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
