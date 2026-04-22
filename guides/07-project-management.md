# Guide 07 — Project Management in the Repo

Optional. If your team already has Jira, Linear, or GitHub Issues as the source of truth, skip this guide. If you don't, or you want agents to read the full spec *before* coding, in-repo PM earns its keep.

## The shape

Two directories, committed with the code:

```
.claude/
├── prds/                         # Product Requirement Docs, markdown, one per major feature
│   ├── 2026-q2-translation-v2.md
│   └── 2026-q2-offline-sync.md
└── epics/
    └── <feature-slug>/
        ├── epic.md               # Status, PRD link, architecture, technical approach
        ├── 37.md                 # Story — numbered, 2–4 task breakdown
        ├── 38.md
        └── 39.md
```

## Why this is valuable

1. **Agents load the PRD + epic + story** to understand scope *before* coding. Scope drift drops.
2. **Reviewers see what was planned vs. what shipped.** The story is the acceptance criteria.
3. **Context survives beyond any chat window.** Six months later, "why did we do it this way?" has an answer.
4. **Versioned with the code.** A spec change shows up in the diff alongside the implementation.

## The PRD shape

Keep it short. One page. Sections:

- **Problem** — what user pain does this solve?
- **Users** — who specifically (segment, ICP, internal stakeholder)?
- **Success criteria** — measurable. Not "better UX" — "median time-to-first-save drops below 5s."
- **Non-goals** — what we're explicitly not doing in this round.
- **Open questions** — flag the things that need a human decision.

## The epic shape

- **Status** — `draft | active | blocked | shipped | canceled`.
- **PRD link** — relative path to `.claude/prds/<file>.md`.
- **Architecture notes** — one paragraph. Data model changes, new services, major refactors.
- **Story list** — numbered, ordered, with a one-line summary of each.
- **Out-of-scope** — things that will be another epic.

## The story shape

- **Goal** — one sentence.
- **Acceptance criteria** — bullet list. Reviewable.
- **Tasks** — 2–4 tasks, each 30–90 min of work. If tasks are bigger, split the story.
- **Tests** — what must pass before this closes.
- **Dependencies** — other story numbers.

## Two established systems to consider

### CCPM — Claude Code Project Management

https://github.com/automazeio/ccpm

- GitHub Issues are the source of truth — the local `.claude/` files sync with them.
- Git worktrees enable parallel agent execution.
- Tasks flagged `parallel: true` can run concurrently without conflicts.
- Slash commands: `/pm:prd-new`, `/pm:prd-parse`, `/pm:epic-oneshot`, `/pm:issue-start`, `/pm:issue-sync`.

Good if your team already runs on GitHub Issues.

### BMAD-METHOD

https://github.com/bmad-code-org/BMAD-METHOD

- Layers an opinionated multi-agent workflow: analyst → PM → architect → SM → dev → QA → tech-writer.
- Explicit phases from brief through retrospective.
- Works well for teams that want a clear process and are willing to learn one.

## When NOT to do in-repo PM

- You already have a working Jira/Linear/GitHub Issues workflow. Don't run two systems.
- Small team, one person per feature, spec lives in the PR description. PRD → epic → story is overhead that buys you nothing until multiple agents/people coordinate on one feature.
- The team will commit to PM-in-git for one week and then stop, leaving stale PRDs that mislead future work.

## Starting small

You don't need CCPM or BMAD. Start with **one** PRD for your next feature, **one** epic with 3–5 stories. Point Claude Code at them:

> Read `.claude/prds/feature-x.md` and `.claude/epics/feature-x/epic.md`. Implement story 37. The story's acceptance criteria are the tests you need to make pass.

See how it feels. If the spec is tight enough that Claude shipped it correctly on the first pass, keep going. If the spec was too vague and Claude guessed wrong, you have data — either sharpen the spec or go back to prompt-driven scoping.

---

## References

- [CCPM (Automaze)](https://github.com/automazeio/ccpm)
- [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
