# AGENTS.md and .agents/ Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create comprehensive Claude AI assistant documentation with AGENTS.md guide and .agents/ directory containing 13 agents and 23 skill files.

**Architecture:** Fork tenant-ops-ui AGENTS.md patterns, adapt for Supabase/Stripe/game-specific flows. Flat files for copied agents, folders with embedded skills for custom agents.

**Tech Stack:** React 19, Vite, TanStack, Tailwind 4, shadcn/ui, Supabase, Stripe, football-data.org, PostHog, Resend

---

## Phase 1: Foundation (3 tasks)

### Task 1: Create CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

**Step 1: Write CLAUDE.md pointing to AGENTS.md**

```markdown
@AGENTS.md
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "chore: add CLAUDE.md pointing to AGENTS.md"
```

---

### Task 2: Create .agents/README.md

**Files:**
- Create: `.agents/README.md`

**Step 1: Write agent index and usage guide**

```markdown
# Agents Directory

Agent-first development: check relevant agents before implementing features.

## Usage

Reference agents in prompts:
- "Use @.agents/supabase-developer for RLS policies"
- "Follow @.agents/game-logic-developer/pick-system.md"

## Agent Index

### Copied Agents (General Purpose)

| Agent | Purpose |
|-------|---------|
| frontend-developer | React 19 UI, components, state |
| unit-tester | Vitest tests, MSW mocking |
| integration-tester | Playwright E2E tests |
| shadcn-ui-builder | shadcn/ui components |
| accessibility-tester | WCAG 2.1 AA compliance |
| typescript-pro | Advanced TypeScript patterns |
| code-reviewer | Code quality, security review |

### Custom Agents (Project-Specific)

| Agent | Purpose | Skills |
|-------|---------|--------|
| supabase-developer | Auth, RLS, Edge Functions, Realtime | 4 skills |
| stripe-integrator | Checkout, Connect, webhooks, payouts | 4 skills |
| game-logic-developer | Picks, eliminations, game states | 5 skills |
| football-api-syncer | football-data.org sync | 3 skills |
| notification-developer | Email (Resend), in-app notifications | 2 skills |
| pwa-developer | Service worker, offline support | 2 skills |

## Directory Structure

```
.agents/
├── README.md                 # This file
├── *.md                      # Copied agents (flat)
└── {agent-name}/             # Custom agents (folders)
    ├── agent.md              # Main agent definition
    └── {skill}.md            # Embedded skills
```

## Agent Format

All agents use YAML frontmatter:

```yaml
---
name: agent-name
description: Use when... (triggering conditions)
tools: Read, Write, Edit, Bash, Glob, Grep
---
```

## When to Use Which Agent

| Task | Agent |
|------|-------|
| Building UI components | frontend-developer, shadcn-ui-builder |
| Writing unit tests | unit-tester |
| Writing E2E tests | integration-tester |
| Supabase database/auth | supabase-developer |
| Payment integration | stripe-integrator |
| Game rules/logic | game-logic-developer |
| Football data sync | football-api-syncer |
| Notifications | notification-developer |
| PWA features | pwa-developer |
| Code review | code-reviewer |
| Accessibility audit | accessibility-tester |
| TypeScript issues | typescript-pro |
```

**Step 2: Commit**

```bash
git add .agents/README.md
git commit -m "docs: add .agents/README.md with agent index"
```

---

### Task 3: Create AGENTS.md

**Files:**
- Create: `AGENTS.md`

**Step 1: Write AGENTS.md (comprehensive guide)**

This is a large file. Write the complete AGENTS.md with all 22 sections covering:

