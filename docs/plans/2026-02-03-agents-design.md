# AGENTS.md and .agents/ Design Document

**Date:** 2026-02-03
**Status:** Draft
**Version:** 1.0

---

## Overview

Design for comprehensive Claude AI assistant documentation for Guess to Survive project. Includes main AGENTS.md guide and .agents/ directory with specialized agents and embedded skills.

## Decisions Summary

| Decision | Choice |
|----------|--------|
| AGENTS.md scope | Full comprehensive (~600-800 lines) |
| Base approach | Fork tenant-ops-ui, adapt for Supabase/Stripe |
| Agent strategy | Copy 7 global + create 6 custom |
| Directory structure | Agents with embedded skills (Option 3) |
| Patterns location | Consolidated into .agents/ (no separate .patterns/) |
| React version | 19 |
| i18n | Setup ready, English only v1 |
| Analytics | PostHog (free tier) |
| Edge Functions hosting | Supabase Cloud (managed) |
| Test DB strategy | Local Supabase CLI |
| Schema in AGENTS.md | Key tables inline |

---

## Directory Structure

```
guess-to-survive/
├── AGENTS.md                    # Main guide (~600-800 lines)
├── CLAUDE.md                    # Points to @AGENTS.md
└── .agents/
    ├── README.md                # Agent index + usage guide
    │
    │── # Copied from global (flat files, adapted)
    ├── frontend-developer.md
    ├── unit-tester.md
    ├── integration-tester.md
    ├── shadcn-ui-builder.md
    ├── accessibility-tester.md
    ├── typescript-pro.md
    ├── code-reviewer.md
    │
    │── # Custom with embedded skills (folders)
    ├── supabase-developer/
    │   ├── agent.md
    │   ├── rls-patterns.md
    │   ├── edge-functions.md
    │   ├── realtime-subscriptions.md
    │   └── auth-flows.md
    ├── stripe-integrator/
    │   ├── agent.md
    │   ├── checkout-flow.md
    │   ├── connect-payouts.md
    │   ├── webhook-handling.md
    │   └── refund-scenarios.md
    ├── game-logic-developer/
    │   ├── agent.md
    │   ├── pick-system.md
    │   ├── elimination-rules.md
    │   ├── auto-assign-logic.md
    │   ├── wipeout-modes.md
    │   └── game-states.md
    ├── football-api-syncer/
    │   ├── agent.md
    │   ├── sync-strategy.md
    │   ├── data-mapping.md
    │   └── fallback-handling.md
    ├── notification-developer/
    │   ├── agent.md
    │   ├── email-templates.md
    │   └── in-app-system.md
    └── pwa-developer/
        ├── agent.md
        ├── service-worker.md
        └── offline-strategy.md
```

**Total: 39 files**
- 1 AGENTS.md
- 1 CLAUDE.md
- 1 .agents/README.md
- 7 copied agent files
- 6 agent.md files (custom)
- 23 skill files

---

## AGENTS.md Table of Contents

```markdown
# Claude AI Assistant Guide - Guess to Survive

## 1. Project Context
   - Overview (football prediction survival game)
   - Target market, platform (PWA web app)

## 2. Technology Stack
   - Core: React 19, TypeScript, Vite
   - Routing & State: TanStack Router, Query
   - UI: Tailwind CSS 4, shadcn/ui, Framer Motion
   - Forms: React Hook Form, Zod
   - Backend: Supabase (Auth, PostgreSQL, Edge Functions, Realtime)
   - Payments: Stripe (Checkout, Connect)
   - Data: football-data.org API
   - Analytics: PostHog
   - Email: Resend
   - Testing: Vitest, Playwright, MSW

## 3. Architectural Principles
   - Agent-first development (check .agents/ before implementing)
   - Code style standards (function declarations, named exports, strict TS)
   - YAGNI ruthlessly

## 4. Directory Organization
   - Route structure (TanStack Router file-based)
   - Service layer structure
   - Hooks structure (api/, shared/, ui/)
   - Supabase Edge Functions structure
   - Constants & config structure

## 5. Implementation Patterns
   - DataTable route pattern
   - Simple route pattern
   - Forms & validation pattern
   - Drawer pattern (create/edit)
   - Context provider pattern

## 6. Real-time Patterns
   - Supabase Realtime subscriptions
   - Live leaderboard updates
   - Game state broadcasting

## 7. Payment Flows
   - Checkout → payment → join game
   - Stripe Connect onboarding
   - Payout processing
   - Refund scenarios

## 8. Game State Machine
   - States: pending → active → completed/cancelled
   - Round lifecycle
   - Elimination processing

## 9. Scheduled Jobs
   - Fixture sync (daily cron)
   - Result sync (post-matchday)
   - Round processing

## 10. External API Integration
   - football-data.org rate limits (10/min)
   - Error handling & fallbacks
   - Data mapping

## 11. Responsible Gaming
   - Self-exclusion implementation
   - Spending history tracking
   - Legal compliance checklist

## 12. Authentication & Authorization
   - Supabase Auth (email + Google OAuth)
   - Row Level Security policies
   - Email verification for paid games

## 13. Database Schema
   - Key tables inline (users, games, picks, etc.)

## 14. Styling Standards
   - Tailwind CSS design tokens
   - Responsive breakpoints
   - Dark theme compliance
   - Typography hierarchy

## 15. Accessibility Requirements
   - WCAG 2.1 AA compliance
   - data-testid attributes
   - aria-label requirements
   - Keyboard navigation

## 16. Testing Requirements
   - Coverage targets (90%+)
   - Unit tests (Vitest)
   - E2E tests (Playwright)
   - Local Supabase CLI for testing
   - Resolution testing

## 17. i18n Setup
   - react-i18next configuration
   - English only for v1
   - Translation key conventions

## 18. Analytics (PostHog)
   - Event tracking conventions
   - Page view tracking
   - User identification

## 19. Error Handling
   - Service layer errors
   - Supabase error mapping
   - Toast notifications

## 20. Common Commands
   - Dev, test, build, lint, supabase

## 21. Anti-Patterns
   - What NOT to do

## 22. Success Criteria Checklist
   - Before considering feature "done"
```

