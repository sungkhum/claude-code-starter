# Guide 08 — Dependency Security

The second highest safety-gain-per-config-minute topic after secrets. Supply-chain attacks bypass every other control in this repo — deny rules don't help when the malware is inside a package your build already trusts.

## The threat is real

- **March 31, 2026** — attackers took over the maintainer account of **axios** (one of the most popular HTTP libraries) and published two backdoored versions. For ~3 hours anyone running `npm install` could have pulled malware onto their laptop or server. Attributed to a North Korea-linked threat actor.
- **99%** of open-source malware today targets **npm** specifically.
- **454,648 malicious npm packages** were published in 2025.
- Composer / Packagist (PHP) and NuGet (.NET) are also hit, though npm is by far the biggest target.
- Even if you don't write Node.js, your editors, build tools, and laptops pull npm packages. This applies to every repo.

> **You do not control the code in your dependencies.** Someone else wrote it, and someone else can take it over. Your job is to make sure their mistake does not become yours.

---

## 5 rules that apply everywhere

These 5 rules work the same way for **npm**, **Composer**, and **NuGet**. Every new project in this repo should meet them before it ships.

### Rule 1 — Pin exact versions

Do not use ranges like `^` or `~`. Pin to an exact version.

| Ecosystem | Bad | Good |
|---|---|---|
| npm | `"axios": "^1.12.2"` | `"axios": "1.15.1"` |
| Composer | `"guzzlehttp/guzzle": "^7.0"` | `"guzzlehttp/guzzle": "7.8.1"` |
| NuGet | `Version="13.*"` | `Version="13.0.3"` |

A range lets a clean install silently pull a newer version. If that version was compromised in the last few hours, you just installed malware.

### Rule 2 — Always commit your lockfile

Lockfiles remember the exact resolved version of every direct *and transitive* dependency.

- **npm** → `package-lock.json`
- **Composer** → `composer.lock`
- **NuGet** → `packages.lock.json` *(enable if not enabled)*

Never add the lockfile to `.gitignore`. Never delete it to "fix" a problem. It is your safety net.

### Rule 3 — Use the "clean install" command in CI and production

Same idea in every ecosystem: fail if the lockfile and project file disagree.

- **npm** → `npm ci` (**not** `npm install`)
- **Composer** → `composer install` (**not** `composer update`)
- **NuGet** → `dotnet restore --locked-mode`

The build uses exactly what was tested. If someone edits the project file without updating the lockfile, the build fails loudly instead of silently pulling new code.

### Rule 4 — Wait before adopting new versions

Unless there is a security patch you must apply immediately, **do not rush to the latest version**.

The Center for Internet Security recommends a **60-day cooldown** for new package versions. Most compromised versions are detected and removed within hours to days. A 60-day wait would have protected you from:

- The **September 2025** chalk / debug compromise (18 packages, 2.6 billion weekly downloads)
- The **March 2026** axios compromise

Update on a cadence (monthly or quarterly), not because "there is a new version."

### Rule 5 — Turn off install scripts when you can

Most supply-chain attacks execute through **install scripts** — code that runs automatically when you install the package.

- **npm** → `npm config set ignore-scripts true` globally, then re-enable per package as needed
- **Composer** → dependency scripts do not auto-run from packages (safer by default)
- **NuGet** → very limited script execution (safest by default)

If a package truly needs its install script (for example, `bcrypt`, `puppeteer`, `sharp` in npm), allow it specifically for that package only.

---

## Quick reference

| Task | npm | Composer | NuGet |
|---|---|---|---|
| Pin exact version | `"pkg": "1.2.3"` | `"pkg": "1.2.3"` | `Version="1.2.3"` |
| Lockfile | `package-lock.json` | `composer.lock` | `packages.lock.json` |
| Clean install | `npm ci` | `composer install` | `dotnet restore --locked-mode` |
| Scan for known CVEs | `npm audit` | `composer audit` | `dotnet list package --vulnerable` |
| Verify signatures | `npm audit signatures` | *(Packagist)* | *(NuGet.org)* |

---

## Telling Claude Code about this policy

Two concrete things to do in this repo so the agent follows the rules without being re-reminded every session:

1. **Path-triggered rule.** Drop a file at `.claude/rules/dependencies.md` that loads whenever the agent opens `package.json`, `composer.json`, a `.csproj`, or a lockfile. Use `examples/rule-dependencies.md` as a shape. The rule should forbid ranges, forbid `npm update` / `composer update` without explicit approval, and require a clean-install command in CI-adjacent scripts.

2. **Pre-commit audit (optional).** `templates/pre-commit` ships with a commented-out block that runs `npm audit` / `composer audit` / `dotnet list package --vulnerable` on staged manifest changes. Uncomment only the ecosystem(s) you use — these are fast enough to run at commit time on small to mid-sized projects.

You can also deny-list the update commands in `.claude/settings.json` so the agent cannot silently bump versions:

```json
"deny": [
  "Bash(npm update*)",
  "Bash(npm install -g*)",
  "Bash(composer update*)",
  "Bash(dotnet add package*)"
]
```

Trade-off: the agent will ask on every legitimate upgrade. If that's too noisy, drop the denies and rely on the path-triggered rule + pre-commit audit.

---

## If you think a package is compromised

1. **Act fast, but do not panic.**
2. **Check your lockfile.** What version is actually installed?
3. **Check the published advisory.** Which versions are affected?
4. **If you are on a bad version:**
   - Pin to a known-good older version
   - Run the clean install command (`npm ci`, `composer install`, `dotnet restore --locked-mode`)
   - **Rotate every secret the app has access to** — API keys, tokens, database passwords. See the rotate-first protocol in `guides/01-secrets.md`.
   - Check your server for unusual network traffic or unexpected processes
5. **Tell the team.** Other projects may be affected.

---

## Tools we recommend

No single tool catches everything. Use a layered approach — same philosophy as secrets.

- **Dependabot** *(GitHub, free)* — alerts on disclosed CVEs, opens patch PRs.
- **Socket.dev** *(free tier)* — catches **supply-chain attacks** (compromised maintainer accounts, obfuscated code, suspicious install scripts) *before* they're published as CVEs. This is the tool that catches axios-style attacks.
- **`npm audit` / `composer audit` / `dotnet list package --vulnerable`** *(built-in)* — catches known CVEs in your current lockfile.

Install Dependabot and Socket on every production repo. They are free and take ten minutes to set up.

---

## Checklist for tomorrow

1. Open `package.json` / `composer.json` / the `.csproj` and remove every `^` / `~` / `*`. Run the clean install to refresh the lockfile.
2. Confirm the lockfile is tracked in git and not in `.gitignore`.
3. Switch CI from `npm install` → `npm ci` (or the equivalent).
4. Enable Dependabot and Socket on the repo.
5. Drop `.claude/rules/dependencies.md` (from `examples/rule-dependencies.md`) into place so Claude Code won't silently re-introduce ranges.

---

## References

- [CISA advisories](https://www.cisa.gov/news-events/cybersecurity-advisories)
- [GitHub Advisory Database](https://github.com/advisories)
- [Socket.dev blog](https://socket.dev/blog) — best source for npm supply-chain news
- [OWASP NPM Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html)
- [CIS — Software Supply Chain Security Guide](https://www.cisecurity.org/insights/white-papers/cis-software-supply-chain-security-guide)
