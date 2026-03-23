#!/usr/bin/env node
/**
 * Marketplace catalog from init/catalog-seed.json (committed source of truth).
 *
 *   pnpm seed:catalog:apply   — POST generated SQL for vendors → zones → categories → products
 *
 * To refresh init/catalog-seed.json from a tenant, from this template directory:
 *   node scripts/catalog-seed.mjs export
 * (requires AURORA_API_URL + AURORA_API_KEY in .env.local; see load-template-env.mjs for optional ../../.env).
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { AuroraClient } from "@aurora-studio/sdk";
import { loadAllTemplateEnv } from "./load-template-env.mjs";

loadAllTemplateEnv(import.meta.url);

const args = process.argv.slice(2);
const cmd = args[0] || "apply";
const dryRun = args.includes("--dry-run");

const CATALOG_PATH = join(process.cwd(), "init", "catalog-seed.json");

const apiUrl = (process.env.AURORA_API_URL || process.env.NEXT_PUBLIC_AURORA_API_URL || "").replace(
  /\/$/,
  ""
);
const apiKey = process.env.AURORA_API_KEY || process.env.NEXT_PUBLIC_AURORA_API_KEY || "";

const UUID_COLS = new Set([
  "id",
  "category_id",
  "vendor_id",
  "zone_id",
  "room_type_id",
]);

function sqlLiteral(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number" && Number.isFinite(val)) return String(val);
  if (typeof val === "object") {
    return `'${JSON.stringify(val).replace(/\\/g, "\\\\").replace(/'/g, "''")}'::jsonb`;
  }
  const s = String(val);
  return `'${s.replace(/'/g, "''")}'`;
}

function sqlUuid(val) {
  if (val == null || val === "") return "NULL";
  return `'${String(val).replace(/'/g, "''")}'::uuid`;
}

function formatCell(col, val) {
  if (val === null || val === undefined) return "NULL";
  if (UUID_COLS.has(col)) return sqlUuid(val);
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number" && Number.isFinite(val)) return String(val);
  if (typeof val === "object") {
    return `'${JSON.stringify(val).replace(/\\/g, "\\\\").replace(/'/g, "''")}'::jsonb`;
  }
  return sqlLiteral(val);
}

/**
 * @param {Record<string, unknown>[]} products
 */
function productColumnOrder(products) {
  const keys = new Set();
  for (const p of products) {
    for (const k of Object.keys(p)) {
      if (k === "tenant_id" || k === "created_at" || k === "updated_at") continue;
      keys.add(k);
    }
  }
  return [...keys].sort();
}