1. Project Context
2. Technology Stack (React 19, Vite, TanStack, Supabase, Stripe, etc.)
3. Architectural Principles
4. Directory Organization
5. Implementation Patterns (DataTable, Forms, Drawers, Context)
6. Real-time Patterns (Supabase Realtime)
7. Payment Flows (Stripe Checkout, Connect, payouts)
8. Game State Machine (pending → active → completed)
9. Scheduled Jobs (cron patterns)
10. External API Integration (football-data.org)
11. Responsible Gaming
12. Authentication & Authorization (Supabase Auth, RLS)
13. Database Schema (key tables inline)
14. Styling Standards (Tailwind, dark theme)
15. Accessibility Requirements (WCAG 2.1 AA)
16. Testing Requirements (Vitest, Playwright, local Supabase)
17. i18n Setup (react-i18next, English only v1)
18. Analytics (PostHog)
19. Error Handling
20. Common Commands
21. Anti-Patterns
22. Success Criteria Checklist

**Reference:** Use tenant-ops-ui AGENTS.md as base, adapt all sections.

**Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add comprehensive AGENTS.md guide

Covers stack, patterns, game flows, Supabase, Stripe, testing.
~600-800 lines adapted from tenant-ops-ui patterns."
```

---

## Phase 2: Copied Agents (7 tasks)

### Task 4: Copy and adapt frontend-developer.md

**Files:**
- Source: `~/.claude/agents/frontend-developer.md`
- Create: `.agents/frontend-developer.md`

**Step 1: Copy and adapt**

Adaptations:
- Remove Vue 3+, Angular 15+ → React 19 only
- Remove Redux, Zustand, Pinia, NgRx → TanStack Query + Context
- Add Supabase client usage
- Add PostHog tracking requirement
- Add game-specific component references (leaderboard, pick selector)
- Reference .agents/ skills for patterns

**Step 2: Commit**

```bash
git add .agents/frontend-developer.md
git commit -m "docs: add frontend-developer agent (adapted)"
```

---

### Task 5: Copy and adapt unit-tester.md

**Files:**
- Source: `~/.claude/agents/unit-tester.md`
- Create: `.agents/unit-tester.md`

**Step 1: Copy and adapt**

Adaptations:
- Remove Fourth.iQ360 references → Guess to Survive
- Remove .claude/plans/{RALLY-ID}/ paths
- Remove Azure API patterns
- Add Supabase client mocking patterns
- Add game state test utilities
- Add Stripe mock helpers

**Step 2: Commit**

```bash
git add .agents/unit-tester.md
git commit -m "docs: add unit-tester agent (adapted)"
```

---

### Task 6: Copy and adapt integration-tester.md

**Files:**
- Source: `~/.claude/agents/integration-tester.md`
- Create: `.agents/integration-tester.md`

**Step 1: Copy and adapt**

Adaptations:
- Add local Supabase CLI setup (`supabase start`)
- Add Stripe test mode configuration
- Add game flow testing patterns (join → pick → results)
- Update URLs and test data for this project

**Step 2: Commit**

```bash
git add .agents/integration-tester.md
git commit -m "docs: add integration-tester agent (adapted)"
```

---

### Task 7: Copy and adapt shadcn-ui-builder.md

**Files:**
- Source: `~/.claude/agents/shadcn-ui-builder.md`
- Create: `.agents/shadcn-ui-builder.md`

**Step 1: Copy and adapt**

Minimal adaptations (generic enough):
- Update project name references
- Ensure Tailwind 4 compatibility notes

**Step 2: Commit**

```bash
git add .agents/shadcn-ui-builder.md
git commit -m "docs: add shadcn-ui-builder agent (adapted)"
```

---

### Task 8: Copy and adapt accessibility-tester.md

**Files:**
- Source: `~/.claude/agents/accessibility-tester.md`
- Create: `.agents/accessibility-tester.md`

**Step 1: Copy and adapt**

Minimal adaptations (generic enough):
- Update project name references

**Step 2: Commit**

```bash
git add .agents/accessibility-tester.md
git commit -m "docs: add accessibility-tester agent (adapted)"
```

---

### Task 9: Copy and adapt typescript-pro.md

**Files:**
- Source: `~/.claude/agents/typescript-pro.md`
- Create: `.agents/typescript-pro.md`

**Step 1: Copy and adapt**

Minimal adaptations (generic enough):
- Update project name references

**Step 2: Commit**

```bash
git add .agents/typescript-pro.md
git commit -m "docs: add typescript-pro agent (adapted)"
```

---

### Task 10: Copy and adapt code-reviewer.md

**Files:**
- Source: `~/.claude/agents/code-reviewer.md`
- Create: `.agents/code-reviewer.md`

**Step 1: Copy and adapt**

Adaptations:
- Add Supabase RLS policy review checklist
- Add Stripe security checks (webhook signatures, no secrets in frontend)
- Add game logic review points (pick validation, elimination rules)

**Step 2: Commit**

```bash
git add .agents/code-reviewer.md
git commit -m "docs: add code-reviewer agent (adapted)"
```

---

## Phase 3: Custom Agents (6 tasks with multiple sub-tasks)

### Task 11: Create supabase-developer agent (5 files)

**Files:**
- Create: `.agents/supabase-developer/agent.md`
- Create: `.agents/supabase-developer/rls-patterns.md`
- Create: `.agents/supabase-developer/edge-functions.md`
- Create: `.agents/supabase-developer/realtime-subscriptions.md`
- Create: `.agents/supabase-developer/auth-flows.md`

**Step 1: Write agent.md**

```markdown
---
name: supabase-developer
description: Use when implementing Supabase Auth, database operations, RLS policies, Edge Functions, or Realtime subscriptions
tools: Read, Write, Edit, Bash, Glob, Grep
---

