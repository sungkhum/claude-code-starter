# Claude Code Starter

A template repository for teams who want to configure a codebase for **Claude Code** — Anthropic's CLI coding agent — so it reads your project, follows your rules, stays safe around secrets, and keeps its own context fresh.

You can apply this setup by hand, but the point of this repo is that **Claude Code can do it for you**. Clone or copy these files into your project, then ask Claude Code to read `SETUP.md` and execute the steps.

---

## Who this is for

- You already use Claude Code and want it to act more like a disciplined teammate than smart autocomplete.
- You want safe defaults for secrets, permissions, and destructive commands.
- You want your codebase to *describe itself* to any AI agent, without hand-maintaining a sprawling `CLAUDE.md`.
- You want to steal the patterns (CLAUDE.md layout, path-triggered rules, auto-generated `.ai/` index, hooks) without reinventing them.

---

## How to use this repo

### Option A — let Claude Code set your repo up

1. Copy this entire directory into the root of your project (or clone it and copy the contents you want).
2. Open your project in Claude Code.
3. Paste this prompt:

   > Read `claude-code-starter/SETUP.md` and walk me through the setup for this codebase. Start at Level 1 of the maturity ladder. Ask before making irreversible changes. Before writing any `CLAUDE.md` or rules, inspect the repo so the content reflects *this* codebase, not a template.

4. Claude Code will read `SETUP.md`, inspect your repo, and apply the steps in order. It will pause on anything that needs your call (vault choice, which skills to install, which domains to index).

### Option B — apply by hand

Open `SETUP.md` and work through it yourself. Every step links to a detailed guide in `guides/` and a drop-in template in `templates/`.

---

## What's in this repo

```
claude-code-starter/
├── README.md                   # You are here
├── SETUP.md                    # The checklist Claude Code (or you) executes
├── MATURITY_LADDER.md          # Levels 0–5: where to start, when to climb
├── templates/                  # Drop-in files — adapt, don't paste blindly
│   ├── CLAUDE.md               # Skeleton root config
│   ├── settings.json           # Permissions + hooks for .claude/
│   ├── mcp.json                # MCP server config
│   └── pre-commit              # Husky pre-commit (gitleaks + repo-map)
├── scripts/
│   └── generate-repo-map.mjs   # Zero-dep Node script that builds .ai/
├── examples/
│   ├── rule-credit-system.md   # Example .claude/rules/ file
│   ├── rule-dependencies.md    # Pin exact versions, no silent upgrades
│   ├── rule-testing.md
│   └── domain-file.md          # Example .ai/domains/<slug>.md
└── guides/                     # Deep dives, referenced from SETUP.md
    ├── 01-secrets.md
    ├── 02-db-api-access.md
    ├── 03-codebase-index.md
    ├── 04-rules.md
    ├── 05-skills.md
    ├── 06-hooks.md
    ├── 07-project-management.md
    └── 08-dependencies.md      # Supply-chain defense (npm / Composer / NuGet)
```

---

## The core idea, in one page

1. **Keep `CLAUDE.md` small.** Under 200 lines. It loads on every turn — every byte competes with the user's actual question.
2. **Point, don't paste.** `CLAUDE.md` should name entry points, commands, and non-negotiables, then point to detail files (`.ai/domains/*.md`, `.claude/rules/*.md`) that load on demand.
3. **Auto-generate the codebase index.** A single pre-commit script regenerates `.ai/repo-map.md` from the actual code. Stops drifting.
4. **Path-triggered rules over global rules.** Narrow rules in `.claude/rules/*.md` with glob frontmatter load only when the agent opens a matching file. Easier to follow, easier to keep honest.
5. **Lock down permissions.** Deny reads of `.env*`, deny destructive bash patterns, add one `PreToolUse` hook as a seatbelt. Assume deny rules alone are bypassable — stack layers.
6. **Start small. Earn every rung of the ladder.** The worst setup is an elaborate one you stop maintaining. See `MATURITY_LADDER.md`.

---

## A warning worth reading before you start

Elaborate Claude Code setups are easy to build, easier to rot, and hardest to measure. If you can't tie a piece of config to a specific pain it prevents, don't add it. Anthropic's own docs recommend `CLAUDE.md` under 200 lines. Stripe runs Claude Code across 1,370 engineers with essentially no custom config. The point of this repo is not "apply everything" — it's "know what's available, start small, climb only when pain demands it."

`MATURITY_LADDER.md` calls out where on the ladder each piece sits and what problem it solves. Read that before you copy.

---

## License

MIT. Use it, fork it, strip it for parts.
