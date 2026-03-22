# Store content blocks (Hippo templates)

Grocery was the first vertical to ship this; **store, travel, and hotels** now use the same **`store_content_blocks`** pipeline, schema shape, UI components, and Holmes proxy behavior.

## What shipped (all four Hippo storefront templates)

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

## Seed data: two paths

| Template | How demo catalog + `store_content_blocks` are loaded |
|----------|------------------------------------------------------|
| **Hotels, store, travel** | Checked-in **`init/seed.sql`** per app — deterministic UUIDs, stable copy, Pexels or picsum image URLs frozen at generation time. |
| **Grocery** | **`scripts/seed-store-content-blocks.mjs`** and **`pnpm seed:content-blocks`** (API provision + insert). |

Seed slugs use a **template-specific prefix** so one tenant can run multiple templates without collisions:

| Template | Slug prefix |
|----------|-------------|
| Grocery | `seed-cb-` |
| Store | `seed-cb-store-` |
| Travel | `seed-cb-travel-` |
| Hotels | `seed-cb-hotels-` |

Copy in each vertical is tuned to retail, travel, or hotels; structure (pages / regions) matches the shared CMS plan.

### Hotels, store, travel — `init/seed.sql`

1. Ensure the tenant schema and tables exist (`pnpm schema:provision` in the app, or Studio).
2. **Apply seed (no manual UUID/schema):** from **`aurora-hippo-hotels`**, **`-store`**, or **`-travel`**, with the same **`AURORA_API_URL`** / **`AURORA_API_KEY`** as the storefront (typically **`.env.local`**):

   ```bash
   pnpm seed:apply
   ```

   This POSTs the checked-in **`init/seed.sql`** (still containing **`__TENANT_UUID__`** / **`__TENANT_SCHEMA__`**) to **`POST /v1/apply-seed-sql`** on the Aurora API. The server resolves the tenant from the API key, substitutes placeholders, and runs the statements. Requires the API process to have **`DB_URL`** (same as migrations).

   Optional: `pnpm seed:apply -- --dry-run`, or `node ../scripts/hippo-seed/apply-seed-sql-api.mjs --file path/to/seed.sql`.

   **In the storefront:** when the **catalogue** has no products, **Use example data** calls **`POST /api/store/apply-example-data`**, which forwards **`init/seed.sql`** to **`POST /v1/apply-seed-sql`**, then reloads the page (enabled in all environments).

3. **Manual alternative:** replace placeholders in **`init/seed.sql`** and run `psql $DATABASE_URL -v ON_ERROR_STOP=1 -f init/seed.sql` (or Studio SQL).
4. **Meilisearch:** In Aurora Studio open **Settings → Search**. Set **Main catalog table** to your storefront catalogue table (the UI shows the tenant’s **store catalog table**, e.g. `products`). Enable **Index `catalog_product_listing` view** so hits include joined `category_slug` / `category_label` (after schema migration created the view). Then run **Sync index now** (or your usual reindex) so `search_terms` blocks and catalogue search resolve.

The SQL file is idempotent: it deletes prior seed rows for that vertical’s SKUs/slugs, then inserts vendors → zones → categories → products → `store_content_blocks`.

**Regenerating SQL** (e.g. after changing copy in [`scripts/hippo-seed`](../../scripts/hippo-seed)): from the monorepo root, with **`PEXELS_API_KEY`** in root [`.env`](../../.env) if you want live Pexels URLs (otherwise picsum fallbacks):

```bash
node scripts/hippo-seed/emit-seed-sql.mjs hotels
node scripts/hippo-seed/emit-seed-sql.mjs store
node scripts/hippo-seed/emit-seed-sql.mjs travel
# or: node scripts/hippo-seed/emit-seed-sql.mjs all
```

Sources: [`hippo-vertical-catalog.mjs`](../../scripts/hippo-seed/hippo-vertical-catalog.mjs), [`hippo-vertical-content-blocks.mjs`](../../scripts/hippo-seed/hippo-vertical-content-blocks.mjs), [`hippo-vertical-ids.mjs`](../../scripts/hippo-seed/hippo-vertical-ids.mjs).

### Grocery — API seed script

From **`aurora-hippo-grocery`** with API credentials:

```bash
export AURORA_API_URL="https://your-api.example.com"
export AURORA_API_KEY="your-key"
pnpm seed:content-blocks
# or: node scripts/seed-store-content-blocks.mjs
```

- Ensures **`store_content_blocks`** exists via **`POST /v1/provision-schema`** (same table definition as `init/schema-v2.json`).
- Seeds include a default **`product_list`** row with **real catalogue UUIDs** sampled from the **hippo-grocery** tenant via live search (pantry staples: organic spaghetti, Barilla sauce, rice, olive oil, Cirio / cherry tomatoes). Copy and search-term rails read like a finished storefront; **`image_blurb`** URLs use **Pexels** when `PEXELS_API_KEY` is in the monorepo root `.env`, else **picsum** seeds (`hippo-grocery-weekly`, `hippo-grocery-about`).
- Override curated products: **`SEED_PRODUCT_IDS=uuid1,uuid2,...`** (comma-separated record **`id`** values from your products table).
- By default, removes rows whose **`slug`** starts with **`seed-cb-`**, then inserts blocks for the planned **page / region** matrix.
- **`--dry-run`** — log actions only.
- **`--skip-provision`** — only delete/insert seeds (table must already exist).
- **`--no-clean`** — do not delete existing seed-prefix rows (may duplicate on re-run).

## Pexels keys: root vs Aurora Studio

| Where | Used for |
|-------|-----------|
| **Monorepo root `.env`** — `PEXELS_API_KEY` | **Regenerating** hotels/store/travel **`init/seed.sql`** via [`emit-seed-sql.mjs`](../../scripts/hippo-seed/emit-seed-sql.mjs), and **grocery** [`seed-store-content-blocks.mjs`](../scripts/seed-store-content-blocks.mjs) (via [`scripts/hippo-seed`](../../scripts/hippo-seed)). |
| **`aurora-studio` API `.env`** — `PEXELS_API_KEY` | **Runtime** hero fallbacks and `GET /api/tenants/:slug/store/pexels-image` ([`aurora-studio/.env.example`](../../aurora-studio/.env.example)). Copy the same key into Studio’s API env for live storefronts. |

## Studio setup (minimal)

Create rows in **Store content blocks**, for example:

| slug | page | region | block_kind | notes |
|------|------|--------|------------|-------|
| `home-essentials` | home | home_main_feed | search_terms | Comma-separated phrases → single OR search |
| `home-featured` | home | home_main_feed | product_list | Product IDs |
| `for-you-tip` | for_you | for_you_below_cart_blocks | blurb | Body + optional title |

Holmes injections (`basket-bundle`, `catalogue-list`, etc.) are unchanged; they remain template-defined.

## Further reading

Canonical region map and half-width algorithm: [`docs/Content-Blocks-CMS-Regions-And-Holmes-Slots.md`](../../docs/Content-Blocks-CMS-Regions-And-Holmes-Slots.md) (repo root).
