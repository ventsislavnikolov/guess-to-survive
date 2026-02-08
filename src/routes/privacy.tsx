import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { type ReactNode, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { setPageMeta } from "@/lib/meta";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  useEffect(() => {
    setPageMeta({
      description: "Privacy Policy for Guess to Survive.",
      title: "Privacy Policy | Guess to Survive",
      url: window.location.href,
    });
  }, []);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-[linear-gradient(135deg,rgba(56,189,248,0.18),transparent_42%),linear-gradient(225deg,rgba(251,191,36,0.14),transparent_45%)] p-6 shadow-sm sm:p-10 dark:bg-[linear-gradient(135deg,rgba(56,189,248,0.22),transparent_42%),linear-gradient(225deg,rgba(251,191,36,0.18),transparent_45%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:44px_44px] dark:opacity-45 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]"
        />
        <div className="relative">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.22em]">
            Legal
          </p>
          <h1 className="mt-4 font-display font-semibold text-4xl text-foreground leading-[1.05] sm:text-5xl">
            Privacy Policy
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/55 px-3 py-1 backdrop-blur">
              <LockKeyhole className="h-4 w-4" />
              We don’t sell personal data
            </span>
            <span className="rounded-full border border-border/70 bg-background/55 px-3 py-1 backdrop-blur">
              Last updated: February 8, 2026
            </span>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              asChild
              className="h-10 rounded-xl px-5"
              size="sm"
              variant="outline"
            >
              <Link to="/terms">Terms of Service</Link>
            </Button>
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
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-10">
        <Block title="1. What we collect">
          <ul className="mt-3 space-y-2 text-muted-foreground text-sm">
            <li>• Account data (email address, authentication identifiers).</li>
            <li>• Profile data (username and optional profile fields).</li>
            <li>
              • Game data (games joined, picks made, outcomes, and related
              activity).
            </li>
            <li>
              • Payment metadata (payment status and identifiers). Card details
              are processed by Stripe.
            </li>
            <li>
              • Technical data (device/browser info, basic logs for security and
              reliability).
            </li>
          </ul>
        </Block>

        <Block
          text="We use your information to operate the Service, authenticate users, process payments and payouts, send notifications related to gameplay, prevent abuse, and improve reliability."
          title="2. How we use your information"
        />

        <Block title="3. How we share data">
          <p className="text-muted-foreground text-sm">
            We share only what’s necessary with service providers:
          </p>
          <ul className="mt-3 space-y-2 text-muted-foreground text-sm">
            <li>• Stripe for payment processing and payouts.</li>
            <li>• Email delivery providers (for transactional emails).</li>
            <li>• Hosting and database providers to run the Service.</li>
          </ul>
          <p className="mt-3 text-muted-foreground text-sm">
            We do not sell your personal information.
          </p>
        </Block>

        <Block title="4. Cookies and local storage">
          <p className="text-muted-foreground text-sm">
            We use essential cookies or local storage for authentication,
            security, and preferences (like theme). We may also use analytics to
            understand usage and improve the Service.
          </p>
        </Block>

        <Block title="5. Data retention">
          <p className="text-muted-foreground text-sm">
            We retain personal data while your account is active. If you delete
            your account, we may anonymize personal data while retaining
            non-personal game records needed for integrity and audit.
          </p>
        </Block>

        <Block title="6. Your rights">
          <p className="text-muted-foreground text-sm">
            Depending on your location, you may have rights to access, correct,
            delete, or export your personal data.
          </p>
        </Block>

        <Block title="7. Security">
          <p className="text-muted-foreground text-sm">
            We use reasonable technical measures to protect your data. No method
            of transmission or storage is 100% secure, so we cannot guarantee
            absolute security.
          </p>
        </Block>

        <Block title="8. Contact">
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
            constitute legal advice.
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
