# Domain: Credit System (example)

Hand-authored companion to the auto-generated `.ai/domains/credit-system.md`. Save this at `.ai/domains/credit-system.md` only if you are not running the generator — otherwise let the script own that file and put hand-written context in a sibling file like `.ai/domains/credit-system.notes.md`.

## What this domain covers

The credit ledger, AI-call tracking, per-feature cost multipliers, admin adjustments, and the free-tier grant job.

## Entry points

- `lib/credits/index.ts` — public API (`assertCreditsAvailable`, `createTracker`, `getBalance`).
- `lib/credits/types.ts` — `FeatureType` enum, `FEATURE_COSTS` map.
- `app/api/credits/**` — balance and history endpoints.
- `app/api/admin/credits/**` — manual adjustments (auth-gated to admin role).
- `lib/credits/jobs/grant-free-tier.ts` — nightly cron, seeds new users.

## Database

- `CreditLedger` — immutable append-only ledger of all deltas.
- `CreditBalance` — denormalized current balance per user. Updated in the same transaction as the ledger write.
- `Feature` — lookup table mirroring the `FeatureType` enum. Do not drop entries — historical ledger rows reference them.

## Applicable rules

- `.claude/rules/credit-system.md` — the integration pattern (assert → tracker → finalize).
- `.claude/rules/prisma-migrations.md` — any schema change to `CreditLedger` requires a manual migration.

## Known gotchas

- `CreditLedger` rows are never deleted or updated. Corrections happen via a compensating row.
- Free-tier grants are idempotent by `(userId, grantDate)` — if the cron double-fires, the second run is a no-op.
- Legacy feature types `translate.v1` and `translate.v2` are frozen in the enum — do not reuse those names for new features.

## Recent incidents

- **2026-02** — a bug in `finalize()` double-counted tokens on streaming responses. Regression test in `__tests__/credits/streaming.test.ts`. If you change the streaming path, re-read that test before shipping.
