# Guide 05 — Skills

Skills are portable agent capabilities. One command installs them; they work across Claude Code, Codex, Cursor, Gemini CLI, Copilot, and 40+ other agents. Browse at https://skills.sh and https://agentskills.io.

## Install syntax

```bash
npx skills add <org>/<repo>               # from GitHub
npx skills add <org>/<repo> -a claude     # Claude Code only
npx skills add --list <org>/<repo>        # browse the skills in a pack first
npx skills add --skill <name> <org>/<repo>  # install only one skill from a pack
```

## Pick on taste, not FOMO

Every skill installed is another thing the agent considers on every turn. Three is great. Six is fine. Twenty is a distraction engine.

Ask: "Does this skill do something I actually need, repeatedly, that I can't get from a well-written rule or a prompt?" If not, skip it.

## A reasonable starter stack for a web-app team

| Skill | What it does | When to invoke |
|---|---|---|
| `frontend-design` | Anthropic's official design-quality skill (270k+ installs). Teaches Claude a design system and philosophy so output avoids the generic "AI aesthetic." | Building components, pages, or artifacts that need distinctive visual quality. |
| `vercel-react-best-practices` | React / Next.js performance guidelines from Vercel Engineering. RSC boundaries, caching, streaming, common perf anti-patterns. | Writing, reviewing, or refactoring React/Next.js code. |
| `make-interfaces-feel-better` | Jakub Křehel's micro-details: mismatched radii on nested elements, optical (not geometric) centering, layered transparent box-shadows, `scale(0.96)` tactile feedback, 40×40px hit targets, interruptible CSS transitions over one-shot keyframes. | Polishing an interface before ship. |
| `code-review` | Adversarial review against a spec/story, acceptance criteria, and the actual git diff. Flags architectural and spec drift, not style. | Reviewing PRs before merge. |
| `edge-case-hunter` | Walks every branching path and boundary in a diff. Reports *only* unhandled cases. Complements `code-review`. | Second layer of review, usually run in parallel. |
| `ux-designer` | Produces wireframes, user flows, research plans, and a full UX spec. | Before any code on a new feature. |

## Skill packs (one install, many skills)

- **`coreyhaines31/marketingskills`** — 30+ marketing skills: `page-cro`, `copywriting`, `seo-audit`, `analytics-tracking`, `email-sequence`, `paid-ads`, `ab-test-setup`, `churn-prevention`, `referral-program`, `programmatic-seo`, `ai-seo`, `lead-magnets`, and more. For technical founders doing their own growth work.
- **`jakubkrehel/*`** — polish-focused design skills. `make-interfaces-feel-better` is from this collection.

## Other popular skills worth naming

- `superdesign` — frontend design agent that scaffolds UI/UX from a brief
- `animate` — purposeful animations and micro-interactions
- `critique` — UX evaluation with quantitative scoring
- `audit` — a11y + perf + theming technical audit with P0–P3 severity
- `simplify` — reviews changed code for reuse, quality, and efficiency
- `polish` — pre-ship alignment, spacing, consistency pass
- `shape` — runs a UX discovery interview and produces a design brief
- `impeccable` — production-grade frontend components that avoid generic AI aesthetics
- `overdrive` — pushes interfaces past conventional limits (shaders, spring physics, scroll-driven reveals)

## Stack-specific skills

When touching these domains, invoke the matching skill:

| Domain | Skill |
|---|---|
| Word, InDesign, OpenDocument files | `docx`, `idml`, `odt` |
| Gemini API | `google-gemini-api` |
| Claude API | `claude-api` |
| Prisma 7 | `prisma-orm-v7-skills` |
| Better Auth | `better-auth-best-practices` |
| Railway | `use-railway` |
| Cloudflare | `cloudflare-deploy`, `cloudflare-turnstile`, `cloudflare-r2`, `durable-objects` |
| RAG | `rag-implementation` |
| Tailwind v4 + shadcn | `tailwind-v4-shadcn`, `shadcn-ui` |
| PWA | `pwa-development` |

## Discovery

- https://skills.sh and https://agentskills.io — browse + search
- https://github.com/VoltAgent/awesome-agent-skills — 1000+ curated
- https://www.ui-skills.com/ — UI polish
- https://github.com/vercel-labs/skills — Vercel's reference skill library

## Reference them in `CLAUDE.md`

Add a short "Skills" section to `CLAUDE.md` naming the skills installed in this repo and when to use each. This helps the agent decide to invoke the right one instead of hoping the skill description alone triggers the right match.

## Caveat

Skills, subagents, slash commands, hooks, and `CLAUDE.md` are all Claude-Code-specific. MCP is the only piece of your setup that ports cleanly to other agents. If you're betting on stack flexibility, invest in MCP and keep skills lean.
