# Guide 04 — Path-Triggered Rules

Rules are the second tier of context: hand-written patterns that auto-load when the agent opens a matching file.

## The shape

Each rule is a markdown file in `.claude/rules/` with YAML frontmatter naming the globs it applies to:

```yaml
---
paths:
  - "lib/credits/**"
  - "app/api/**"
description: "Credit tracking — every AI call must track credits"
---

# Credit System

Every AI call must:
1. Call `assertCreditsAvailable()` before invoking the model
2. Call `tracker.finalize()` after the call returns
3. Use a registered feature type from `lib/credits/types.ts`

[concrete code snippets]
```

When the agent opens `lib/credits/billing.ts`, the harness pattern-matches the path, loads the rule, and the agent sees it before writing a line.

See `examples/rule-credit-system.md` and `examples/rule-testing.md` for two full examples.

## Why path-triggered beats generic

- Generic rules ("always track credits!") get ignored in practice. Path-triggered rules show up exactly when they matter.
- Keeps the global context small. A 3 KB rule that applies to 5% of files shouldn't live in `CLAUDE.md` for 100% of turns.
- Forces you to write narrow, specific, enforceable rules — the kind agents actually follow.

## What makes a good rule

A rule earns its place if a reviewer can name:

1. **A recent PR** that would have been better if this rule had been loaded.
2. **The glob** the rule applies to — specific, not `**/*.ts`.
3. **The mistake** it prevents — concrete, not "write good code."
4. **The pattern** that replaces the mistake — with a code snippet.

If you can't name those four, the rule is aspirational, and aspirational rules get ignored.

## Rules worth writing (examples)

| Rule | What it covers |
|---|---|
| `credit-system.md` | Integration patterns for real-time, async, batch, and embedding routes; registered feature types; mandatory `assertCreditsAvailable()` + `tracker.finalize()` pair. |
| `offline-pwa.md` | Dexie schema versioning, 5-phase sync engine (auth → server state → conflict detect → flush outbox → refresh cache), offline-guard hook pattern, PWA gating. |
| `ux-patterns.md` | One rule: loading state continuity. Keep the button in loading state through navigation, reset only on error, toast on success. Prevents dead gaps and double-submits. |
| `testing.md` | Vitest setup, mock helpers, fixture patterns, what not to mock. |
| `prisma-migrations.md` | Manual migration workflow, never use `migrate dev` or `db push`, how to write a safe migration. |
| `logging.md` | Log levels, structured log fields, what NEVER to log (PII, secrets), how to redact. |
| `api-response-shape.md` | The canonical error envelope, the canonical pagination envelope, status-code discipline. |

## Rule vs. Skill

- A **rule** is a local standard for *this* codebase. Lives in `.claude/rules/`. Triggers on file paths.
- A **skill** is a portable capability that works across *any* codebase. Lives globally or in `.claude/skills/`. Triggers on task type.

You want both, but don't confuse them. Don't package project-specific gotchas as skills — they're brittle and contaminate other projects.

## Index rules in `CLAUDE.md`

Include a Rules Index table in `CLAUDE.md` so the agent can see which rules *exist* before it triggers one — helps it ask the right questions mid-task:

```markdown
| Rule file | Loads for | Content |
|-----------|-----------|---------|
| `credit-system.md` | `lib/credits/**`, `app/api/**` | Credit tracking pattern |
| `offline-pwa.md` | `lib/offline/**`, workspace components | Dexie schema + sync engine |
| `testing.md` | `__tests__/**`, `*.test.*` | Vitest setup, no-mock-Prisma rule |
```

## When to delete a rule

- Nobody on the team remembers writing it.
- It hasn't surfaced in a PR review in 3 months.
- It contradicts a newer rule in another file.
- The pattern it describes got refactored out of existence.

Every quarter, open `.claude/rules/` and ask which files still earn their keep. Delete the rest.

## Gotchas

- **Rule Files Backdoor** (Pillar Security, March 2025) — rule files can be weaponized via prompt-injection payloads hidden in plain-looking text. Review rules from third parties as carefully as you'd review dependencies.
- **Rule text counts toward context.** A 5 KB rule that loads on `app/**` pays 5 KB on every frontend task. Keep rules lean.
- **YAML frontmatter must be valid.** A broken glob means the rule never loads and nobody notices. Add a quick "open a matching file, verify the rule surfaces" test after any frontmatter change.
