# Store content blocks (marketplace templates)

All four Aurora marketplace storefront templates use the same **`store_content_blocks`** pipeline, schema shape, UI components, and Holmes proxy behavior.

## What shipped (all four marketplace storefront templates)

- **Schema:** `home_sections` and `curated_collections` removed from each template’s `init/schema.json` and `init/schema-v2.json`. New table **`store_content_blocks`** with `page`, `region`, `block_kind`, scheduling, `width` (`full` / `half`), and product / search / blurb fields. Existing tenants: re-provision or add the table in Studio.
- **API (shared Aurora API):** `computeHomePersonalization` resolves CMS blocks from **`store_content_blocks`** (not the old tables). It filters by **`page`** and **`region`** in the datastore query with a generous limit so narrow regions (e.g. `home_main_feed`) are not dropped when many other rows exist. Query params: **`page`**, **`region`**, **`categorySlug`** (optional, for catalogue-scoped blocks).
- **Defaults:** When `page` / `region` are omitted, they default to **`home`** and **`home_main_feed`** (Holmes home-personalization fetch unchanged).
- **SDK / starter-core:** Use **`@aurora-studio/sdk@^0.2.31`**, **`@aurora-studio/starter-core@^0.1.11`** — `homePersonalization()` and `getHomePersonalization()` accept `contentPage`, `contentRegion`, `categorySlug`.
- **UI (shared pattern):**
  - **Home:** `contentPage=home`, `contentRegion=home_main_feed`. Template-specific rails (e.g. recipe ideas on grocery) stay **template-first**; then CMS blocks. Half-width rows pair on **`md+`**, stack on mobile — both in **SSR** (`HomeSections` / `GroupedStoreContentSections`) and when **Holmes** replaces the feed (`AdaptiveFeed` uses the same **`groupHalfWidthSections`** helper).
  - **For You:** `contentPage=for_you`, `contentRegion=for_you_below_cart_blocks`.
  - **`components/storeContentBlocksUi.tsx`** — shared renderers; For You passes `withHolmesMarkers={false}` so `data-holmes-home-*` attributes are omitted outside the home feed mount.
  - **`AdaptiveFeed`:** Listens for **`holmes:homeSections`** and replaces the SSR feed; half-width grouping matches SSR.
- **Holmes:** `app/api/holmes/home-personalization/route.ts` forwards **`page`**, **`region`**, and **`categorySlug`** to the Aurora API like the server components do.

## Seed data: `init/seed.sql`

| Template | Demo catalog + `store_content_blocks` |
|----------|----------------------------------------|
| **Grocery, hotels, store, travel** | Checked-in **`init/seed.sql`** per app — deterministic UUIDs, stable copy, Pexels or picsum image URLs frozen at check-in time. |

Seed slugs use a **template-specific prefix** so one tenant can run multiple templates without collisions:

| Template | Slug prefix |
|----------|-------------|
| Grocery | `seed-cb-grocery-` |
| Store | `seed-cb-store-` |
| Travel | `seed-cb-travel-` |
| Hotels | `seed-cb-hotels-` |

Copy in each vertical is tuned to retail, travel, or hotels; structure (pages / regions) matches the shared CMS plan.

### Apply `init/seed.sql` (any template app)

1. Ensure the tenant schema and tables exist (`pnpm schema:provision` in the app, or Studio).
2. **Apply seed (no manual UUID/schema):** from **`aurora-template-grocery`**, **`-hotels`**, **`-store`**, or **`-travel`**, with **`AURORA_API_URL`** / **`AURORA_API_KEY`** (typically **`.env.local`**):

   ```bash
   pnpm seed:apply
   ```

   This POSTs **`init/seed.sql`** (with **`__TENANT_UUID__`** / **`__TENANT_SCHEMA__`**) to **`POST /v1/apply-seed-sql`**. The server resolves the tenant from the API key, substitutes placeholders, and runs the statements. Requires the API process to have **`DB_URL`** (same as migrations).

   Optional: `pnpm seed:apply -- --dry-run`, or `node scripts/apply-seed.mjs --file path/to/seed.sql`.

   **Storefront “Use example data”** (where implemented): when the catalogue is empty, that flow forwards **`init/seed.sql`** to **`POST /v1/apply-seed-sql`**, then reloads.

3. **Manual alternative:** replace placeholders in **`init/seed.sql`** and run `psql $DATABASE_URL -v ON_ERROR_STOP=1 -f init/seed.sql` (or Studio SQL).
4. **Meilisearch:** In Aurora Studio open **Settings → Search**. Set **Main catalog table** to your storefront catalogue table (the UI shows the tenant’s **store catalog table**, e.g. `products`). Enable **Index `catalog_product_listing` view** so hits include joined `category_slug` / `category_label` (after schema migration created the view). Then run **Sync index now** (or your usual reindex) so `search_terms` blocks and catalogue search resolve.

**Grocery** `init/seed.sql` is safe to re-run on a tenant that already has a real catalogue: it **does not delete** vendors, zones, categories, or arbitrary products. It **upserts** the template vendor/zone/category rows and demo products by fixed `id`; product rows are only updated on conflict if the existing row still has `sku LIKE 'SEED-TEMPLATE-GROCERY-%'`. It **deletes** only `store_content_blocks` whose `slug` starts with `seed-cb-grocery-`, then re-inserts those CMS rows so template copy stays aligned.

Other templates (hotels, store, travel) may still use delete-then-insert patterns in their own `init/seed.sql` — read the header comment in each file.

**Regenerating SQL for hotels / store / travel** lives in the full Aurora repository: from that repo’s root, with **`PEXELS_API_KEY`** in `.env` if you want live Pexels URLs (otherwise picsum fallbacks), run `scripts/template-seed/emit-seed-sql.mjs` (targets: `hotels`, `store`, `travel`, or `all`). Source modules live under `scripts/template-seed/` (`template-vertical-catalog.mjs`, `template-vertical-content-blocks.mjs`, `template-vertical-ids.mjs`).

**Grocery** does not use the emit script; maintain **`init/seed.sql`** in this repo when copy or demo products change.

## Pexels keys: root vs Aurora Studio

| Where | Used for |
|-------|-----------|
| **Aurora monorepo root `.env`** — `PEXELS_API_KEY` | **Regenerating** hotels/store/travel **`init/seed.sql`** via `scripts/template-seed/emit-seed-sql.mjs` (only when you have that repo checked out). |
| **Aurora Studio API `.env`** — `PEXELS_API_KEY` | **Runtime** hero fallbacks and tenant Pexels image routes. Copy the key from Studio’s env documentation into the API process env for live storefronts. |

## Studio setup (minimal)

Create rows in **Store content blocks**, for example:

| slug | page | region | block_kind | notes |
|------|------|--------|------------|-------|
| `home-essentials` | home | home_main_feed | search_terms | Comma-separated phrases → single OR search |
| `home-featured` | home | home_main_feed | product_list | Product IDs |
| `for-you-tip` | for_you | for_you_below_cart_blocks | blurb | Body + optional title |

Holmes injections (`basket-bundle`, `catalogue-list`, etc.) are unchanged; they remain template-defined.

## Further reading

Canonical region map and half-width algorithm: in the Aurora monorepo, **`docs/Content-Blocks-CMS-Regions-And-Holmes-Slots.md`**.
