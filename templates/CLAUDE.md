# {{PROJECT_NAME}}

{{ONE_LINE_DESCRIPTION — what the codebase does, who it serves. Two lines max.}}

## Commands

```bash
{{INSTALL}}              # e.g. npm install / pip install -e .
{{DEV}}                  # e.g. npm run dev
{{TEST}}                 # e.g. npm run test:run
{{BUILD}}                # e.g. npm run build
{{MIGRATE}}              # e.g. npx prisma migrate deploy  (delete if N/A)
{{CODEGEN}}              # e.g. npx prisma generate        (delete if N/A)
```

## Tech Stack

{{ONE LINE — language, framework, database, hosting. Examples:
"Next.js 16 (App Router), React 19, TypeScript 5.9, Postgres (Railway), Prisma 7, hosted on Railway"
"Python 3.12, FastAPI, Postgres, SQLAlchemy, hosted on Fly.io"}}

## Critical Rules

Non-negotiables. The things the agent would get wrong without being told. Delete anything that isn't a *real* gotcha for this repo — empty slots are better than fake rules.

### Shell & OS

- {{EXAMPLE — "On macOS, no `grep -P` — use `grep -E`. No `sed -i` without `''` — correct: `sed -i '' 's/old/new/' file`."}}
- {{EXAMPLE — "Quote file paths containing `()` or `[]` in shell commands: `git diff \"app/(app)/teams/[teamId]/page.tsx\"`"}}

### {{LANGUAGE OR FRAMEWORK GOTCHAS}}

- {{EXAMPLE — "ALWAYS import from `@/prisma-client`, NEVER from `@prisma/client` — builds will fail."}}
- {{EXAMPLE — "NEVER use `prisma migrate dev` or `prisma db push`. Manual migrations only — see `.claude/rules/prisma-migrations.md`."}}

### Every feature must

- {{EXAMPLE — "Track credits for every AI call — no exceptions. See `.claude/rules/credit-system.md`."}}
- {{EXAMPLE — "Pass all tests before committing — run `npm run test:run`."}}
- {{EXAMPLE — "Evaluate offline impact when adding API calls or changing save payloads."}}

## Codebase Index

(Only include this section once Step 6 of `claude-code-starter/SETUP.md` is done.)

`.ai/repo-map.md` is a small (<6 KB) always-loaded index. Detail files live alongside in `.ai/` and are loaded on demand. Auto-updated every commit via a pre-commit hook.

**Progressive loading — read only what the task needs:**

1. `.ai/repo-map.md` — index. Read first. Lists domains, entry points, and high-impact files.
2. `.ai/domains/<slug>.md` — read when the task touches that domain. One file per cross-cutting concept.
3. `.ai/routes.md` — full page + API route listing. Read only when you need exhaustive route info.
4. `.ai/symbols.md` — full export listing. For a specific symbol by name, prefer `Grep`.
5. `.ai/models.md` — ORM model names.
6. `.ai/dependency-graph.json` — full import graph. Read for refactor / impact analysis.

## Skills

(Only include this section if skills are installed and actually used.)

Invoke these skills when working on matching domains:
- `{{SKILL_NAME}}` — {{when to use it}}

## Rules Index

(Only include this section once `.claude/rules/` has files in it. Auto-loaded when the agent opens a matching path.)

| Rule file | Loads for | Content |
|-----------|-----------|---------|
| `{{rule-name}}.md` | `{{path glob}}` | {{one-line summary}} |

## Project Management

(Delete this section if you are not using PRDs / epics in git.)

PRDs in `.claude/prds/`, epics in `.claude/epics/`.

---

<!--
  Target: under 200 lines. Current: {{count}} lines.
  Every section earns its place or gets deleted.
  Last reviewed: {{YYYY-MM-DD}}.
-->
