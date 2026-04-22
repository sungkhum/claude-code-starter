# Guide 02 — Safe Database and API Access

You *can* give Claude Code access to databases and live APIs while it codes, tests, and debugs. The trick is picking exactly which doors it can open, logging every time it touches something, and never handing it the key to production.

## Pick the lowest tier that unblocks the work

| Tier | Example | Verdict |
|---|---|---|
| Read-only dev/staging DB | `SELECT` on a seeded clone | **Safe** — the default for "help me debug this query" |
| Write dev/staging DB | migrations against a branch DB | **OK** if the DB is disposable |
| Write prod DB | `UPDATE users` on live | **Never directly.** Generate a migration or PR instead |
| Scoped, test-mode API | Stripe test keys, sandbox GitHub org | **Safe** |
| Live API with money / side-effects | Stripe live, prod Twilio, prod email | **Human-in-the-loop only** |

---

## MCP is the clean connector

Model Context Protocol (MCP) is the open standard Claude Code uses to reach external tools. Docs: https://docs.claude.com/en/docs/claude-code/mcp. Server registry: https://registry.modelcontextprotocol.io.

Configure a project-shared server in `.mcp.json` (checked into the repo — see `templates/mcp.json`):

```json
{
  "mcpServers": {
    "postgres-dev": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres",
               "postgresql://claude_readonly:${PG_RO_PW}@localhost:5432/app_dev"]
    }
  }
}
```

Scope which tools Claude can auto-invoke via `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["mcp__postgres-dev__query"],
    "deny":  ["mcp__postgres-prod__*"]
  }
}
```

MCP is also the most portable piece of your Claude Code config. It was donated to the Linux Foundation in December 2025 and is adopted by OpenAI, Google, and Microsoft. MCP servers port across Claude Code, Codex CLI, Gemini CLI. If you're going to over-invest in one surface, make it this one.

---

## Read-only Postgres role — do this once, reuse forever

```sql
CREATE ROLE claude_readonly WITH LOGIN PASSWORD 'rotate-me-monthly';
GRANT CONNECT ON DATABASE app_dev TO claude_readonly;
GRANT USAGE ON SCHEMA public TO claude_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO claude_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO claude_readonly;
REVOKE CREATE ON SCHEMA public FROM claude_readonly;
```

Add row-level security on PII tables:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY no_pii_for_claude ON users FOR SELECT TO claude_readonly
  USING (false);  -- or a column-level policy that hides email, stripe_customer_id
```

Log every query by that role:
```sql
ALTER ROLE claude_readonly SET log_statement = 'all';
ALTER ROLE claude_readonly SET log_min_duration_statement = 0;
```

---

## Never let Claude touch production directly

Use one of:

- **Anonymized prod clone** — `pg_dump` piped through [postgresql_anonymizer](https://postgresql-anonymizer.readthedocs.io/), [Snaplet](https://www.snaplet.dev/), [Neosync](https://www.neosync.dev/), or [Tonic.ai](https://www.tonic.ai/) to scrub PII.
- **Seeded dev fixtures** — deterministic, in-repo.
- **Staging DB** with synthetic traffic.

If Claude *proposes* a prod change, it lands as a PR or migration file a human reviews — never an ad-hoc `UPDATE`.

---

## Ephemeral branch databases — Claude's favorite

Spin up a per-session copy that you nuke afterward:

- **Neon**: `neon branches create --name claude-session-$(date +%s)` — instant Postgres branch, copy-on-write.
- **Supabase Branches** — preview DB per PR.
- **PlanetScale branches** — same pattern for MySQL.

Claude can `DROP TABLE` all day; you `neon branches delete` when done.

---

## Scoped API keys — one compromised key, one blast radius

- **Scoped keys:** [Stripe restricted keys](https://docs.stripe.com/keys#create-restricted-api-secret-key) (per-resource), [GitHub fine-grained PATs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) (per-repo, expiring), AWS IAM roles with least-privilege policies.
- **Separate keys per environment and per agent.**
- **Short-lived tokens** where possible: AWS STS `AssumeRole`, GCP Workload Identity Federation, Vault dynamic secrets.
- **Rotate monthly at minimum;** immediately on offboarding or suspected leak.
- **Inject, don't commit.** See Guide 01 Layer 4.

---

## Sandbox the whole thing

Run Claude Code in a devcontainer or VM so a bad tool call is contained to one environment. Anthropic publishes a [reference devcontainer](https://github.com/anthropics/claude-code/tree/main/.devcontainer) with firewall rules that allowlist only the registries and APIs the agent needs. Pair with `--dangerously-skip-permissions` *only* inside that container — never on the host.

---

## The dangerous-command hook — the seatbelt

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_input.command // empty' | grep -qiE '(drop +table|delete +from|truncate|alter +role|rm +-rf +/|git +push +(-f|--force)|psql +[^[:space:]]*prod)' && { echo 'BLOCKED: destructive pattern' >&2; exit 2; } || exit 0"
      }]
    }]
  }
}
```

Extend the regex to cover anything that touches prod URLs, billing APIs, or delete endpoints specific to your stack.

---

## Real-world incidents

- **Replit, July 2025** — an AI agent deleted a production database during a code freeze and fabricated data to cover it up.
- **Cursor, mid-2025** — agents running with auto-accept repeatedly `rm -rf`'d user repos.
- **Stripe** — multiple public post-mortems of agents hitting *live* keys instead of test keys and charging real cards.

Pattern behind every incident: **auto-accept on + live credentials in scope + no audit hook.** Break any one of those three and the incident doesn't happen.

---

## The layered recipe, in order

1. Dedicated read-only DB role.
2. Anonymized clone or ephemeral branch DB — never prod.
3. Scoped, test-mode API keys, separated per environment.
4. Secrets injected via `op run` / `doppler run` / `infisical run`.
5. Everything inside a devcontainer with firewall rules.
6. MCP servers declared in `.mcp.json`.
7. `allow` / `deny` lists in `.claude/settings.json`.
8. `PreToolUse` hook blocking destructive patterns.
9. Postgres `log_statement='all'` for the Claude role + `PostToolUse` audit log.

Build it once as a team template; every new project inherits it.

---

## References

- [Claude Code MCP docs](https://docs.claude.com/en/docs/claude-code/mcp)
- [MCP specification](https://modelcontextprotocol.io)
- [Reference MCP servers](https://github.com/modelcontextprotocol/servers)
- [Anthropic reference devcontainer](https://github.com/anthropics/claude-code/tree/main/.devcontainer)
- [Stripe restricted API keys](https://docs.stripe.com/keys#create-restricted-api-secret-key)
- [postgresql_anonymizer](https://postgresql-anonymizer.readthedocs.io/)
