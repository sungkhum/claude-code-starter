# Guide 01 — Secrets Protection

The highest safety-gain-per-config-minute topic in Claude Code. AI tools have measurable secret-leak rates, and the defaults are not safe.

## The threat is real

- A CUHK study found 33.2% of Copilot completions on files that originally contained hard-coded secrets regenerated valid-looking secrets (2,702 of 8,127 suggestions). Claude-Code-assisted commits leak secrets at roughly 3.2% — about double the 1.5% human baseline.
- **CamoLeak** (CVSS 9.6, June 2025) — a GitHub Copilot Chat flaw that allowed silent exfiltration of source and secrets via image rendering.
- **Rule Files Backdoor** (Pillar Security, March 2025) — shared rule files can be weaponized to inject instructions into coding agents.
- **The Register, January 2026** — verified that Claude Code still reads `.env` files despite `.claudeignore` conventions and basic deny rules. **Defense in depth is mandatory.**

## Five layers. Any one is bypassable. Stack them.

### Layer 1 — `.claude/settings.json` deny rules

See `templates/settings.json`. Deny `Read(./.env*)` *and* deny `Bash(cat .env*)` — a `Read` deny does NOT block `cat` via Bash. Patterns to include at minimum:

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./**/*.pem)",
      "Read(./**/id_rsa)",
      "Bash(cat .env*)",
      "Bash(cat */.env*)",
      "Bash(printenv)",
      "Bash(env)"
    ]
  }
}
```

**Warning:** deny-rule enforcement has regressed in multiple releases (GitHub issues #6699, #13340, #18160, #6631, #24846). This is one layer, not the only layer.

### Layer 2 — `PreToolUse` hook (deterministic enforcement)

Hooks are the only surface that reliably blocks. Exit code 2 blocks and feeds stderr back to Claude:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Read|Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_input.file_path // empty' | grep -E '(\\.env($|\\.|/)|\\.pem$|id_rsa$|/secrets/|service-account.*\\.json)' && { echo 'Blocked: sensitive file' >&2; exit 2; } || exit 0"
      }]
    }]
  }
}
```

Community packages: `file-guard`, `claude-ignore`, `nopeek`.

### Layer 3 — pre-commit secret scanning

Catches whatever slipped past Layers 1–2. Gitleaks (150+ regex patterns, millisecond-fast) at commit time; TruffleHog (800+ detectors, verifies keys are still live against the provider) in CI. Run both.

```bash
npx husky init
echo 'gitleaks protect --staged --verbose --redact' > .husky/pre-commit
```

Install:
- macOS: `brew install gitleaks`
- Debian/Ubuntu: download from https://github.com/gitleaks/gitleaks/releases
- Docker: `docker pull zricethezav/gitleaks:latest`

### Layer 4 — vault injection (keep plaintext off disk)

The real win. If there's no `.env` file, there's nothing for an agent to read:

```bash
op run --env-file=.env.1password -- npm run dev      # 1Password
doppler run -- npm run dev                            # Doppler
infisical run -- npm run dev                          # Infisical
aws-vault exec prod -- npm run dev                    # AWS
```

`.env.1password` contains only references like `STRIPE_KEY="op://Prod/Stripe/api_key"` — safe to commit.

Pick whichever vault your team already uses. Don't add a new one for Claude Code — migrate what you have.

### Layer 5 — prompt hygiene

Never paste `.env` contents into chat. Reference by variable name (`process.env.STRIPE_KEY`). Before sharing a transcript, pipe it through a redactor:

```bash
gitleaks detect --no-git --source=transcript.txt
```

Treat the context window as a logged, exportable surface. Because it is.

---

## `.gitignore` / `.claudeignore` — don't rely on these

Claude Code *partially* respects `.gitignore` (excludes from @-mentions) but the `Glob` and `Bash` tools can bypass it. There is no official `.claudeignore` — community hooks implement it. Ignore files are hygiene, not security. Security = `permissions.deny` + hooks + vault injection.

---

## If a secret DOES leak — rotate-first protocol

1. **Revoke at the provider first** (AWS, Stripe, OpenAI dashboard). A leaked key is compromised the second it's pushed. History scrubbing is secondary.
2. **Scrub git history.** `git filter-branch` is deprecated. Use `git filter-repo` or BFG:
   ```bash
   git filter-repo --invert-paths --path .env
   # or
   bfg --delete-files .env && git reflog expire --expire=now --all && git gc --prune=now --aggressive
   ```
3. **Force-push:** `git push origin --force --all && git push origin --force --tags`. Pause here — force-push is destructive; confirm with the team.
4. **Notify collaborators to re-clone** — commit IDs have changed.
5. **Re-audit** with `trufflehog git file://. --only-verified` and check the provider's audit logs for unauthorized use between leak and rotation.

---

## Checklist for tomorrow

1. Paste the Layer 1 deny block into `.claude/settings.json`.
2. Install `gitleaks`, drop the one-liner into `.husky/pre-commit`.
3. Pick one service and move its secrets from `.env` to your vault.
4. Run `gitleaks detect` over the last 30 days of your own commits before you close the laptop.

---

## References

- [How to Protect Your .env From Claude Code (dev.to)](https://dev.to/boucle2026/how-to-protect-your-env-from-claude-code-28f8)
- [Claude Code settings docs](https://code.claude.com/docs/en/settings)
- [Claude Code hooks guide](https://code.claude.com/docs/en/hooks-guide)
- [The Register, Jan 2026](https://www.theregister.com/2026/01/28/claude_code_ai_secrets_files/)
- [CamoLeak writeup (Legit Security)](https://www.legitsecurity.com/blog/camoleak-critical-github-copilot-vulnerability-leaks-private-source-code)
- [Rule Files Backdoor (Pillar Security)](https://www.pillar.security/blog/new-vulnerability-in-github-copilot-and-cursor-how-hackers-can-weaponize-code-agents)
- [GitHub: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [git filter-repo guide](https://www.git-tower.com/learn/git/faq/git-filter-repo)
