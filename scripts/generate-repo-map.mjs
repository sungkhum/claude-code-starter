#!/usr/bin/env node
// generate-repo-map.mjs
//
// Zero-dependency Node script that builds a small, always-loaded codebase index.
//
// Outputs:
//   .ai/repo-map.md        — hard-capped <6 KB, always loaded by Claude Code
//   .ai/routes.md          — full route listing (on-demand)
//   .ai/symbols.md         — exported functions/classes/consts (on-demand)
//   .ai/models.md          — ORM model names (on-demand)
//   .ai/dependency-graph.json — import graph
//   .ai/domains/<slug>.md  — one file per cross-cutting domain
//
// This is a STARTING POINT tuned to Next.js App Router + TypeScript + Prisma.
// Adapt the DIRS, parsing rules, and domain clustering to your stack.
// Run manually with: node scripts/generate-repo-map.mjs
// Wire into .husky/pre-commit so every commit refreshes the index.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

// ──────────────────────────────────────────────────────────────────────
// Configuration — edit for your repo
// ──────────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const OUT = join(ROOT, ".ai");

// Directories to scan. Add/remove for your stack.
const CODE_DIRS = ["app", "components", "lib", "hooks", "contexts", "src", "server"];

// Files to ignore — speeds scan, reduces noise.
const IGNORE_RE = /(^|\/)(node_modules|\.next|dist|build|coverage|\.turbo|\.ai|__mocks__|__snapshots__)(\/|$)/;
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

// Max bytes for repo-map.md. Hard cap — script exits non-zero if exceeded.
// Why: every byte loads on every turn. Discipline is enforced in code, not in review.
const MAX_REPO_MAP_BYTES = 6 * 1024;

// Domain clusters — customize for your codebase. Each entry produces one
// .ai/domains/<slug>.md. Patterns are plain substring matches on the relative path.
const DOMAINS = [
  // { slug: "credit-system", match: (p) => p.includes("lib/credits") || p.includes("app/api/credits") },
  // { slug: "translation-workspace", match: (p) => p.includes("workspace") && !p.includes("test") },
  // { slug: "offline-pwa", match: (p) => p.includes("lib/offline") || p.includes("service-worker") },
];

// ──────────────────────────────────────────────────────────────────────
// File walk
// ──────────────────────────────────────────────────────────────────────

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const rel = relative(ROOT, full);
    if (IGNORE_RE.test(rel)) continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (CODE_EXT.has(extname(name))) {
      out.push({ full, rel, size: st.size });
    }
  }
  return out;
}

const allFiles = CODE_DIRS.flatMap((d) => walk(join(ROOT, d)));

// ──────────────────────────────────────────────────────────────────────
// Parsing
// ──────────────────────────────────────────────────────────────────────