# Supabase Developer

## Context

Senior backend developer specializing in Supabase for Guess to Survive. Expert in PostgreSQL, Row Level Security, Edge Functions (Deno), and Realtime subscriptions.

## Objective

- Implement secure database operations with RLS
- Create Edge Functions for scheduled jobs and webhooks
- Set up Realtime subscriptions for live updates
- Manage authentication flows

## Constraints

- All tables MUST have RLS enabled
- Edge Functions use TypeScript (Deno runtime)
- Use Supabase client in frontend, not raw SQL
- Follow patterns in embedded skills
- Local development via `supabase start`

## Skills

- @rls-patterns.md - Row Level Security patterns
- @edge-functions.md - Edge Function development
- @realtime-subscriptions.md - Live data subscriptions
- @auth-flows.md - Authentication patterns

## Workflow

1. Read requirements from plan/issue
2. Design schema changes (migrations)
3. Implement RLS policies
4. Create/update Edge Functions
5. Test locally with Supabase CLI
6. Generate types: `pnpm supabase:types`
7. Document API changes

## Checks

Before implementation:
- [ ] Understand data access requirements
- [ ] Review existing RLS policies
- [ ] Check Edge Function dependencies

During implementation:
- [ ] RLS enabled on all new tables
- [ ] Policies tested for all user roles
- [ ] Edge Functions have error handling
- [ ] Types regenerated after schema changes

Before handoff:
- [ ] Migrations are reversible
- [ ] Local tests pass
- [ ] Documentation updated

## Output

- Migration files: `supabase/migrations/`
- Edge Functions: `supabase/functions/`
- Updated types: `src/types/supabase.ts`

## Emergency Procedures

**RLS blocking all access:**
1. Check `auth.uid()` is available (user logged in)
2. Verify policy conditions match data
3. Test with `supabase.auth.getUser()` first

**Edge Function failing:**
1. Check logs: `supabase functions logs <name>`
2. Verify secrets are set
3. Test locally: `supabase functions serve`
```

**Step 2: Write rls-patterns.md**

```markdown
# Row Level Security Patterns

## Overview

RLS policies enforce data access at database level. Every table MUST have RLS enabled - no exceptions.

## When to Use

- Every new table creation
- When changing data access requirements
- When adding new user roles

## Patterns

### User sees own data only

```sql
-- Users can only see their own profile
CREATE POLICY "Users see own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users can only see their own picks
CREATE POLICY "Users see own picks"
ON picks FOR SELECT
USING (auth.uid() = user_id);
```

### Game manager sees all players

```sql
CREATE POLICY "Manager sees game players"
ON game_players FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM games
    WHERE games.id = game_players.game_id
    AND games.manager_id = auth.uid()
  )
);
```

### Public games visible to all

