# Playwright E2E Testing

## Commands

- Run Chromium E2E suite: `pnpm test:e2e`
- Run all Playwright projects: `pnpm test:e2e:all`
- Run E2E with Istanbul coverage + 85% gate: `pnpm test:e2e:coverage`

Coverage gates are enforced on critical E2E user journeys:

- `src/routes/index.tsx`
- `src/routes/spending-history.tsx`
- `src/components/protected-route.tsx`

## Playwright CLI Workflow

Use `playwright-cli` to explore flows and selectors before codifying tests:

1. `playwright-cli open http://127.0.0.1:4173 --headed`
2. `playwright-cli snapshot`
3. Interact with refs (`click`, `fill`, `type`, `press`)
4. Copy stable labels/roles into spec assertions

The committed test suite lives in `__tests__/e2e/` and runs through `@playwright/test`.

## Mock Backend

E2E tests run against a deterministic mocked Supabase API layer in:

- `__tests__/e2e/support/mock-supabase.ts`
- `__tests__/e2e/support/fixtures.ts`

This keeps tests fast and avoids flaky external dependencies while still exercising full UI journeys.