function buildCatalogSql(data) {
  const meta = data.seedMeta || {};
  const mode = meta.catalogApply || "replace_chain";
  const schema = "__TENANT_SCHEMA__";
  const tid = "__TENANT_UUID__";

  const lines = ["BEGIN;", ""];

  if (mode === "replace_chain") {
    if (meta.deleteProductSkuLike) {
      lines.push(
        `DELETE FROM ${schema}.products WHERE tenant_id = '${tid}'::uuid AND sku LIKE ${sqlLiteral(meta.deleteProductSkuLike)};`
      );
    }
    if (meta.categorySlugs?.length) {
      const list = meta.categorySlugs.map((s) => sqlLiteral(s)).join(", ");
      lines.push(
        `DELETE FROM ${schema}.categories WHERE tenant_id = '${tid}'::uuid AND slug IN (${list});`
      );
    }
    if (meta.zoneSlug) {
      lines.push(
        `DELETE FROM ${schema}.zones WHERE tenant_id = '${tid}'::uuid AND slug = ${sqlLiteral(meta.zoneSlug)};`
      );
    }
    if (meta.vendorId) {
      lines.push(
        `DELETE FROM ${schema}.vendors WHERE tenant_id = '${tid}'::uuid AND id = ${sqlUuid(meta.vendorId)};`
      );
    }
    lines.push("");
  }

  const vendors = data.vendors || [];
  const zones = data.zones || [];
  const categories = data.categories || [];
  const products = data.products || [];

  const vendorCols = ["id", "tenant_id", "name", "email", "status", "created_at", "updated_at"];
  for (const v of vendors) {
    const vals = [
      sqlUuid(v.id),
      `'${tid}'::uuid`,
      sqlLiteral(v.name),
      sqlLiteral(v.email ?? null),
      sqlLiteral(v.status ?? "active"),
      "now()",
      "now()",
    ];
    if (mode === "grocery_upsert") {
      lines.push(
        `INSERT INTO ${schema}.vendors (${vendorCols.join(", ")}) VALUES (${vals.join(", ")}) ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, name = EXCLUDED.name, email = EXCLUDED.email, status = EXCLUDED.status, updated_at = now();`
      );
    } else {
      lines.push(`INSERT INTO ${schema}.vendors (${vendorCols.join(", ")}) VALUES (${vals.join(", ")});`);
    }
  }
  if (vendors.length) lines.push("");

  const zoneCols = ["id", "tenant_id", "slug", "name", "sort_order", "vendor_id", "created_at", "updated_at"];
  for (const z of zones) {
    const vals = [
      sqlUuid(z.id),
      `'${tid}'::uuid`,
      sqlLiteral(z.slug),
      sqlLiteral(z.name),
      sqlLiteral(z.sort_order ?? 1),
      sqlUuid(z.vendor_id),
      "now()",
      "now()",
    ];
    if (mode === "grocery_upsert") {
      lines.push(
        `INSERT INTO ${schema}.zones (${zoneCols.join(", ")}) VALUES (${vals.join(", ")}) ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, slug = EXCLUDED.slug, name = EXCLUDED.name, sort_order = EXCLUDED.sort_order, vendor_id = EXCLUDED.vendor_id, updated_at = now();`
      );
    } else {
      lines.push(`INSERT INTO ${schema}.zones (${zoneCols.join(", ")}) VALUES (${vals.join(", ")});`);
    }
  }
  if (zones.length) lines.push("");

  const catCols = ["id", "tenant_id", "name", "slug", "zone_id", "created_at", "updated_at"];
  for (const c of categories) {
    const vals = [
      sqlUuid(c.id),
      `'${tid}'::uuid`,
      sqlLiteral(c.name),
      sqlLiteral(c.slug),
      sqlUuid(c.zone_id),
      "now()",
      "now()",
    ];
    if (mode === "grocery_upsert") {
      lines.push(
        `INSERT INTO ${schema}.categories (${catCols.join(", ")}) VALUES (${vals.join(", ")}) ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, name = EXCLUDED.name, slug = EXCLUDED.slug, zone_id = EXCLUDED.zone_id, updated_at = now();`
      );
    } else {
      lines.push(`INSERT INTO ${schema}.categories (${catCols.join(", ")}) VALUES (${vals.join(", ")});`);
    }
  }
  if (categories.length) lines.push("");

  const pCols = productColumnOrder(products);
  const insertTail = ["created_at", "updated_at"];
  for (const p of products) {
    const dataCols = pCols.filter((c) => p[c] !== undefined);
    const insertCols = ["tenant_id", ...dataCols, ...insertTail];
    const insertVals = [
      `'${tid}'::uuid`,
      ...dataCols.map((c) => formatCell(c, p[c])),
      "now()",
      "now()",
    ];
    const conflictUpdateCols = dataCols.filter((c) => c !== "id");
    const setParts =
      mode === "grocery_upsert"
        ? ["tenant_id = EXCLUDED.tenant_id"].concat(
            conflictUpdateCols.map((c) => `${c} = EXCLUDED.${c}`),
            ["updated_at = now()"]
          )
        : conflictUpdateCols.map((c) => `${c} = EXCLUDED.${c}`).concat(["updated_at = now()"]);
    const guard = meta.productSkuGuard
      ? ` WHERE ${schema}.products.sku LIKE ${sqlLiteral(meta.productSkuGuard)}`
      : "";

    if (mode === "grocery_upsert") {
      lines.push(
        `INSERT INTO ${schema}.products (${insertCols.join(", ")}) VALUES (${insertVals.join(", ")}) ON CONFLICT (id) DO UPDATE SET ${setParts.join(", ")}${guard};`
      );
    } else {
      lines.push(
        `INSERT INTO ${schema}.products (${insertCols.join(", ")}) VALUES (${insertVals.join(", ")});`
      );
    }
  }

  lines.push("");
  lines.push("COMMIT;");
  return lines.join("\n");
}

async function postApplySeedSql(sql) {
  const url = `${apiUrl}/v1/apply-seed-sql`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
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
    console.error(`POST ${url} -> ${res.status}`, body);
    process.exit(1);
  }
  return body;
}