```sql
CREATE POLICY "Public games visible"
ON games FOR SELECT
USING (
  visibility = 'public'
  OR manager_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM game_players
    WHERE game_players.game_id = games.id
    AND game_players.user_id = auth.uid()
  )
);
```

### Insert own data

```sql
CREATE POLICY "Users insert own picks"
ON picks FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Update own data with conditions

```sql
CREATE POLICY "Users update own picks before deadline"
ON picks FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM games
    WHERE games.id = picks.game_id
    AND games.current_round = picks.round
    AND NOW() < (
      SELECT MIN(kickoff_time) FROM fixtures
      WHERE fixtures.round = picks.round
    )
  )
);
```

## Quick Reference

| Access Pattern | Policy Type | Key Check |
|----------------|-------------|-----------|
| Own data only | SELECT/UPDATE/DELETE | `auth.uid() = user_id` |
| Manager access | SELECT | Join to games.manager_id |
| Public content | SELECT | Check visibility column |
| Insert own | INSERT | `WITH CHECK (auth.uid() = user_id)` |
| Conditional update | UPDATE | USING + WITH CHECK |

## Common Mistakes

❌ **Forgetting RLS on new tables**
```sql
CREATE TABLE picks (...);
-- No RLS = no access via client
```

✅ **Always enable RLS immediately**
```sql
CREATE TABLE picks (...);
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON picks ...;
```

❌ **Using service role key in frontend**
```typescript
// NEVER - bypasses all RLS
const supabase = createClient(url, SERVICE_ROLE_KEY);
```

✅ **Use anon key + user session**
```typescript
const supabase = createClient(url, ANON_KEY);
// RLS enforced based on auth.uid()
```

❌ **Complex policies without indexes**
```sql
-- Slow without index on game_id
USING (EXISTS (SELECT 1 FROM games WHERE games.id = game_players.game_id ...))
```

✅ **Add indexes for policy lookups**
```sql
CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_game_players_user_id ON game_players(user_id);
```
```

**Step 3: Write edge-functions.md**

```markdown
# Edge Functions Patterns

## Overview

Supabase Edge Functions run on Deno. Use for: webhooks, scheduled jobs, complex server logic.

## When to Use

- Stripe webhook handling
- Scheduled data sync (cron)
- Complex operations (eliminations, payouts)
- Operations requiring service role

## Structure

```
supabase/functions/
├── _shared/              # Shared utilities
│   ├── supabase.ts       # Admin client
│   ├── stripe.ts         # Stripe client
│   └── cors.ts           # CORS headers
├── stripe-webhook/
│   └── index.ts
├── sync-fixtures/
│   └── index.ts
├── process-results/
│   └── index.ts
└── send-notification/
    └── index.ts
```

## Shared Admin Client

```typescript
// supabase/functions/_shared/supabase.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
```

## Basic Function Pattern

```typescript
// supabase/functions/example/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createAdminClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createAdminClient();

    // Your logic here
    const { data, error } = await supabase
      .from("games")
      .select("*");

    if (error) throw error;

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

## Webhook Pattern (Stripe)

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req) => {
  const signature = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutComplete(event.data.object);
      break;
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object);
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

## Scheduled Job Pattern (Cron)

```typescript
// supabase/functions/sync-fixtures/index.ts
// Triggered by cron: 0 6 * * * (daily at 6am)

serve(async (req) => {
  // Verify cron secret
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch from football-data.org
  const response = await fetch(
    "https://api.football-data.org/v4/competitions/PL/matches",
    { headers: { "X-Auth-Token": Deno.env.get("FOOTBALL_API_KEY")! } }
  );

  const { matches } = await response.json();

  // Upsert fixtures
  const { error } = await supabase
    .from("fixtures")
    .upsert(matches.map(mapFixture), { onConflict: "external_id" });

  return new Response(JSON.stringify({ synced: matches.length }));
});
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `supabase functions new <name>` | Create new function |
| `supabase functions serve` | Local development |
| `supabase functions deploy <name>` | Deploy single function |
| `supabase functions deploy` | Deploy all functions |
| `supabase secrets set KEY=value` | Set secret |
| `supabase functions logs <name>` | View logs |

## Common Mistakes

❌ **Hardcoding secrets**
```typescript
const apiKey = "sk_live_xxx"; // NEVER
```

✅ **Use environment variables**
```typescript
const apiKey = Deno.env.get("STRIPE_SECRET_KEY")!;
```

❌ **Missing CORS headers**
```typescript
return new Response(data); // Blocked by browser
```

✅ **Always include CORS**
```typescript
return new Response(data, { headers: corsHeaders });
```
```

