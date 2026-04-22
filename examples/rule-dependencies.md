---
paths:
  - "package.json"
  - "package-lock.json"
  - "**/package.json"
  - "composer.json"
  - "composer.lock"
  - "**/*.csproj"
  - "Directory.Packages.props"
  - "packages.lock.json"
description: "Dependency hygiene — pinned versions, committed lockfiles, no silent upgrades"
---

# Dependency Hygiene

Supply-chain attacks bypass every other safety layer in this repo. These rules are non-negotiable when editing any package manifest. Full background in `guides/08-dependencies.md`.

## Pin exact versions. No ranges.

| Ecosystem | Bad | Good |
|---|---|---|
| npm | `"axios": "^1.12.2"` | `"axios": "1.15.1"` |
| Composer | `"guzzlehttp/guzzle": "^7.0"` | `"guzzlehttp/guzzle": "7.8.1"` |
| NuGet | `Version="13.*"` | `Version="13.0.3"` |

If you're adding a new dependency, pin the current latest-minus-one if possible. Do not write `"^x.y.z"` or `"~x.y.z"`.

## Never touch the lockfile directly

- `package-lock.json`, `composer.lock`, and `packages.lock.json` are generated output. Commit them, never hand-edit.
- If the lockfile is missing: something is wrong. Do NOT run `npm install` / `composer update` to "fix" it — ask the human first.

## Upgrade commands require explicit human approval

Do not run, and do not suggest running, any of the following without the user confirming the upgrade is intentional:

- `npm update`, `npm install <pkg>@latest`, `npm install -g …`
- `composer update`, `composer require <pkg>:dev-main`
- `dotnet add package`, `dotnet outdated --upgrade`

Prefer the clean-install commands (`npm ci`, `composer install`, `dotnet restore --locked-mode`) whenever you only need to materialize what the lockfile already specifies.

## The 60-day cooldown

The Center for Internet Security recommends a 60-day wait on any new package version unless it patches a known CVE. The Sept-2025 chalk/debug compromise and the March-2026 axios compromise would both have been avoided by this rule. When the user asks "why not the latest?", point them at `guides/08-dependencies.md`.

## When editing a manifest

1. Confirm the exact version exists on the registry (no typos — typosquatting is a known vector).
2. Run the clean install (`npm ci`, `composer install`, `dotnet restore --locked-mode`) — not the update command.
3. Commit the lockfile in the same commit as the manifest change.
4. Leave a one-line note in the PR description explaining *why* this dep is needed — makes review catch pointless additions.

## If a dependency looks compromised

Stop. Do not run `npm install` / `composer install` / `dotnet restore` until the user has checked the advisory. See the response protocol in `guides/08-dependencies.md`.
