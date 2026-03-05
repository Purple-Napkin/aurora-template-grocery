#!/usr/bin/env node
/**
 * Provision the e-commerce schema for your Aurora tenant (first run).
 * Prefers init/schema-v2.json (enterprise/Offers), falls back to init/schema.json.
 * POSTs to /v1/provision-schema. Base: marketplace-base.
 *
 * Requires: AURORA_API_URL, AURORA_API_KEY. Run: pnpm schema:provision
 */
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const apiUrl = process.env.AURORA_API_URL || process.env.NEXT_PUBLIC_AURORA_API_URL;
const apiKey = process.env.AURORA_API_KEY;

if (!apiUrl || !apiKey) {
  console.error("Usage: AURORA_API_URL=... AURORA_API_KEY=... pnpm schema:provision");
  console.error("Or set NEXT_PUBLIC_AURORA_API_URL and AURORA_API_KEY");
  process.exit(1);
}

const schemaV2Path = join(__dirname, "../init/schema-v2.json");
const schemaPath = join(__dirname, "../init/schema.json");
const pathToUse = existsSync(schemaV2Path) ? schemaV2Path : schemaPath;
const raw = readFileSync(pathToUse, "utf8");
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
