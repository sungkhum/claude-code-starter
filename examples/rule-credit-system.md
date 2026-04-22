---
paths:
  - "lib/credits/**"
  - "app/api/**"
description: "Credit tracking — every AI call must track credits"
---

# Credit System

Every AI call in this codebase must track credits. No exceptions.

## The pattern

```ts
import { assertCreditsAvailable, createTracker } from "@/lib/credits";

export async function POST(req: Request) {
  const { userId, prompt } = await req.json();

  // 1. Check before invoking the model. Throws if user is out of credits.
  await assertCreditsAvailable(userId, { feature: "translate.paragraph" });

  // 2. Start a tracker — captures input tokens automatically on finalize.
  const tracker = createTracker(userId, "translate.paragraph");

  const response = await gemini.generateContent({ prompt });

  // 3. Finalize after the call returns — records output tokens and deducts credits.
  await tracker.finalize(response);

  return Response.json(response);
}
```

## Why

- **Billing integrity.** An AI call that doesn't track credits is free compute the user didn't pay for.
- **Abuse prevention.** `assertCreditsAvailable` is where we rate-limit bad actors.
- **Cost observability.** The tracker feeds our per-feature cost dashboard. Missing entries = blind spots.

## Feature types

`feature` must be a registered value from `lib/credits/types.ts`. Adding a new feature requires:

1. A new entry in `FeatureType` enum.
2. A credit-cost multiplier in `FEATURE_COSTS`.
3. A one-line note in `.ai/domains/credit-system.md` so reviewers see the addition.

## Common mistakes

- Calling `tracker.finalize()` in a `finally` block without checking whether the API call succeeded — double-deducts on retry paths.
- Forgetting to `await` `assertCreditsAvailable` — the async boundary is enforced, an unawaited promise won't throw.
- Using a literal string instead of the enum — TypeScript catches this, but only with `strict: true` on.