---

## Copied Agents Adaptation

| Agent | Key Adaptations |
|-------|-----------------|
| frontend-developer | React 19 only, remove Vue/Angular, add Supabase/Stripe context, PostHog tracking |
| unit-tester | Supabase client mocking, game state test utilities, remove Fourth references |
| integration-tester | Local Supabase CLI setup, Stripe test mode, game flow testing |
| shadcn-ui-builder | Minimal changes (generic enough) |
| accessibility-tester | Minimal changes (generic enough) |
| typescript-pro | Minimal changes (generic enough) |
| code-reviewer | Add Supabase RLS review, Stripe security checks |

---

## Custom Agent Format

```markdown
---
name: agent-name
description: Use when... (triggering conditions)
tools: Read, Write, Edit, Bash, Glob, Grep, [specific tools]
---

# Agent Name

## Context
Who you are, what you specialize in

## Objective
What you aim to achieve

## Constraints
Project-specific rules, patterns to follow

## Skills (reference embedded files)
- @skill-file.md for specific patterns

## Workflow
Step-by-step execution flow

## Checks
Before/during/after checklists

## Output
Expected deliverables, handoff format

## Emergency Procedures
What to do when things go wrong
```

---

## Custom Agents Detail

### supabase-developer/

**agent.md:** Supabase Auth, PostgreSQL, RLS, Edge Functions, Realtime specialist

**Skills:**
- `rls-patterns.md` - RLS policy patterns (user data, manager access, public content)
- `edge-functions.md` - Deno Edge Function patterns, error handling, secrets
- `realtime-subscriptions.md` - Channel subscriptions, presence, broadcast
- `auth-flows.md` - Email/password, Google OAuth, email verification

### stripe-integrator/

**agent.md:** Stripe Checkout, Connect, webhooks, payouts specialist

**Skills:**
- `checkout-flow.md` - Session creation, success/cancel handling, fee calculation
- `connect-payouts.md` - Account onboarding, identity verification, transfers
- `webhook-handling.md` - Signature verification, event processing, idempotency
- `refund-scenarios.md` - Cancellation, kick refunds, rebuy refunds

### game-logic-developer/

**agent.md:** Core game rules, picks, eliminations, wipeout modes specialist

**Skills:**
- `pick-system.md` - Validation, deadlines, modifications, visibility
- `elimination-rules.md` - Win/loss/draw processing, batch updates, winner determination
- `auto-assign-logic.md` - Alphabetical assignment, skip used teams, edge cases
- `wipeout-modes.md` - Split mode, rebuy mode, forfeit handling
- `game-states.md` - State machine, transitions, side effects

### football-api-syncer/

**agent.md:** football-data.org integration, sync, data mapping specialist

**Skills:**
- `sync-strategy.md` - Cron schedules, rate limits, incremental sync, retry
- `data-mapping.md` - API response → database mapping, normalization
- `fallback-handling.md` - API down scenarios, manual entry, recovery

### notification-developer/

**agent.md:** Email (Resend) and in-app notifications specialist

**Skills:**
- `email-templates.md` - Template structure, variables, styling
- `in-app-system.md` - Notification center, read/unread, bell icon

### pwa-developer/

**agent.md:** Progressive Web App, service worker, offline specialist

**Skills:**
- `service-worker.md` - Registration, caching strategies, updates
- `offline-strategy.md` - Offline detection, fallback UI, sync on reconnect

---

## Skill File Format

```markdown
# Skill Name

## Overview
Core concept in 1-2 sentences

## When to Use
- Specific scenarios/triggers
- When NOT to use

## Pattern
Code examples, before/after comparisons

## Quick Reference
Table or bullets for scanning

## Common Mistakes
What goes wrong + fixes

## Examples
Real implementation from this project
```

---

## Implementation Phases

### Phase 1: Foundation
1. Create AGENTS.md (~600-800 lines)
2. Create .agents/README.md (index + usage)
3. Create CLAUDE.md (points to @AGENTS.md)

### Phase 2: Copied Agents
4. Copy + adapt frontend-developer.md
5. Copy + adapt unit-tester.md
6. Copy + adapt integration-tester.md
7. Copy + adapt shadcn-ui-builder.md
8. Copy + adapt accessibility-tester.md
9. Copy + adapt typescript-pro.md
10. Copy + adapt code-reviewer.md

### Phase 3: Custom Agents
11. Create supabase-developer/ (5 files)
12. Create game-logic-developer/ (6 files)
13. Create stripe-integrator/ (5 files)
14. Create football-api-syncer/ (4 files)
15. Create notification-developer/ (3 files)
16. Create pwa-developer/ (3 files)

---

## File Count Summary

| Category | Files |
|----------|-------|
| Root docs | 2 (AGENTS.md, CLAUDE.md) |
| .agents/README.md | 1 |
| Copied agents | 7 |
| Custom agent.md | 6 |
| Skill files | 23 |
| **Total** | **39** |

---

*Document generated: 2026-02-03*
