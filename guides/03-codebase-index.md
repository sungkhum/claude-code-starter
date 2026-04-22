# Guide 03 — The `.ai/` Codebase Index

The biggest single lift on the maturity ladder. It's the jump from "hand-written `CLAUDE.md` that describes a codebase that no longer exists" to "the codebase describes itself, fresh every commit."

## The core insight

In March 2026 Vercel published a benchmark running identical Next.js tasks through four context setups:

| Setup | Pass rate |
|---|---|
| No docs | 53% |
| Skills (default) | 53% |
| Skills + explicit instructions | 79% |
| **AGENTS.md with compressed docs index** | **100%** |

**An always-loaded index outperforms on-demand skill discovery.** Three reasons:

1. **No decision points.** The agent never has to decide whether to consult docs — they're already in the system prompt.
2. **Consistent availability.** Content is present every turn. Skill-loading is asynchronous and race-prone.
3. **Low prompt sensitivity.** Minor wording differences in skill descriptions produced dramatically different results. The index pattern avoids that brittleness.

Source: https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals

**Honest caveat:** Vercel's benchmark is framework docs, not project setup. Don't read it as "bigger `CLAUDE.md` always wins." Anthropic's own guidance is "under 200 lines." What the data shows is that *a compressed index beats on-demand discovery* — not that you should load the kitchen sink every turn.

## The shape: progressive disclosure

```
.ai/
├── repo-map.md               # ~3 KB — always loaded
├── routes.md                 # ~12 KB — on demand
├── symbols.md                # ~18 KB — on demand
├── models.md                 # ~1 KB — on demand
├── dependency-graph.json     # ~150 KB — on demand
└── domains/
    ├── credit-system.md              # ~1.4 KB
    ├── offline-pwa.md                # ~1.0 KB
    ├── translation-workspace.md      # ~2.5 KB
    └── (one file per cross-cutting concept)
```

### Three loading tiers

| Tier | File | When it loads |
|---|---|---|
| 1 | `repo-map.md` | Always. Hard-capped <6 KB. Index of domains + entry points. |
| 2 | `domains/<slug>.md` | On demand by task. Lists 20–60 files for one domain plus applicable rules. |
| 3 | `routes.md`, `symbols.md`, `dependency-graph.json` | Search or full load. Only when the task needs exhaustive info (refactors, impact analysis). |

A typical task needs ~5–10 KB of context: repo-map + one domain file + maybe one rule. Never the full 200+ KB.

## The generator

`scripts/generate-repo-map.mjs` in this starter is a single zero-dependency Node script that:

- Walks `components/`, `lib/`, `hooks/`, `contexts/`, `app/`, `src/`.
- Parses `app/**/page.tsx` for page routes.
- Parses `app/api/**/route.ts` for API routes and HTTP methods (reads which `GET`/`POST`/`PATCH`/`DELETE` are exported).
- Parses `export function|const|class|type|interface|enum` for the symbols list.
- Clusters files by path patterns into per-domain files.
- Builds the import graph.
- **Fails the build if `repo-map.md` exceeds 6 KB** — index discipline is enforced in code.

**It's tuned for Next.js + TypeScript + Prisma.** Adapt it. Places to edit:

- `CODE_DIRS` — top-level directories to scan.
- `CODE_EXT` — file extensions.
- The `pageRoutes` / `apiRoutes` regex — change for Django URLs, FastAPI routers, Go handlers, Rails routes.
- `DOMAINS` — array of `{ slug, match }` entries. Empty by default; fill in once you know your cross-cutting concerns.
- Prisma section — swap for your ORM (SQLAlchemy models, ActiveRecord, Ent, etc.).

## The pre-commit hook

```bash
# .husky/pre-commit
node scripts/generate-repo-map.mjs >/dev/null 2>&1 && git add .ai/ 2>/dev/null || true
```

Every commit regenerates `.ai/` and auto-stages the changes. Silent success, never blocks a commit.

## Why this is a differentiator

Most public Claude Code setups rely on a hand-written `CLAUDE.md`. This pattern makes the codebase describe itself — and *stay* described, commit after commit. The before/after is striking: a hand-written `CLAUDE.md` that's six months stale vs. an auto-generated `.ai/` that updated on the last commit.

## Bonus: the `/ctx` slash command

A project-level slash command at `.claude/commands/ctx.md`:

```markdown
---
name: ctx
description: Load a domain context file from .ai/domains/. Usage /ctx <slug>.
---

Read the file `.ai/domains/{{args}}.md` and summarize what it says the current task should know about the "{{args}}" domain. If no args given, list the available slugs by running `ls .ai/domains/`.
```

Commit this so the whole team works from the same context surface. Typing `/ctx credit-system` loads the credit-system domain file on demand.

## When NOT to do this

- **Codebases under ~50 files.** The overhead isn't worth it. A 100-line `CLAUDE.md` is fine.
- **Teams that won't maintain the generator.** If the script breaks once and nobody fixes it, `.ai/` goes stale and you're worse off than hand-written docs (because now the stale index is *authoritative*-looking).
- **Non-standard stacks.** If you're on Elixir + LiveView, Rust + Axum, or some bespoke system, the parsing rules in the starter don't apply. Writing them fresh is a half-day project — budget for it before committing.

## References

- [Vercel: AGENTS.md outperforms skills in our agent evals](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)
- [Vercel agent skills KB](https://vercel.com/kb/guide/agent-skills-creating-installing-and-sharing-reusable-agent-context)