function readSafe(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

// Next.js App Router: app/**/page.(tsx|jsx|ts|js) → a route
const pageRoutes = allFiles
  .filter((f) => /(^|\/)app\/.*\/page\.(t|j)sx?$/.test(f.rel))
  .map((f) => ({
    route: "/" + f.rel.replace(/^app\//, "").replace(/\/page\.(t|j)sx?$/, "").replace(/\(.*?\)\//g, ""),
    file: f.rel,
  }));

// Next.js Route handlers: app/api/**/route.ts → an API route. Infer methods.
const apiRoutes = allFiles
  .filter((f) => /(^|\/)app\/.*\/route\.(t|j)sx?$/.test(f.rel))
  .map((f) => {
    const src = readSafe(f.full);
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"].filter((m) =>
      new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b|export\\s+const\\s+${m}\\b`).test(src)
    );
    return {
      route: "/" + f.rel.replace(/^app\//, "").replace(/\/route\.(t|j)sx?$/, ""),
      methods,
      file: f.rel,
    };
  });

// Exported symbols: function / const / class / type / interface / enum
const symbolRe = /^export\s+(?:async\s+)?(?:function|const|class|type|interface|enum|let|var)\s+([A-Za-z0-9_]+)/gm;
const symbols = allFiles.flatMap((f) => {
  const src = readSafe(f.full);
  const found = [];
  for (const m of src.matchAll(symbolRe)) {
    found.push({ name: m[1], file: f.rel });
  }
  return found;
});

// Import graph: file → [imports]. Relative and alias imports only.
const importRe = /(?:from\s+|import\s*\()\s*["']([^"']+)["']/g;
const graph = {};
for (const f of allFiles) {
  const src = readSafe(f.full);
  const imports = [];
  for (const m of src.matchAll(importRe)) imports.push(m[1]);
  graph[f.rel] = imports;
}

// Prisma models (if prisma/schema.prisma exists)
const schemaPath = join(ROOT, "prisma", "schema.prisma");
const modelNames = [];
try {
  const schema = readFileSync(schemaPath, "utf8");
  for (const m of schema.matchAll(/^model\s+([A-Za-z0-9_]+)\s*\{/gm)) modelNames.push(m[1]);
} catch {
  /* no prisma — fine */
}

// ──────────────────────────────────────────────────────────────────────
// Emit
// ──────────────────────────────────────────────────────────────────────

mkdirSync(OUT, { recursive: true });
mkdirSync(join(OUT, "domains"), { recursive: true });

// 1. repo-map.md — the always-loaded index. Must stay small.
const repoMap = [
  "# Repo Map",
  "",
  "Auto-generated by `scripts/generate-repo-map.mjs`. **Do not edit by hand** — changes are overwritten on every commit.",
  "",
  "## Numbers",
  "",
  `- Code files scanned: ${allFiles.length}`,
  `- Page routes: ${pageRoutes.length}`,
  `- API routes: ${apiRoutes.length}`,
  `- Exported symbols: ${symbols.length}`,
  `- ORM models: ${modelNames.length}`,
  "",
  "## On-demand detail files",
  "",
  "- `.ai/routes.md` — full route listing",
  "- `.ai/symbols.md` — exported symbols",
  "- `.ai/models.md` — ORM models",
  "- `.ai/dependency-graph.json` — full import graph",
  ...(DOMAINS.length ? ["- `.ai/domains/` — one file per cross-cutting domain:"] : []),
  ...DOMAINS.map((d) => `  - \`.ai/domains/${d.slug}.md\``),
  "",
  "## Entry points (top-level directories scanned)",
  "",
  ...CODE_DIRS.filter((d) => allFiles.some((f) => f.rel.startsWith(d + "/"))).map((d) => `- \`${d}/\``),
  "",
].join("\n");

if (Buffer.byteLength(repoMap, "utf8") > MAX_REPO_MAP_BYTES) {
  console.error(
    `ERROR: .ai/repo-map.md is ${Buffer.byteLength(repoMap, "utf8")} bytes (cap is ${MAX_REPO_MAP_BYTES}). Tighten the template or raise the cap deliberately.`
  );
  process.exit(1);
}

writeFileSync(join(OUT, "repo-map.md"), repoMap);

// 2. routes.md
const routes = [
  "# Routes",
  "",
  "## Pages",
  "",
  ...pageRoutes.map((r) => `- \`${r.route || "/"}\` → \`${r.file}\``),
  "",
  "## API",
  "",
  ...apiRoutes.map((r) => `- \`${r.methods.join(" | ") || "?"}\` \`${r.route}\` → \`${r.file}\``),
  "",
].join("\n");
writeFileSync(join(OUT, "routes.md"), routes);

// 3. symbols.md — grouped by file
const byFile = {};
for (const s of symbols) (byFile[s.file] ||= []).push(s.name);
const symbolsMd = [
  "# Exported Symbols",
  "",
  ...Object.entries(byFile)
    .sort()
    .map(([file, names]) => `## \`${file}\`\n\n- ${names.join(", ")}\n`),
].join("\n");
writeFileSync(join(OUT, "symbols.md"), symbolsMd);

// 4. models.md
writeFileSync(
  join(OUT, "models.md"),
  ["# ORM Models", "", ...modelNames.map((m) => `- \`${m}\``), ""].join("\n")
);

// 5. dependency-graph.json
writeFileSync(join(OUT, "dependency-graph.json"), JSON.stringify(graph, null, 2));

// 6. domains/*.md
for (const dom of DOMAINS) {
  const matched = allFiles.filter((f) => dom.match(f.rel));
  if (matched.length === 0) continue;
  const body = [
    `# Domain: ${dom.slug}`,
    "",
    `Auto-generated. ${matched.length} files matched.`,
    "",
    "## Files",
    "",
    ...matched.map((f) => `- \`${f.rel}\``),
    "",
  ].join("\n");
  writeFileSync(join(OUT, "domains", `${dom.slug}.md`), body);
}

console.log(`.ai/ regenerated — repo-map.md is ${Buffer.byteLength(repoMap, "utf8")} bytes.`);
