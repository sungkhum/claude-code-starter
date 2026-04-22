# Setup Checklist — read this and execute

**Audience:** Claude Code, running in the user's project root. (A human can follow along too — every step works by hand.)

**Your job:** walk the user up the maturity ladder (see `claude-code-starter/MATURITY_LADDER.md`) one rung at a time. Apply each step only if the pain it prevents is real for this project. Pause before irreversible actions (force-push, rm, deleting uncommitted work). Ask before installing paid or account-scoped tools (vaults, MCP servers with API keys).

**Guiding principle:** The modal developer is worse at authoring context than silence. Default to less. A 200-line `CLAUDE.md` that reflects *this* codebase beats a 6 KB one copy-pasted from a template.

---

## Step 0 — Inspect before you configure

Before writing or copying any file, read the repo. You cannot author a useful `CLAUDE.md` from a template alone.

- [ ] Read the root `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` / `Gemfile` — whichever exists. Note the language, framework, and scripts.
- [ ] Read the top-level README.
- [ ] Run `git log --oneline -20` to see the cadence and style of commits.
- [ ] List the top-level directories (`ls -la`) and identify entry points: `app/`, `src/`, `pages/`, `lib/`, `server/`, `cmd/`.
- [ ] Identify the test command, the dev command, the build command, the migration command (if any), and the codegen command (if any).
- [ ] Note any existing `CLAUDE.md`, `AGENTS.md`, `.claude/`, `.ai/`, or `.cursorrules` — don't overwrite without asking.

Summarize your findings to the user in under 10 bullets before proceeding. Ask them to confirm or correct.

---

## Step 1 — Lock down permissions (highest safety-gain-per-minute)

Before any context engineering, make the agent safe. This is Level 0 → Level 1 on the ladder and the single largest safety gain per minute of config. See `guides/01-secrets.md` for the full picture.

- [ ] If `.claude/` does not exist, create it.
- [ ] Copy `claude-code-starter/templates/settings.json` to `.claude/settings.json` and **tailor the deny list to this repo**. At minimum the deny list must cover:
  - `Read(./.env)` and `Read(./.env.*)`
  - `Read(./**/*.pem)`, `Read(./**/id_rsa)`
  - `Read(./secrets/**)` (adjust to the real path)
  - `Bash(cat .env*)`, `Bash(cat */.env*)` — deny rules on Read do NOT block Bash `cat`
  - Any other secret-holding paths specific to this repo (`credentials.json`, `service-account.json`, `.pgpass`, etc.)
