import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await requestPasswordReset(email);
      toast.success("Password reset email sent.");
      setSuccess(true);
    } catch (resetError) {
      const message =
        resetError instanceof Error
          ? resetError.message
          : "Failed to send reset email";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-label="Forgot password"
      className="grid min-h-[70vh] place-items-center p-6"
    >
      <Card className="w-full max-w-md border-border bg-card/80 text-card-foreground">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-3 text-muted-foreground text-sm">
              <p>Check your email for a password reset link.</p>
              <Link className="underline" to="/auth/login">
                Back to login
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>
              {error ? <p className="text-red-400 text-sm">{error}</p> : null}
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <p className="text-center text-muted-foreground text-sm">
                <Link className="underline" to="/auth/login">
                  Back to login
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
