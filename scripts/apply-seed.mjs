#!/usr/bin/env node
/**
 * POST SQL seed file(s) to Aurora apply-seed-sql (tenant from API key).
 *
 *   pnpm seed:apply          # uses init/seed-cms.sql when no --file args (see package.json for full chain)
 *   node scripts/apply-seed.mjs --dry-run
 *   node scripts/apply-seed.mjs --file init/seed-cms.sql
 *   node scripts/apply-seed.mjs --file init/seed-hospitality.sql --file init/seed-cms.sql
 *
 * With no --file: requires init/seed-cms.sql (catalogue is init/catalog-seed.json via catalog-seed.mjs).
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { loadAllTemplateEnv } from "./load-template-env.mjs";

loadAllTemplateEnv(import.meta.url);

const cwd = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const filesFromArgs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--file" && args[i + 1]) {
    filesFromArgs.push(args[++i]);
  }
}

const defaultCms = join(cwd, "init", "seed-cms.sql");
let toApply;
if (filesFromArgs.length > 0) {
  toApply = filesFromArgs.map((f) => (f.startsWith("/") ? f : join(cwd, f)));
} else if (existsSync(defaultCms)) {
  toApply = [defaultCms];
} else {
  console.error(
    "Missing init/seed-cms.sql. Pass explicit files, e.g. --file init/seed-hospitality.sql --file init/seed-cms.sql"
  );
  process.exit(1);
}

const apiUrl = (process.env.AURORA_API_URL || process.env.NEXT_PUBLIC_AURORA_API_URL || "").replace(
  /\/$/,
  ""
);
const apiKey = process.env.AURORA_API_KEY || process.env.NEXT_PUBLIC_AURORA_API_KEY;

if (!apiUrl || !apiKey) {
  console.error(
    "Set AURORA_API_URL (or NEXT_PUBLIC_AURORA_API_URL) and AURORA_API_KEY (e.g. in .env.local)."
  );
  process.exit(1);
}

for (const seedPath of toApply) {
  if (!existsSync(seedPath)) {
    console.error(`Missing seed file: ${seedPath}`);
    process.exit(1);
  }
  const sql = readFileSync(seedPath, "utf8");
  if (!sql.includes("__TENANT_UUID__") || !sql.includes("__TENANT_SCHEMA__")) {
    console.error(`${seedPath} must contain __TENANT_UUID__ and __TENANT_SCHEMA__.`);
    process.exit(1);
  }
}

if (dryRun) {
  for (const seedPath of toApply) {
    const sql = readFileSync(seedPath, "utf8");
    console.log(`[dry-run] Would POST ${seedPath} (${sql.length} bytes) to ${apiUrl}/v1/apply-seed-sql`);
  }
  process.exit(0);
}

const url = `${apiUrl}/v1/apply-seed-sql`;
for (const seedPath of toApply) {
  const sql = readFileSync(seedPath, "utf8");
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
    console.error(`POST ${url} (${seedPath}) -> ${res.status}`);
    console.error(body);
    process.exit(1);
  }
  console.log("Seed applied:", seedPath, body);
}
