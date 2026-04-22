# Guide 06 — Hooks

Hooks fire on lifecycle events. They are the only enforcement surface in Claude Code that consistently blocks — `CLAUDE.md` and `permissions.deny` are suggestions; hooks are enforcement.

## Three to start with

This covers ~80% of the value:

### 1. `PreToolUse` — the only *blocking* hook

Guard destructive commands and sensitive paths. Exit code 2 blocks the tool call and feeds stderr back to Claude so it knows why.

Uses:
- Block writes to `.env*`, `.pem`, `secrets/**`.
- Block `rm -rf /`, `git push --force`, `drop table`, `delete from`, `truncate`.
- Gate migration commands behind a confirmation.

See `templates/settings.json` for the two starter hooks (sensitive-file block and destructive-Bash block).

### 2. `PostToolUse` — side effects after tool calls

Runs after a tool succeeds. Use for:
- Auto-format on Edit/Write (prettier, biome, ruff).
- Run `tsc --noEmit` after each edit.
- Regenerate `.ai/repo-map.md` on code change.
- Append to an audit log.

Keep these fast. Every post-hook adds latency to the agent's loop.

### 3. `Stop` — fires when Claude finishes a response

Uses:
- Desktop notifications ("task ready").
- "Did you run tests?" nudges.
- Auto-commit prompts.
- Write a session summary to a log.

---

## Three handler types

- **`command`** — shell script. Receives JSON on stdin, returns exit code.
- **`prompt`** — single-turn model eval with `$ARGUMENTS`.
- **`agent`** — subagent with `Read`/`Grep`/`Glob` for deeper verification.

For safety-critical checks (blocking sensitive paths), use `command`. Deterministic, auditable, no second LLM call in the critical path.

---

## Level up later: `UserPromptSubmit`

Injects context on every user turn. Powerful, easy to overdo.

Good uses:
- Current git branch / working directory status.
- Recent failing test names (so the agent knows what to fix first).
- A one-line house-style reminder relevant to what the user is asking.

Bad uses:
- Anything over ~500 tokens — your context budget evaporates.
- Large dumps that duplicate what's already in `CLAUDE.md`.
- Dynamic content the agent doesn't actually need per-turn.

Rule of thumb: if you wouldn't paste it into every single prompt by hand, don't inject it automatically.

---

## Production patterns

### Pre-commit quality gate

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_input.file_path // empty' | grep -E '\\.(ts|tsx|js|jsx|json|md)$' | xargs -I {} npx --no-install prettier --write {} 2>/dev/null || true"
      }]
    }]
  }
}
```

### Regenerate the codebase index

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "node scripts/generate-repo-map.mjs >/dev/null 2>&1 || true"
      }]
    }]
  }
}
```

### Append every Bash call to an audit log

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "jq -c '{ts: now|todate, cmd: .tool_input.command}' >> .claude/audit.log"
      }]
    }]
  }
}
```

Add `.claude/audit.log` to `.gitignore`. Review weekly; it's gold when something weird happened and you need to reconstruct.

---

## Debugging hooks

- Hooks swallow stdout by default — write to stderr for human-visible output.
- Set a `CLAUDE_HOOK_DEBUG=1` env var and `[ "$CLAUDE_HOOK_DEBUG" = "1" ] && set -x` at the top of the script while iterating.
- Test the hook against a fake JSON payload without Claude in the loop:
  ```bash
  echo '{"tool_input":{"file_path":".env"}}' | your-hook-script
  echo "exit: $?"
  ```

---

## When hooks bite back

- **Slow hooks slow the whole agent loop.** A `PostToolUse` formatter that takes 4 seconds turns every edit into a 4-second stall. Profile; cap at ~500ms.
- **Noisy hooks train the user to ignore all hook output.** If your hook complains on every benign edit, developers stop reading the messages that actually matter.
- **Hooks are per-project but can leak.** A `command` hook runs in the shell — it has `$PATH`, `$HOME`, your SSH agent. Don't assume sandboxing just because the hook is scoped to a project.

---

## References

- [Claude Code hooks guide](https://code.claude.com/docs/en/hooks-guide)
- [Claude Code settings reference](https://code.claude.com/docs/en/settings)
- [`disler/claude-code-hooks-mastery`](https://github.com/disler/claude-code-hooks-mastery) — example patterns
- [Pixelmojo: Hooks for production-quality CI/CD patterns](https://www.pixelmojo.io/blogs/claude-code-hooks-production-quality-ci-cd-patterns)
- [dev.to: Git hooks with Claude Code + Husky](https://dev.to/myougatheaxo/git-hooks-with-claude-code-build-quality-gates-with-husky-and-pre-commit-27l0)