**Step 4: Write realtime-subscriptions.md**

```markdown
# Realtime Subscriptions Patterns

## Overview

Supabase Realtime enables live updates via WebSocket. Use for leaderboards, game state, notifications.

## When to Use

- Live leaderboard updates
- Game state changes (new round, eliminations)
- Pick visibility after deadline
- Real-time notifications

## Basic Subscription

```typescript
// Subscribe to game changes
const channel = supabase
  .channel("game-updates")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "games",
      filter: `id=eq.${gameId}`,
    },
    (payload) => {
      console.log("Game changed:", payload);
      queryClient.invalidateQueries({ queryKey: ["games", gameId] });
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

## React Hook Pattern

```typescript
// src/hooks/realtime/use-game-subscription.ts
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useGameSubscription(gameId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["games", gameId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["leaderboard", gameId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, queryClient]);
}
```

## Leaderboard Subscription

```typescript
// src/hooks/realtime/use-leaderboard-subscription.ts
export function useLeaderboardSubscription(gameId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`leaderboard-${gameId}`)
      // Player status changes (eliminations)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.new.status !== payload.old.status) {
            queryClient.invalidateQueries({ queryKey: ["leaderboard", gameId] });
          }
        }
      )
      // New picks (after deadline visibility)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "picks",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["leaderboard", gameId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, queryClient]);
}
```

## Broadcast Pattern (Custom Events)

```typescript
// Send custom event (e.g., typing indicator)
const channel = supabase.channel(`game-${gameId}`);

// Send
channel.send({
  type: "broadcast",
  event: "round-locked",
  payload: { round: 5 },
});

// Receive
channel.on("broadcast", { event: "round-locked" }, ({ payload }) => {
  console.log("Round locked:", payload.round);
});
```

## Quick Reference

| Event Type | Use Case |
|------------|----------|
| `INSERT` | New records (picks, players joining) |
| `UPDATE` | Status changes (eliminations, game state) |
| `DELETE` | Removed records (kicked players) |
| `*` | All changes |
| `broadcast` | Custom events (no DB change) |

## Common Mistakes

❌ **Not cleaning up subscriptions**
```typescript
useEffect(() => {
  const channel = supabase.channel("x").subscribe();
  // Missing cleanup = memory leak
}, []);
```

✅ **Always remove channel**
```typescript
useEffect(() => {
  const channel = supabase.channel("x").subscribe();
  return () => supabase.removeChannel(channel);
}, []);
```

❌ **Subscribing without filter**
```typescript
// Receives ALL game changes - expensive
.on("postgres_changes", { event: "*", table: "games" }, ...)
```

✅ **Always filter to relevant data**
```typescript
.on("postgres_changes", {
  event: "*",
  table: "games",
  filter: `id=eq.${gameId}` // Only this game
}, ...)
```
```

**Step 5: Write auth-flows.md**

```markdown
# Authentication Flows

## Overview

Supabase Auth handles email/password and Google OAuth. Email verification required for paid games.

## Auth Methods

### Email/Password Signup

```typescript
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "securepassword",
  options: {
    data: {
      username: "player123",
    },
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

### Email/Password Login

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "securepassword",
});
```

### Google OAuth

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

### Logout

```typescript
const { error } = await supabase.auth.signOut();
```

## Auth Callback Handler

```typescript
// src/routes/auth.callback.tsx
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate({ to: "/dashboard" });
      }
    });
  }, [navigate]);

  return <div>Processing login...</div>;
}
```

## Auth Context

```typescript
// src/context/auth/auth-provider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    isLoading,
    isEmailVerified: user?.email_confirmed_at != null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

## Protected Route

```typescript
// src/lib/auth/require-auth.tsx
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/context/auth/auth-provider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

## Require Email Verification (Paid Games)

```typescript
export function RequireVerifiedEmail({ children }: { children: React.ReactNode }) {
  const { user, isEmailVerified, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!isEmailVerified) return <Navigate to="/verify-email" />;

  return <>{children}</>;
}
```

## Password Reset

```typescript
// Request reset
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset-password`,
});