function relationId(v) {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "id" in v) return v.id;
  return null;
}

/**
 * @param {(slug: string) => { records: { list: (q: object) => Promise<{ data: unknown[]; total: number }> } }} tables
 */
async function listAll(tables, slug) {
  const out = [];
  let offset = 0;
  const limit = 250;
  for (;;) {
    const page = await tables(slug).records.list({ limit, offset, sort: "created_at", order: "asc" });
    out.push(...page.data);
    offset += page.data.length;
    if (page.data.length === 0 || out.length >= page.total) break;
  }
  return out;
}

const SKU_PREFIX_BY_TEMPLATE = {
  grocery: "SEED-TEMPLATE-GROCERY-%",
  store: "SEED-TEMPLATE-STORE-%",
  travel: "SEED-TEMPLATE-TRAVEL-%",
  hotels: "SEED-TEMPLATE-HOTELS-%",
};

function templateKeyFromPackage() {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
  const m = pkg.name?.match(/template-([\w-]+)/);
  return m ? m[1] : "unknown";
}

async function exportCatalog() {
  const client = new AuroraClient({
    baseUrl: apiUrl,
    apiKey,
    specUrl: `${apiUrl}/v1/openapi.json`,
  });
  const tables = client.tables.bind(client);
  const vendors = await listAll(tables, "vendors");
  const zones = await listAll(tables, "zones");
  const categories = await listAll(tables, "categories");
  const products = await listAll(tables, "products");

  const slim = (rows, relationKeys) =>
    rows.map((r) => {
      const o = {};
      for (const [k, v] of Object.entries(r)) {
        if (["created_at", "updated_at", "holmes_insights"].includes(k)) continue;
        if (k === "category" || k === "vendor" || k === "zone") continue;
        if (relationKeys.has(k)) {
          o[k] = relationId(v) ?? v;
        } else {
          o[k] = v;
        }
      }
      return o;
    });

  const rel = new Set(["vendor_id", "zone_id", "category_id"]);
  const templateKey = templateKeyFromPackage();
  const skuPat = SKU_PREFIX_BY_TEMPLATE[templateKey] || "SEED-%";
  const categorySlugs = categories.map((c) => c.slug).filter(Boolean);
  const zoneSlugs = zones.map((z) => z.slug).filter(Boolean);
  const vendorIds = [...new Set(vendors.map((v) => v.id))];

  const catalogApply =
    templateKey === "grocery" ? "grocery_upsert" : "replace_chain";

  const seedMeta =
    catalogApply === "grocery_upsert"
      ? {
          catalogApply: "grocery_upsert",
          productSkuGuard: skuPat,
        }
      : {
          catalogApply: "replace_chain",
          deleteProductSkuLike: skuPat.replace(/%$/, "%"),
          categorySlugs,
          zoneSlug: zoneSlugs[0] || null,
          vendorId: vendorIds[0] || null,
        };

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    template: templateKey,
    seedMeta,
    vendors: slim(vendors, new Set()),
    zones: slim(zones, new Set(["vendor_id"])),
    categories: slim(categories, new Set(["zone_id"])),
    products: slim(products, rel),
  };

  writeFileSync(CATALOG_PATH, JSON.stringify(data, null, 2), "utf8");
  console.log(`Wrote ${CATALOG_PATH} (${products.length} products). Review seedMeta, then commit.`);
}

async function applyCatalog() {
  if (!existsSync(CATALOG_PATH)) {
    console.error(`Missing ${CATALOG_PATH}. Run: node scripts/catalog-seed.mjs export (with API env set), or restore init/ from git.`);
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const sql = buildCatalogSql(data);
  if (dryRun) {
    console.log(sql.slice(0, 6000) + (sql.length > 6000 ? "\n... [truncated]" : ""));
    return;
  }
  const body = await postApplySeedSql(sql);
  console.log("Catalog seed applied:", body);
}

async function main() {
  if (!apiUrl || !apiKey) {
    console.error("Set AURORA_API_URL and AURORA_API_KEY in .env.local");
    process.exit(1);
  }
  if (cmd === "export") {
    await exportCatalog();
    return;
  }
  if (cmd === "apply") {
    await applyCatalog();
    return;
  }
  console.error("Usage: node catalog-seed.mjs apply|export [--dry-run]");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
