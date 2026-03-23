# Init — provisioning and seed data

This folder holds **committed** artefacts for first-run setup: marketplace **schema**, **catalogue** JSON, CMS / SQL seeds, and content-region manifests.

**Template ID:** `aurora-template-grocery` (Aurora Studio Template Registry). Schema provision is **idempotent** (merges missing tables/columns).

## Files

| File | Purpose |
|------|--------|
| **schema.json** | Marketplace table/field definitions for `POST /v1/provision-schema` (`pnpm schema:provision` or startup sync in `provision.ts`). |
| **catalog-seed.json** | Vendors, zones, categories, products — applied with `pnpm seed:apply` / `pnpm seed:catalog:apply`. |
| **seed-cms.sql** | `store_content_blocks` rows — POSTed via `apply-seed.mjs` as part of `pnpm seed:apply`. |
| **content-regions.json** | CMS page/region slots. Regenerate: `pnpm run generate:content-regions` (also `prebuild`). See [starter-core content-regions](https://github.com/Purple-Napkin/aurora-starter-core/blob/main/docs/content-regions.md). |
| **content-regions.schema.json** | JSON Schema for the manifest (from the generator). |
| **provision.ts** | `loadSchema()`, `runFirstRunProvision()`, `runPendingSchemaMigration()` — used by `init/register.ts` (Next.js instrumentation). |
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

- **Server start:** `instrumentation.ts` → `runFirstRunProvision()` then `runPendingSchemaMigration()` if `AURORA_API_URL` and `AURORA_API_KEY` are set. Skip with `AURORA_SKIP_STARTUP_SYNC=1` (e.g. CI).
- **Studio onboarding:** workspace may already be provisioned; storefront sync still merges any missing tables.

## Env

- `AURORA_API_URL` or `NEXT_PUBLIC_AURORA_API_URL`
- `AURORA_API_KEY`

## Base

`provision.ts` uses `AURORA_BASE = "marketplace-base"` (multi-vendor). For a non-marketplace app, switch to `"base"`.
