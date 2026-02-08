import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { type ReactNode, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { setPageMeta } from "@/lib/meta";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  useEffect(() => {
    setPageMeta({
      description: "Terms of Service for Guess to Survive.",
      title: "Terms of Service | Guess to Survive",
      url: window.location.href,
    });
  }, []);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),transparent_42%),linear-gradient(225deg,rgba(56,189,248,0.14),transparent_45%)] p-6 shadow-sm sm:p-10 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.2),transparent_42%),linear-gradient(225deg,rgba(56,189,248,0.18),transparent_45%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:44px_44px] dark:opacity-45 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]"
        />
        <div className="relative">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.22em]">
            Legal
          </p>
          <h1 className="mt-4 font-display font-semibold text-4xl text-foreground leading-[1.05] sm:text-5xl">
            Terms of Service
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/55 px-3 py-1 backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              18+ required for paid games
            </span>
            <span className="rounded-full border border-border/70 bg-background/55 px-3 py-1 backdrop-blur">
              Last updated: February 8, 2026
            </span>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              asChild
              className="h-10 gap-2 rounded-xl px-5"
              size="sm"
              variant="outline"
            >
              <Link to="/how-it-works">
                How it works <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-xl px-5"
              size="sm"
              variant="outline"
            >
              <Link to="/privacy">Privacy policy</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-10">
        <Block
          text="By accessing or using Guess to Survive (the “Service”), you agree to these Terms. If you do not agree, do not use the Service."
          title="1. Acceptance of these terms"
        />
        <Block
          text="You must be at least 18 years old to participate in paid games. You are responsible for ensuring that your use of the Service is lawful in your jurisdiction."
          title="2. Eligibility"
        />
        <Block
          text="You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account."
          title="3. Accounts"
        />

        <Block title="4. Game rules (high level)">
          <ul className="mt-3 space-y-2 text-muted-foreground text-sm">
            <li>• You pick one team to win per round.</li>
            <li>• Picks lock at the first match kickoff for the round.</li>
            <li>
              • If your team wins, you survive. If your team loses or draws, you
              are eliminated.
            </li>
            <li>• You cannot pick the same team twice in the same game.</li>
            <li>
              • If you fail to pick, the Service may auto-assign an eligible
              team.
            </li>
          </ul>
          <p className="mt-3 text-muted-foreground text-sm">
            For the full explainer and examples, see the{" "}
            <Link
              className="underline underline-offset-4 hover:text-foreground"
              to="/how-it-works"
            >
              How it works
            </Link>{" "}
            page.
          </p>
        </Block>

        <Block title="5. Paid games, payments, and fees">
          <p className="text-muted-foreground text-sm">
            Paid games require an entry fee. Payments are processed by Stripe.
            The Service may show and collect applicable processing fees during
            checkout.
          </p>
        </Block>

        <Block title="6. Refunds and cancellations">
          <p className="text-muted-foreground text-sm">
            Refund scenarios may include (for example) game cancellation for not
            meeting minimum players, manager kicks, or other cases defined by
            the game configuration and platform policies. Where refunds apply,
            they are processed back to the original payment method.
          </p>
        </Block>

        <Block title="7. Responsible gaming">
          <p className="text-muted-foreground text-sm">
            Only play with money you can afford to lose. You may use the
            self-exclusion controls in your profile to block yourself from paid
            games for a period of time.
          </p>
        </Block>

        <Block title="8. Prohibited conduct">
          <p className="text-muted-foreground text-sm">
            You agree not to misuse the Service, attempt to access accounts you
            do not own, or interfere with normal operation. We may suspend or
            terminate accounts that violate these Terms.
          </p>
        </Block>

        <Block title="9. Third-party services">
          <p className="text-muted-foreground text-sm">
            The Service uses third-party providers for infrastructure,
            authentication, payments, and email delivery. Your use of those
            services may also be subject to their terms.
          </p>
        </Block>

        <Block title="10. Disclaimers">
          <p className="text-muted-foreground text-sm">
            The Service is provided “as is” and “as available.” Past performance
            does not guarantee future results. Match data and results are
            sourced from third parties and may be delayed or corrected.
          </p>
        </Block>

        <Block title="11. Limitation of liability">
          <p className="text-muted-foreground text-sm">
            To the maximum extent permitted by law, we are not liable for
            indirect, incidental, special, consequential, or punitive damages,
            or any loss of profits or revenues.
          </p>
        </Block>

        <Block title="12. Contact">
          <p className="text-muted-foreground text-sm">
            For privacy inquiries, contact{" "}
            <a
              className="underline underline-offset-4 hover:text-foreground"
              href="mailto:privacy@guesstosurvive.com"
            >
              privacy@guesstosurvive.com
            </a>
            .
          </p>
        </Block>

        <div className="rounded-2xl border border-border bg-card/70 p-5 text-muted-foreground text-xs">
          <p className="font-medium text-foreground">Note</p>
          <p className="mt-2">
            This page is provided for product completeness and does not
            constitute legal advice. If you need jurisdiction-specific terms,
            consult a qualified attorney.
          </p>
        </div>
      </section>
    </div>
  );
}

function Block({
  title,
  text,
  children,
}: {
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="font-display font-semibold text-2xl text-foreground">
        {title}
      </h2>
      {text ? <p className="text-muted-foreground text-sm">{text}</p> : null}
      {children}
    </div>
  );
}