// Update password (on reset page)
const { error } = await supabase.auth.updateUser({
  password: newPassword,
});
```

## Quick Reference

| Action | Method |
|--------|--------|
| Sign up | `supabase.auth.signUp()` |
| Sign in (password) | `supabase.auth.signInWithPassword()` |
| Sign in (OAuth) | `supabase.auth.signInWithOAuth()` |
| Sign out | `supabase.auth.signOut()` |
| Get session | `supabase.auth.getSession()` |
| Get user | `supabase.auth.getUser()` |
| Reset password | `supabase.auth.resetPasswordForEmail()` |
| Update user | `supabase.auth.updateUser()` |

## Common Mistakes

❌ **Checking auth client-side only**
```typescript
// Can be bypassed - insecure
if (user.role === "admin") showAdminPanel();
```

✅ **Enforce with RLS**
```sql
-- Database enforces access
CREATE POLICY "Admins only" ON admin_data
USING (auth.jwt() ->> 'role' = 'admin');
```

❌ **Not handling auth state changes**
```typescript
const user = supabase.auth.getUser(); // Stale after logout
```

✅ **Subscribe to auth changes**
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  setUser(session?.user ?? null);
});
```
```

**Step 6: Commit supabase-developer agent**

```bash
git add .agents/supabase-developer/
git commit -m "docs: add supabase-developer agent with skills

