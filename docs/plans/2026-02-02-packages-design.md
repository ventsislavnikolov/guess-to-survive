# Package Dependencies Design

**Version:** 1.0
**Date:** 2026-02-02
**Status:** Approved

## Overview

Package dependencies for Guess to Survive - a football prediction survival game built with React + Vite + TypeScript and Supabase backend.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Testing | Vitest + RTL + Playwright | Full stack coverage for payment-critical app |
| Code Quality | Biome | Fast, single tool for lint + format |
| Git Hooks | Husky + lint-staged | Industry standard, reliable |
| Package Manager | pnpm | Strict deps, fast installs, disk efficient |
| Commit Linting | Commitlint | Enables semantic-release automation |
| TypeScript | Standard strict | Good balance of safety vs verbosity |
| CI/CD | Full pipeline | Lint, typecheck, test, build on every PR |
| Releases | Semantic-release | Zero-touch versioning from commits |
| Forms | React Hook Form + Zod | Best shadcn/ui integration, shared schemas |
| Dates | date-fns | Tree-shakeable, timezone support |
| Icons | Lucide React | shadcn/ui default, consistent |
| Error Tracking | Sentry | MCP integration available, critical for payments |
| Animations | Framer Motion | Full power for UI polish |

## Production Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-router": "^1.95.1",
    "@tanstack/react-query": "^5.64.2",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/typography": "^0.5.16",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.474.0",
    "framer-motion": "^12.4.7",
    "react-hook-form": "^7.54.2",
    "@hookform/resolvers": "^4.1.0",
    "zod": "^3.24.1",
    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.2.0",
    "@supabase/supabase-js": "^2.48.1",
    "@stripe/stripe-js": "^5.5.0",
    "@sentry/react": "^9.1.0"
  }
}
```

## Dev Dependencies

### Build & TypeScript

```json
{
  "devDependencies": {
    "vite": "^6.1.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.3",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@tanstack/router-devtools": "^1.95.1",
    "@tanstack/react-query-devtools": "^5.64.2",
    "@tanstack/router-vite-plugin": "^1.95.1",
    "supabase": "^2.19.7"
  }
}
```

### Testing

```json
{
  "devDependencies": {
    "vitest": "^3.0.5",
    "@vitest/coverage-v8": "^3.0.5",
    "@vitest/ui": "^3.0.5",
    "@testing-library/react": "^16.2.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^26.0.0",
    "msw": "^2.7.0",
    "@playwright/test": "^1.50.1",
    "playwright": "^1.50.1"
  }
}
```

### Code Quality & Git Hooks

```json
{
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "husky": "^9.1.7",
    "lint-staged": "^15.4.3",
    "@commitlint/cli": "^19.7.1",
    "@commitlint/config-conventional": "^19.7.1"
  }
}
```

### Release Automation

```json
{
  "devDependencies": {
    "semantic-release": "^25.0.2",
    "@semantic-release/commit-analyzer": "^13.0.1",
    "@semantic-release/release-notes-generator": "^14.1.0",
    "@semantic-release/changelog": "^6.0.3",
    "@semantic-release/git": "^10.0.1",
    "@semantic-release/github": "^12.0.2",
    "@semantic-release/npm": "^13.1.3"
  }
}
```

## Package Counts

- **Production:** 19 packages
- **Development:** 29 packages
- **Total:** 48 packages

## Configuration Files Required

After installation, these config files need to be created:

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite bundler config |
| `tsconfig.json` | TypeScript compiler options |
| `biome.json` | Linting and formatting rules |
| `commitlint.config.js` | Commit message rules |
| `.lintstagedrc` | Pre-commit file checks |
| `.husky/pre-commit` | Git hook script |
| `.husky/commit-msg` | Commit lint hook |
| `vitest.config.ts` | Unit test config |
| `playwright.config.ts` | E2E test config |
| `.releaserc` | Semantic-release config |
| `.github/workflows/ci.yml` | GitHub Actions pipeline |

## shadcn/ui Components

Not listed above because they're copied into project (not npm dependencies). Initialize with:

```bash
pnpm dlx shadcn@latest init
```

Then add components as needed:

```bash
pnpm dlx shadcn@latest add button card form input ...
```
