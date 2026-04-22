---
paths:
  - "__tests__/**"
  - "**/*.test.*"
  - "**/*.spec.*"
description: "Testing conventions — Vitest, mock helpers, what to test"
---

# Testing

## Commands

```bash
npm run test:run        # Run all tests once
npm run test            # Watch mode
npm run test:coverage   # With coverage report
```

All tests must pass before committing. The pre-commit hook does not run tests (too slow) — run them manually.

## Framework

Vitest. Configured in `vitest.config.ts`. jsdom environment for React components, node for API routes and lib code.

## What to test

- **Pure functions in `lib/`** — unit tests. Fast, many per file.
- **API routes in `app/api/`** — integration tests that hit the handler, not the full HTTP layer.
- **Prisma queries** — integration tests against a real database, not mocks. Mocked ORM tests have lied in this repo before (see commit log).
- **React components** — smoke tests for critical flows only. Do not snapshot-test for visual regression.

## Mocks

Use the mock helpers in `__tests__/helpers/`:

```ts
import { mockUser, mockCreditLedger, freshDb } from "@/__tests__/helpers";

beforeEach(async () => {
  await freshDb(); // Truncates + reseeds the integration DB
});
```

## Common mistakes

- **Mocking Prisma.** We do not mock the database. Use the integration helpers.
- **Testing implementation details.** Test behavior; refactors should not break tests.
- **Over-snapshotting.** A snapshot that changes on every PR trains reviewers to rubber-stamp.
- **Shared state across tests.** Every `describe` block should be reorderable. If reordering breaks a test, the test is wrong.
