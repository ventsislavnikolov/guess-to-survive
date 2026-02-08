import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { updatePassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    const verifyResetSession = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        } else if (tokenHash && type === "recovery") {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (verifyError) {
            throw verifyError;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error(
            "Reset link is invalid or has expired. Please request a new one."
          );
        }
      } catch (sessionError) {
        if (!active) {
          return;
        }
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Could not validate reset link"
        );
      } finally {
        if (active) {
          setVerifying(false);
        }
      }
    };

    verifyResetSession().catch((sessionError) => {
      if (!active) {
        return;
      }

      setError(
        sessionError instanceof Error
          ? sessionError.message
          : "Could not validate reset link"
      );
      setVerifying(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate({ replace: true, to: "/auth/login" });
      }, 800);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <section
        aria-label="Verifying reset link"
        className="grid min-h-[70vh] place-items-center p-6"
      >
        <Card className="w-full max-w-md border-border bg-card/80 text-card-foreground">
          <CardContent className="pt-6 text-center">
            <LoadingSpinner
              className="justify-center"
              label="Verifying reset link..."
            />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section
      aria-label="Reset password"
      className="grid min-h-[70vh] place-items-center p-6"
    >
      <Card className="w-full max-w-md border-border bg-card/80 text-card-foreground">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            if (success) {
              return (
                <p className="text-muted-foreground text-sm">
                  Password updated. Redirecting to login...
                </p>
              );
            }

            if (error) {
              return (
                <div className="space-y-3">
                  <p className="text-red-400 text-sm">{error}</p>
                  <Link
                    className="text-sm underline"
                    to="/auth/forgot-password"
                  >
                    Request a new reset link
                  </Link>
                </div>
              );
            }

            return (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    autoComplete="new-password"
                    id="password"
                    minLength={6}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    autoComplete="new-password"
                    id="confirmPassword"
                    minLength={6}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </div>
                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? "Updating..." : "Update password"}
                </Button>
              </form>
            );
          })()}
        </CardContent>
      </Card>
    </section>
  );
}
