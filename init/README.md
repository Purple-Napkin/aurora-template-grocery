# Init — provisioning and seed data

This folder holds **committed** artefacts for first-run setup: marketplace **schema**, **catalogue** JSON, CMS / SQL seeds, and content-region manifests.

**Template ID:** `aurora-template-grocery` (Aurora Studio Template Registry). Schema provision is **idempotent** (merges missing tables/columns).

**Other marketplace templates** (store, hotels, travel) use the same `init/provision.ts` / `init/register.ts` behaviour; this README is the canonical description for all of them.

## Files

| File | Purpose |
|------|--------|
| **schema.json** | Marketplace table/field definitions for `POST /v1/provision-schema` (`pnpm schema:provision` or startup sync in `provision.ts`). |
| **catalog-seed.json** | Vendors, zones, categories, products — applied with `pnpm seed:apply` / `pnpm seed:catalog:apply`. |
| **seed-cms.sql** | `store_content_blocks` rows — POSTed via `apply-seed.mjs` as part of `pnpm seed:apply`. |
| **content-regions.json** | CMS page/region slots. Regenerate: `pnpm run generate:content-regions` (also `prebuild`). See [starter-core content-regions](https://github.com/Purple-Napkin/aurora-starter-core/blob/main/docs/content-regions.md). |
| **content-regions.schema.json** | JSON Schema for the manifest (from the generator). |
| **provision.ts** | `loadSchema()`, `runFirstRunProvision()`, `tenantHasTables()`, `provisionSchema()`, `runPendingSchemaMigration()` (manual/scripts only for migration). Used by `init/register.ts` (Next.js instrumentation). |
| **register.ts** | Re-exported from root `instrumentation.ts`. |

## Commands (template root)

| Command | When |
|---------|------|
| `pnpm schema:provision` | First time or after schema changes — pushes `init/schema.json` to the API. |
| `pnpm seed:apply` | Load demo catalogue + CMS (uses `init/catalog-seed.json` and SQL seeds). |
| `pnpm seed:catalog:apply` | Catalogue JSON only. |

### Updating `catalog-seed.json` or `schema.json` (maintainers)

Normal development does not require this — the repo already ships committed `init/` data.

- **Catalogue:** With `.env.local` pointing at the Aurora API and API key for the tenant you want to snapshot, run from the template root: `node scripts/catalog-seed.mjs export`. Inspect `seedMeta` in the output before committing.
- **Schema:** Use Aurora Studio (Data Builder) to align changes with `init/schema.json`, or edit the JSON carefully; then run `pnpm schema:provision` against a test tenant if needed.

## When it runs

- **Server start (`instrumentation.ts` → `runFirstRunProvision`):** Runs only on Node. If `AURORA_SKIP_STARTUP_SYNC=1`, or `AURORA_API_URL` / `NEXT_PUBLIC_AURORA_API_URL` or `AURORA_API_KEY` is missing, it does nothing (use the skip flag in CI without an API).
- **Tenant already has tables** (typical after Studio onboarding): calls `GET /v1/tables` first; if any table exists, **no further requests** — PostgreSQL DDL for ongoing changes is **not** driven from the storefront on every deploy. Studio records **`tenant_schema_migration_requests`**; workers apply **`runSchemaMigration`**.
- **Tenant has no tables** (API-key-only / greenfield): calls **`POST /v1/provision-schema`** once to register `init/schema.json`. The storefront does **not** call **`POST /v1/run-schema-migration`** on boot.
- **Manual immediate DDL:** call **`runPendingSchemaMigration()`** from a script, or **`POST /v1/run-schema-migration`** yourself, when you need to force-apply metadata to Postgres without waiting for the migration worker.

## Env

- `AURORA_API_URL` or `NEXT_PUBLIC_AURORA_API_URL`
- `AURORA_API_KEY`
- `AURORA_SKIP_STARTUP_SYNC=1` — skip startup sync (e.g. CI)

## Base

`provision.ts` uses `AURORA_BASE = "marketplace-base"` (multi-vendor). For a non-marketplace app, switch to `"base"`.
