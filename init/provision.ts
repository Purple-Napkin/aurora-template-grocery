/**
 * First-run schema provisioning for Aurora.
 *
 * Checks if the tenant already has tables; if not, provisions the schema from
 * init/schema.json (tables + optional reports/workflows) via POST /v1/provision-schema.
 * Used by init/register.ts (Next.js
 * instrumentation) and can be called from scripts.
 */

export const AURORA_BASE = "marketplace-base" as const;

export type SchemaShape = {
  tables: unknown[];
  reports?: unknown[];
  workflows?: unknown[];
};

function shortHttpBody(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.includes("<!DOCTYPE") || t.length > 160) {
    return t.length > 140 ? `${t.slice(0, 140)}…` : t;
  }
  return t || "(empty body)";
}

/**
 * Apply PostgreSQL DDL + listing views for the API key tenant (picks up Studio metadata changes).
 * POST /v1/run-schema-migration — safe to call on every process start.
 *
 * **404:** Older Aurora API builds omit this route; `provision-schema` still runs migrations at the
 * end of each import. Log once and continue. Otherwise ensure `AURORA_API_URL` is the API origin
 * (not the Next storefront) and deploy an API that includes `POST /v1/run-schema-migration`.
 */
export async function runPendingSchemaMigration(baseUrl: string, apiKey: string): Promise<void> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/run-schema-migration`, {
    method: "POST",
    headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
  });
  if (res.status === 404) {
    console.warn(
      "[aurora] run-schema-migration: 404 (endpoint not on this API). Deploy latest Aurora API or rely on provision-schema migrations; check AURORA_API_URL is the API base, not the storefront."
    );
    return;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${shortHttpBody(text)}`);
  }
  console.log("[aurora] run-schema-migration: ok");
}

/**
 * Startup sync: merge init/schema into Aurora metadata, then run pending DB migrations.
 * Requires AURORA_API_URL (or NEXT_PUBLIC_AURORA_API_URL) and AURORA_API_KEY.
 * Set AURORA_SKIP_STARTUP_SYNC=1 to skip (e.g. CI without API).
 */
export async function runFirstRunProvision(): Promise<void> {
  if (process.env.AURORA_SKIP_STARTUP_SYNC === "1") {
    console.log("[aurora] startup sync skipped (AURORA_SKIP_STARTUP_SYNC=1)");
    return;
  }

  const apiUrl = process.env.AURORA_API_URL ?? process.env.NEXT_PUBLIC_AURORA_API_URL;
  const apiKey = process.env.AURORA_API_KEY;

  if (!apiUrl || !apiKey) {
    console.log(
      "[aurora] startup sync skipped (set AURORA_API_URL and AURORA_API_KEY, or AURORA_SKIP_STARTUP_SYNC=1 in CI)"
    );
    return;
  }

  const baseUrl = apiUrl.replace(/\/$/, "");
  console.log("[aurora] startup sync →", baseUrl);

  try {
    // Idempotent: importSchemaForTenant merges (skips existing tables/fields).
    const schema = loadSchema();
    const result = await provisionSchema(baseUrl, apiKey, schema);

    if (result.tablesCreated > 0) {
      console.log("[aurora] provision-schema: ok (new tables)", result.message ?? "");
    } else {
      console.log("[aurora] provision-schema: ok (metadata merged, no new tables)");
    }
  } catch (err) {
    console.warn(
      "[aurora] provision-schema failed:",
      err instanceof Error ? err.message : err
    );
  }

  try {
    await runPendingSchemaMigration(baseUrl, apiKey);
  } catch (err) {
    console.warn(
      "[aurora] run-schema-migration failed:",
      err instanceof Error ? err.message : err
    );
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

/** Load marketplace schema. Static import ensures Vercel/serverless includes schema.json in the bundle. */
import schemaJson from "./schema.json";

export function loadSchema(): SchemaShape {
  const parsed = schemaJson as Record<string, unknown>;
  if (typeof parsed.tables !== "undefined") return parsed as SchemaShape;
  return { tables: (parsed as unknown) as unknown[] };
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