- [ ] Make sure `.env*` is in `.gitignore`. Add `.claude/settings.local.json` too.
- [ ] Confirm with the user which *destructive* Bash patterns should be denied outright (`rm -rf`, `git push --force`, direct `psql` against production URLs). Paste them into the `deny` list.
- [ ] Tell the user: deny rules are one layer. They have regressed in multiple releases (GitHub issues #6699, #13340, #18160, #6631). The `PreToolUse` hook in the next step is the enforcement surface.

**Acceptance:** run `/permissions` in-session (ask the user to do this) and verify the deny list is loaded.

---

## Step 2 — Add a PreToolUse hook for destructive commands

Hooks are the only enforcement surface that consistently honors blocking. `CLAUDE.md` and deny rules are guidance; hooks are enforcement.

- [ ] The template `templates/settings.json` ships with two example hooks: one that blocks reads of sensitive files, one that blocks destructive Bash patterns (`drop table`, `delete from`, `truncate`, `rm -rf`, force-push).
- [ ] Review the patterns with the user. Extend the regex to cover any project-specific danger (prod URLs, billing APIs, delete endpoints).
- [ ] Verify the hooks work: ask the user to request a `cat .env` — the hook should block with an exit code 2 and a clear message.

**Acceptance:** a deliberate destructive request is blocked before execution.

---

## Step 3 — Install `gitleaks` and wire it into a pre-commit hook

Catches whatever slipped past Steps 1–2. Runs in milliseconds.

- [ ] Check if `husky` is installed (`ls .husky/` and look in `package.json` devDependencies).
- [ ] If not, and this is a Node project: `npm install --save-dev husky && npx husky init`. For other stacks, use `pre-commit` (Python), `lefthook`, or a plain `.git/hooks/pre-commit` — ask the user.
- [ ] Install gitleaks locally (`brew install gitleaks` on macOS; see `guides/01-secrets.md` for other OSes).
- [ ] Copy `claude-code-starter/templates/pre-commit` to `.husky/pre-commit` (or equivalent) and make it executable.
- [ ] Run `gitleaks detect --no-git --source=.` to scan the working tree. If anything is flagged, surface it to the user — do not auto-fix.
- [ ] Offer to run `gitleaks detect` over the last 30 days of git history so the user knows whether leaked secrets are already in the repo. If anything surfaces, walk them through the rotate-first protocol in `guides/01-secrets.md`.

**Acceptance:** a commit that introduces a fake AWS key is blocked locally.

---

## Step 4 — Lock down dependencies

Supply-chain attacks bypass every other safety layer. The **axios compromise (March 2026)** and **chalk/debug compromise (September 2025)** both shipped malware through packages this repo probably trusts transitively. This step is still Level 1 — it stops a whole class of incident that the secrets layer cannot. See `guides/08-dependencies.md` for the full picture.

- [ ] Open the project manifest (`package.json` / `composer.json` / `*.csproj`) and remove every `^`, `~`, or `*` version range. Pin to the exact currently-resolved version from the lockfile.
- [ ] Confirm the lockfile (`package-lock.json` / `composer.lock` / `packages.lock.json`) is tracked in git and NOT in `.gitignore`. For NuGet, enable it with `<RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>` if it doesn't exist yet.
- [ ] Switch CI (and any `npm run …` scripts that install) from `npm install` → `npm ci`. Composer: `composer install`. NuGet: `dotnet restore --locked-mode`.
- [ ] Offer to add `.claude/rules/dependencies.md` (copy from `examples/rule-dependencies.md`) so Claude Code auto-loads the pinning rule whenever it opens a manifest.
- [ ] Optionally, uncomment the dependency-audit block in `templates/pre-commit` for the ecosystem(s) this repo uses. Only one should run.
- [ ] Optionally, add these denies to `.claude/settings.json` so the agent cannot silently bump versions:
  ```json
  "Bash(npm update*)",
  "Bash(npm install -g*)",
  "Bash(composer update*)",
  "Bash(dotnet add package*)"
  ```
  Trade-off: the agent will ask on every legitimate upgrade. Skip if that's too noisy.
- [ ] Tell the user about the **60-day cooldown** on new versions (CIS recommendation) and install **Dependabot** + **Socket.dev** on the repo if they aren't already.

**Acceptance:** no version ranges remain in the manifest; `npm ci` (or equivalent) succeeds against the lockfile without network resolution drift.

---

## Step 5 — Write a minimal `CLAUDE.md`

Now context engineering. Under 200 lines. Aim for 100. It loads on every turn — every byte competes with the user's next question.

- [ ] If a `CLAUDE.md` already exists, read it and plan an *incremental* edit — do not replace wholesale without the user's OK.
- [ ] Otherwise, base a new file on `claude-code-starter/templates/CLAUDE.md`, adapted to what you learned in Step 0.
- [ ] Required sections, in order:
  1. **Project identity** — two lines. What the codebase does, who it serves.
  2. **Commands** — dev / build / test / migration / codegen commands, verbatim.
  3. **Tech stack** — one line.
  4. **Critical rules** — 3–8 non-negotiables. Things the agent would get wrong without being told. Real examples: "always import from `@/prisma-client`, never `@prisma/client`"; "no `grep -P` on macOS, use `grep -E`"; "never `prisma migrate dev`, manual migrations only"; "every AI call must track credits".
  5. **Skills to invoke** — short list of domain skills if relevant (e.g. `docx`, `prisma-orm-v7-skills`, `better-auth-best-practices`).
  6. **Rules index** — a table mapping `.claude/rules/*.md` paths to the glob they load for. (Only if rules exist — see Step 7.)
- [ ] Anti-patterns to avoid:
  - A "complete project overview" — agents don't need lore.
  - Paragraphs of philosophy — rules should be enforceable, not aspirational.
  - Duplicating content that already lives in the README or package.json.

**Acceptance:** `wc -l CLAUDE.md` is under 200. Every section earns its place.

---

## Step 6 — Auto-generate `.ai/` (the codebase index)

This is the jump from Level 2 to Level 3 on the maturity ladder — the biggest single lift for a mid-sized codebase. It stops `CLAUDE.md` drift cold by making the codebase describe itself.

See `guides/03-codebase-index.md` for full details.

- [ ] Copy `claude-code-starter/scripts/generate-repo-map.mjs` to `scripts/generate-repo-map.mjs`.
- [ ] Read it top to bottom — it is opinionated (Next.js + TypeScript + Prisma by default). **Adapt the directory patterns and parsers to this repo's language and layout before running.** Ask the user if you're unsure.
- [ ] Run it once: `node scripts/generate-repo-map.mjs`. Confirm `.ai/repo-map.md` is generated and is under 6 KB. If it's over, either tighten the clustering or raise the cap explicitly.
- [ ] Add `.ai/` to `.gitignore`? **No** — check it in so collaborators see the same index.
- [ ] Add a pre-commit step that regenerates it on every commit. For husky: append to `.husky/pre-commit`:
  ```bash
  node scripts/generate-repo-map.mjs >/dev/null 2>&1 && git add .ai/ 2>/dev/null || true
  ```
- [ ] Update `CLAUDE.md` with a "Codebase Index" section that explains the three loading tiers (repo-map → domains → routes/symbols/graph).
- [ ] Optional: add a `/ctx` slash command in `.claude/commands/ctx.md` so anyone can load a domain file on demand.

**Acceptance:** edit any file, commit, and `.ai/repo-map.md` updates automatically; `repo-map.md` stays under 6 KB.

---

## Step 7 — Path-triggered rules in `.claude/rules/`

Narrow, enforceable rules that auto-load when the agent opens a matching file path. Strictly better than cramming everything into `CLAUDE.md`.

See `guides/04-rules.md`. Examples in `examples/`.

- [ ] Create `.claude/rules/` if it doesn't exist.
- [ ] With the user, identify 2–5 **real** patterns that keep biting the team: testing conventions, migration workflow, ORM gotchas, credit/metering requirements, logging requirements, API-response shape.
- [ ] For each, write a rule file with YAML frontmatter naming the glob it applies to. Use `examples/rule-credit-system.md` as a shape reference.
- [ ] Do NOT fabricate rules. If the user can't name a pain, don't invent one.
- [ ] Add a Rules Index table to `CLAUDE.md` so the agent can see which rules exist before triggering them.

**Acceptance:** open a file that matches one of the globs and confirm the rule text shows up in the agent's context.

---

## Step 8 — Skills (optional, opinionated)

Skills are portable capabilities installable via `npx skills add`. The decision here is taste, not safety. Ask the user which apply.

See `guides/05-skills.md` for a curated shortlist and trade-offs.

- [ ] Do NOT install skills without asking. Some are large; all compete for the agent's attention.
- [ ] For a typical web-app team, 3–6 skills is plenty. More is noise.
- [ ] Reference them in `CLAUDE.md` under "Skills" so the agent knows when to invoke each.

---

## Step 9 — MCP servers (only if the project needs live DB / API access)

Skip this entire section if the team doesn't need Claude to hit live systems. Most tasks don't.

See `guides/02-db-api-access.md` for the full threat model.

- [ ] If the user wants live DB access: create a read-only DB role first (SQL in `guides/02-db-api-access.md`). Do NOT skip this.
- [ ] Never configure a production DB URL. Use an anonymized clone, a staging DB, or an ephemeral branch DB (Neon / Supabase / PlanetScale).
- [ ] Copy `templates/mcp.json` to `.mcp.json` at the repo root and fill in connection details.
- [ ] Scope which MCP tools Claude can auto-invoke via `.claude/settings.json` `permissions.allow` — default is prompt on every call.
- [ ] If you wire up a billing API (Stripe, Twilio), **use test-mode keys only**. Put live keys behind human-in-the-loop.

**Acceptance:** Claude can `SELECT` against dev DB but cannot `DROP`, `DELETE`, or see production.

---

## Step 10 — Project management in git (optional)

If the team already has Jira / Linear / GitHub Issues, this is redundant. If they don't, or they want agents to read the full spec before coding, it earns its keep.

See `guides/07-project-management.md`.

- [ ] `.claude/prds/` for product requirement docs, one markdown file per feature.
- [ ] `.claude/epics/<feature>/` for an `epic.md` plus numbered story files.
- [ ] Point the agent at the PRD + epic + relevant stories when starting work on a feature.
- [ ] Optional: install the CCPM or BMAD-METHOD slash commands. Heavy — only pick one up if the team commits to it.

---

## Step 11 — Stop climbing

When in doubt, stop climbing the ladder. The most common failure mode is a 6 KB `CLAUDE.md` with 12 rule files the team stopped maintaining. Delete entries that stop earning their keep. Revisit `MATURITY_LADDER.md` quarterly.

**Three things that beat any further config:**
1. A test suite that runs in under 30 seconds.
2. A build that runs in under 2 minutes.
3. A code-review culture that doesn't wave through AI-authored PRs.

If those three aren't in place, fix them before adding more `.claude/` complexity.

---

## Report back

When you finish a run, summarize for the user:
- Which steps you completed.
- Which you skipped and why.
- Any step that needs a human decision before it can be done (choosing a vault, confirming destructive-command patterns, authoring rules you couldn't infer safely).
- The current size of `CLAUDE.md` (line count) and `.ai/repo-map.md` (bytes).
- One concrete "next time we feel pain X, add step Y" note — so the user can climb the ladder intentionally later.
