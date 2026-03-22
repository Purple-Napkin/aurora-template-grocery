#!/usr/bin/env node
/**
 * POST init/seed.sql to Aurora API — tenant UUID/schema from API key (no manual replace).
 *
 * Requires: AURORA_API_URL or NEXT_PUBLIC_AURORA_API_URL, AURORA_API_KEY (.env.local or env).
 *
 * Usage (from template root): pnpm seed:apply
 *   node scripts/apply-seed.mjs --dry-run
 *   node scripts/apply-seed.mjs --file /path/to/seed.sql
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadAllTemplateEnv } from "./load-template-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadAllTemplateEnv(import.meta.url);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileIdx = args.indexOf("--file");
const seedPath =
  fileIdx >= 0 && args[fileIdx + 1] ? args[fileIdx + 1] : join(process.cwd(), "init", "seed.sql");

const apiUrl = (process.env.AURORA_API_URL || process.env.NEXT_PUBLIC_AURORA_API_URL || "").replace(
  /\/$/,
  ""
);
const apiKey = process.env.AURORA_API_KEY;

if (!apiUrl || !apiKey) {
  console.error(
    "Set AURORA_API_URL (or NEXT_PUBLIC_AURORA_API_URL) and AURORA_API_KEY (e.g. in .env.local)."
  );
  process.exit(1);
}

if (!existsSync(seedPath)) {
  console.error(`Missing seed file: ${seedPath}`);
  process.exit(1);
}

const sql = readFileSync(seedPath, "utf8");
if (!sql.includes("__TENANT_UUID__") || !sql.includes("__TENANT_SCHEMA__")) {
  console.error("seed.sql must contain __TENANT_UUID__ and __TENANT_SCHEMA__ placeholders.");
  process.exit(1);
}

if (dryRun) {
  console.log(`[dry-run] Would POST ${seedPath} (${sql.length} bytes) to ${apiUrl}/v1/apply-seed-sql`);
  process.exit(0);
}

const url = `${apiUrl}/v1/apply-seed-sql`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Api-Key": apiKey,
  },
  body: JSON.stringify({ sql }),
});

const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = text;
}

if (!res.ok) {
  console.error(`POST ${url} -> ${res.status}`);
  console.error(body);
  process.exit(1);
}

console.log("Seed applied:", body);
