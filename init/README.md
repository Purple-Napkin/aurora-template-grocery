# Init — first-run provisioning

This folder holds everything that runs **once** when your app starts, so the Aurora tenant has the right schema without manual setup.

## What’s here

| File | Purpose |
|------|--------|
| **schema-v2.json** | Enterprise schema (Offers, vendor_products, etc.). Preferred when present. |
| **schema.json** | Base template schema. Used when schema-v2.json is absent. |
| **provision.ts** | Logic: load schema-v2.json if exists else schema.json → call API. Used by `register.ts` and `pnpm schema:provision`. |
| **register.ts** | Next.js instrumentation hook: calls `runFirstRunProvision()` on server start. Root `instrumentation.ts` only re-exports this (Next.js requires that file at project root). |

## When it runs

- **On server start:** Next.js runs root `instrumentation.ts` → `init/register.ts` → `runFirstRunProvision()`. Skips if env vars are missing or the tenant already has tables.
- **Manually:** `pnpm schema:provision` (see `scripts/provision-schema.mjs`) reads `init/schema-v2.json` (or `schema.json`) and calls the same API.

## Env vars

- `AURORA_API_URL` or `NEXT_PUBLIC_AURORA_API_URL` — Aurora API base URL.
- `AURORA_API_KEY` — Tenant API key (Aurora Studio → Settings → API Keys).

## Base (marketplace vs not)

In `provision.ts`, `AURORA_BASE` is set to `"marketplace-base"` (multi-vendor: vendors, products, etc.). For a non-marketplace app (blog, CRM), change it to `"base"`.
