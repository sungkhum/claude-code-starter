# Maturity Ladder

A capacity ladder, not a climbing directive. Move up a rung only when you can name the specific pain the next rung eliminates. Stripe runs Claude Code across 1,370 engineers at roughly Level 0 and ships fine. Elaborate setups that rot into overhead are worse than no setup.

| Level | What you have | What it fixes | Failure mode if skipped | Failure mode if over-invested |
|---|---|---|---|---|
| **0** — autocomplete | No `CLAUDE.md`, no `.claude/`. | N/A | Agent re-discovers conventions every session. Inconsistent patterns, repeated mistakes. | N/A |
| **1** — permissions + secrets + deps | `.claude/settings.json` deny list, `PreToolUse` hook, `gitleaks` pre-commit, vault for secrets, pinned dependency versions + committed lockfile + clean-install in CI. | Agent can't read `.env`, can't run `rm -rf`, can't commit secrets, can't silently pull a compromised package version. | Secrets leak. Destructive commands run. A compromised `axios` / `chalk` release lands in the build. This is the **only mandatory rung** if you use Claude Code on a real codebase. | None. Permissions and pinning can't really be over-invested — they're negative space. |
| **2** — minimal `CLAUDE.md` | Under 200 lines. Project identity, commands, non-negotiables, critical rules. | Agent stops re-discovering conventions every session. | Agent keeps making the same mistakes (wrong import paths, wrong test command, wrong migration workflow). | Paragraphs of philosophy the agent ignores. Aspirational language. Copy-pasted template text that doesn't match reality. |
| **3** — auto-generated `.ai/` index | Pre-commit hook regenerates `repo-map.md` + `domains/*.md` + `symbols.md` from code. | Stops `CLAUDE.md` drift cold. Every commit keeps the index fresh. | On codebases over ~200 files, `CLAUDE.md` either grows past any reasonable cap or goes stale within weeks. | A 4-pass AST parser no one maintains. Index files the agent loads but never uses. |
| **4** — path-triggered rules | `.claude/rules/*.md` with glob frontmatter. Narrow, enforceable patterns. | Specific recurring mistakes (migration workflow, ORM gotchas, credit tracking, logging) get caught before they ship. | Generic rules in `CLAUDE.md` get ignored in practice. Path-triggered rules show up exactly when they matter. | 15 rule files nobody has read this quarter. Rules that contradict each other. |
| **5** — skills, hooks, PM in git | Portable skills via `npx skills add`. Lifecycle hooks. Product work in `.claude/prds/` + `.claude/epics/`. | Agent works like a disciplined teammate — plans, then executes, against a spec it loaded itself. | Agents start every feature with no context on scope. Reviewers see "what" but not "why." | Heavy opinionated workflow (BMAD/CCPM) the team half-adopts. Every tiny task goes through PRD → epic → story. Agents spend more time loading skills than coding. |

---

## Where to start

**Everyone: Level 1.** Permissions and secrets protection. No exceptions. This is 30 minutes of work and takes the largest class of incidents off the table.

**Most teams: Level 2.** Under 200 lines, written from real knowledge of the repo. Resist the urge to copy a template wholesale.

**Teams > 10 engineers OR codebases > 200 files: Level 3.** Drift starts hurting. Auto-generation pays for itself within a month.

**Teams shipping the same class of bug repeatedly: Level 4.** One rule per recurring mistake. Not before.

**Only if:**
- Your team already has a reasonable velocity baseline, and
- The thing blocking further acceleration is "agents keep starting work without understanding scope," and
- You are willing to maintain the new surface area

... **climb to Level 5.** Otherwise don't.

---

## When to descend

Every quarter, ask:

- Which rules have we never updated?
- Which domain files do we load but never reference?
- Which skills did we install and never invoke?
- What's the line count of `CLAUDE.md`, and can each section name the pain it prevents?

Delete what doesn't earn its keep. A smaller surface is always better than a rotting one.

---

## The through-line

Your codebase should describe itself. The agent should read that description efficiently. Permissions and reversibility should be non-negotiable. Everything else is situational — build it when pain demands it, delete it when it stops earning its keep.

The modal developer is worse at authoring context than silence. Default to less.
