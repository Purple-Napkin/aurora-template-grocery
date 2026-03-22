/**
 * Load env for template scripts without a monorepo `scripts/template-seed` dependency.
 * 1) Parent-of-template `../..` `.env` (optional monorepo root) when keys unset.
 * 2) Template root `.env.local` / `.env` (first file found).
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

function parseEnvFile(text) {
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

/** From `scripts/*.mjs`, template root is one level up. */
export function loadTemplateRootEnv(scriptUrl) {
  const scriptDir = dirname(fileURLToPath(scriptUrl));
  const templateRoot = join(scriptDir, "..");
  for (const name of [".env.local", ".env"]) {
    const p = join(templateRoot, name);
    if (!existsSync(p)) continue;
    parseEnvFile(readFileSync(p, "utf8"));
    break;
  }
}

/** Optional monorepo root `.env` at `template/../../.env` (aurora/ when layout is aurora/aurora-template-grocery). */
export function loadMonorepoRootEnv(scriptUrl) {
  const scriptDir = dirname(fileURLToPath(scriptUrl));
  const rootEnv = join(scriptDir, "..", "..", ".env");
  if (!existsSync(rootEnv)) return;
  parseEnvFile(readFileSync(rootEnv, "utf8"));
}

/** Template `.env.local` first, then monorepo root `.env` for keys still unset. */
export function loadAllTemplateEnv(scriptUrl) {
  loadTemplateRootEnv(scriptUrl);
  loadMonorepoRootEnv(scriptUrl);
}
