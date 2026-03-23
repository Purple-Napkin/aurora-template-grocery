#!/usr/bin/env node
/**
 * Provision the marketplace schema for your Aurora tenant (first run).
 * Reads init/schema.json and POSTs to /v1/provision-schema. Base: marketplace-base.
 *
 * Requires: AURORA_API_URL, AURORA_API_KEY. Run: pnpm schema:provision
 * Loads template `.env.local` / `.env`, then optional parent `../../.env` when keys unset.
 */
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { loadAllTemplateEnv } from "./load-template-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadAllTemplateEnv(import.meta.url);

const apiUrl = process.env.AURORA_API_URL || process.env.NEXT_PUBLIC_AURORA_API_URL;
const apiKey = process.env.AURORA_API_KEY;

if (!apiUrl || !apiKey) {
  console.error("Usage: AURORA_API_URL=... AURORA_API_KEY=... pnpm schema:provision");
  console.error("Or set NEXT_PUBLIC_AURORA_API_URL and AURORA_API_KEY");
  process.exit(1);
}

const schemaPath = join(__dirname, "../init/schema.json");
if (!existsSync(schemaPath)) {
  console.error("Missing init/schema.json. Restore from git or copy from a fresh template clone.");
  process.exit(1);
}
const raw = readFileSync(schemaPath, "utf8");
const parsed = JSON.parse(raw);
const schema = typeof parsed.tables !== "undefined" ? parsed : { tables: parsed };

const base = apiUrl.replace(/\/$/, "");
const url = `${base}/v1/provision-schema`;

console.log(`POST ${url} (base: marketplace-base)`);
const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Api-Key": apiKey,
  },
  body: JSON.stringify({ schema, base: "marketplace-base" }),
});

if (!res.ok) {
  const err = await res.text();
  console.error(`Provision failed: ${res.status} ${res.statusText}`);
  console.error(err);
  process.exit(1);
}

const data = await res.json();
console.log("Schema provisioned:", JSON.stringify(data, null, 2));