Includes:
- agent.md (main definition)
- rls-patterns.md (Row Level Security)
- edge-functions.md (Deno functions)
- realtime-subscriptions.md (live updates)
- auth-flows.md (authentication)"
```

---

### Task 12: Create stripe-integrator agent (5 files)

**Files:**
- Create: `.agents/stripe-integrator/agent.md`
- Create: `.agents/stripe-integrator/checkout-flow.md`
- Create: `.agents/stripe-integrator/connect-payouts.md`
- Create: `.agents/stripe-integrator/webhook-handling.md`
- Create: `.agents/stripe-integrator/refund-scenarios.md`

**Step 1: Write agent.md**

Cover: Stripe Checkout, Connect, webhooks, fee calculation, currency handling.

**Step 2: Write checkout-flow.md**

Cover: Session creation, success/cancel redirects, fee calculation (entry + ~2.9% + €0.25), currency (EUR/GBP/USD).

**Step 3: Write connect-payouts.md**

Cover: Connect account onboarding, identity verification, transfers, payout timing, dashboard links.

**Step 4: Write webhook-handling.md**

Cover: Signature verification, event types, idempotency, error handling.

**Step 5: Write refund-scenarios.md**

Cover: Game cancellation, player kicked, single rebuyer refund.

**Step 6: Commit**

```bash
git add .agents/stripe-integrator/
git commit -m "docs: add stripe-integrator agent with skills"
```

---

### Task 13: Create game-logic-developer agent (6 files)

**Files:**
- Create: `.agents/game-logic-developer/agent.md`
- Create: `.agents/game-logic-developer/pick-system.md`
- Create: `.agents/game-logic-developer/elimination-rules.md`
- Create: `.agents/game-logic-developer/auto-assign-logic.md`
- Create: `.agents/game-logic-developer/wipeout-modes.md`
- Create: `.agents/game-logic-developer/game-states.md`

**Step 1: Write agent.md**

Cover: Core game rules specialist, pick validation, eliminations, wipeout handling.

**Step 2: Write pick-system.md**

Cover: Validation (team playing, not used), deadline (first kickoff), modifications, visibility rules.

**Step 3: Write elimination-rules.md**

Cover: Win = survive, loss/draw = eliminated, batch processing, winner determination (single/multiple).

**Step 4: Write auto-assign-logic.md**

Cover: Trigger (unpicked at deadline), algorithm (alphabetical, skip used), edge case (all used = eliminated).

**Step 5: Write wipeout-modes.md**

Cover: Split mode (divide pool), rebuy mode (24h window, min 2), forfeit handling.

**Step 6: Write game-states.md**

Cover: State machine (pending → active → completed/cancelled), transitions, side effects.

**Step 7: Commit**

```bash
git add .agents/game-logic-developer/
git commit -m "docs: add game-logic-developer agent with skills"
```

---

### Task 14: Create football-api-syncer agent (4 files)

**Files:**
- Create: `.agents/football-api-syncer/agent.md`
- Create: `.agents/football-api-syncer/sync-strategy.md`
- Create: `.agents/football-api-syncer/data-mapping.md`
- Create: `.agents/football-api-syncer/fallback-handling.md`

**Step 1: Write agent.md**

Cover: football-data.org integration specialist.

**Step 2: Write sync-strategy.md**

Cover: Cron schedules (fixtures daily, results post-match), rate limits (10/min), incremental sync, retry with backoff.

**Step 3: Write data-mapping.md**

Cover: API response → database mapping, normalization, handling postponed matches.

**Step 4: Write fallback-handling.md**

Cover: API down scenarios, manual entry, recovery process.

**Step 5: Commit**

```bash
git add .agents/football-api-syncer/
git commit -m "docs: add football-api-syncer agent with skills"
```

---

### Task 15: Create notification-developer agent (3 files)

**Files:**
- Create: `.agents/notification-developer/agent.md`
- Create: `.agents/notification-developer/email-templates.md`
- Create: `.agents/notification-developer/in-app-system.md`

**Step 1: Write agent.md**

Cover: Email (Resend) and in-app notification specialist.

**Step 2: Write email-templates.md**

Cover: Template structure, variables, styling, notification types (round reminder, results, elimination, payout).

**Step 3: Write in-app-system.md**

Cover: Notification center, bell icon, read/unread state, notification types.

**Step 4: Commit**

```bash
git add .agents/notification-developer/
git commit -m "docs: add notification-developer agent with skills"
```

---

### Task 16: Create pwa-developer agent (3 files)

**Files:**
- Create: `.agents/pwa-developer/agent.md`
- Create: `.agents/pwa-developer/service-worker.md`
- Create: `.agents/pwa-developer/offline-strategy.md`

**Step 1: Write agent.md**

Cover: Progressive Web App specialist, service worker, offline support.

**Step 2: Write service-worker.md**

Cover: Registration, caching strategies (cache-first vs network-first), update handling.

**Step 3: Write offline-strategy.md**

Cover: Offline detection, fallback UI, sync on reconnect.

**Step 4: Commit**

```bash
git add .agents/pwa-developer/
git commit -m "docs: add pwa-developer agent with skills"
```

---

## Final Task

### Task 17: Final commit and verification

**Step 1: Verify all files created**

```bash
# Count files
find .agents -type f -name "*.md" | wc -l
# Expected: 37 (README + 7 copied + 6 agent.md + 23 skills)

# Plus AGENTS.md and CLAUDE.md = 39 total
```

**Step 2: Final commit (if any uncommitted changes)**

```bash
git status
# If clean, done
# If not, commit remaining
```

**Step 3: Summary**

- AGENTS.md: ~600-800 lines comprehensive guide
- .agents/README.md: Agent index
- 7 copied agents (adapted)
- 6 custom agents with 23 skill files
- Total: 39 files

---

## Execution Notes

- Each task is independent after Phase 1
- Tasks 4-10 (copied agents) can be done in parallel
- Tasks 11-16 (custom agents) can be done in parallel
- Commit after each task/agent
- Full implementation estimated at 2-3 hours

---

*Plan created: 2026-02-03*
