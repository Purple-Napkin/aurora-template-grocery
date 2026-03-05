/**
 * First-run schema provisioning for Aurora.
 *
 * Checks if the tenant already has tables; if not, provisions the schema from
 * init/schema.json via POST /v1/provision-schema. Used by init/register.ts (Next.js
 * instrumentation) and can be called from scripts.
 */

export const AURORA_BASE = "marketplace-base" as const;

export type SchemaShape = {
  tables: unknown[];
  reports?: unknown[];
  workflows?: unknown[];
};

/**
 * Run first-run provision: skip if tenant has tables, otherwise POST schema to Aurora.
 * Requires AURORA_API_URL (or NEXT_PUBLIC_AURORA_API_URL) and AURORA_API_KEY.
 */
export async function runFirstRunProvision(): Promise<void> {
  const apiUrl = process.env.AURORA_API_URL ?? process.env.NEXT_PUBLIC_AURORA_API_URL;
  const apiKey = process.env.AURORA_API_KEY;

  if (!apiUrl || !apiKey) return;

  const baseUrl = apiUrl.replace(/\/$/, "");

  // Always provision: importSchemaForTenant merges (skips existing tables/fields).
  const schema = loadSchema();
  const result = await provisionSchema(baseUrl, apiKey, schema);

  if (result.tablesCreated > 0) {
    console.log("[aurora] Schema provisioned on first run:", result.message);
  }
}

/** True if the tenant already has at least one table. */
export async function tenantHasTables(baseUrl: string, apiKey: string): Promise<boolean> {
  const res = await fetch(`${baseUrl}/v1/tables`, {
    headers: { "X-Api-Key": apiKey },
  });
  if (!res.ok) return false;
  const tables = (await res.json()) as Array<{ slug?: string }>;
  return Array.isArray(tables) && tables.length > 0;
}

/** Load schema from init/. Prefers schema-v2.json (enterprise/Offers) when it exists. */
export function loadSchema(): SchemaShape {
  const fs = require("fs") as typeof import("node:fs");
  const path = require("path") as typeof import("node:path");
  const schemaV2Path = path.join(process.cwd(), "init", "schema-v2.json");
  const schemaPath = path.join(process.cwd(), "init", "schema.json");
  const pathToUse = fs.existsSync(schemaV2Path) ? schemaV2Path : schemaPath;
  const raw = fs.readFileSync(pathToUse, "utf8");
  const parsed = JSON.parse(raw);
  return typeof parsed.tables !== "undefined" ? parsed : { tables: parsed };
}

/** POST schema to Aurora; returns the API response. */
export async function provisionSchema(
  baseUrl: string,
  apiKey: string,
  schema: SchemaShape
): Promise<{ tablesCreated: number; message?: string }> {
  const res = await fetch(`${baseUrl}/v1/provision-schema`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
    body: JSON.stringify({ schema, base: AURORA_BASE }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<{ tablesCreated: number; message?: string }>;
}
