# Store content blocks (marketplace templates)

All four Aurora marketplace storefront templates use the same **`store_content_blocks`** pipeline, schema shape, UI components, and Holmes proxy behavior.

## What shipped (all four marketplace storefront templates)

- **Schema:** `home_sections` and `curated_collections` removed from each template’s `init/schema.json`. New table **`store_content_blocks`** with `page`, `region`, `block_kind`, scheduling, `width` (`full` / `half`), and product / search / blurb fields. Existing tenants: re-provision or add the table in Studio.
- **API (shared Aurora API):** `computeHomePersonalization` resolves CMS blocks from **`store_content_blocks`** (not the old tables). It filters by **`page`** and **`region`** in the datastore query with a generous limit so narrow regions (e.g. `home_main_feed`) are not dropped when many other rows exist. Query params: **`page`**, **`region`**, **`categorySlug`** (optional, for catalogue-scoped blocks).
- **Defaults:** When `page` / `region` are omitted, they default to **`home`** and **`home_main_feed`** (Holmes home-personalization fetch unchanged).
- **SDK / starter-core:** Use **`@aurora-studio/sdk@^0.2.31`**, **`@aurora-studio/starter-core@^0.1.11`** — `homePersonalization()` and `getHomePersonalization()` accept `contentPage`, `contentRegion`, `categorySlug`.
- **UI (shared pattern):**
  - **Home:** `contentPage=home`, `contentRegion=home_main_feed`. Template-specific rails (e.g. recipe ideas on grocery) stay **template-first**; then CMS blocks. Half-width rows pair on **`md+`**, stack on mobile — both in **SSR** (`HomeSections` / `GroupedStoreContentSections`) and when **Holmes** replaces the feed (`AdaptiveFeed` uses the same **`groupHalfWidthSections`** helper).
  - **For You:** `contentPage=for_you`, `contentRegion=for_you_below_cart_blocks`.
  - **`components/storeContentBlocksUi.tsx`** — shared renderers; For You passes `withHolmesMarkers={false}` so `data-holmes-home-*` attributes are omitted outside the home feed mount.
  - **`AdaptiveFeed`:** Listens for **`holmes:homeSections`** and replaces the SSR feed; half-width grouping matches SSR.
- **Holmes:** `app/api/holmes/home-personalization/route.ts` forwards **`page`**, **`region`**, and **`categorySlug`** to the Aurora API like the server components do.

## Seed data (v1)

Demo **catalogue** lives in **`init/catalog-seed.json`** (applied via `catalog-seed.mjs` → `POST /v1/apply-seed-sql` as generated SQL). Demo **`store_content_blocks`** live in **`init/seed-cms.sql`** (same API route; file still uses **`__TENANT_UUID__`** / **`__TENANT_SCHEMA__`** placeholders — the server substitutes them). **Hotels** also uses **`init/seed-hospitality.sql`** before catalogue.

| Template | Slug prefix (`store_content_blocks`) |
|----------|--------------------------------------|
| Grocery | `seed-cb-grocery-` |
| Store | `seed-cb-store-` |
| Travel | `seed-cb-travel-` |
| Hotels | `seed-cb-hotels-` |

### Apply (any template app)

1. Tenant schema exists (`pnpm schema:provision` or Studio).
2. With **`AURORA_API_URL`** / **`AURORA_API_KEY`** in **`.env.local`**:

   ```bash
   pnpm seed:apply
   ```

   See each template’s `package.json` for the exact order (e.g. hotels runs hospitality SQL, then catalogue JSON, then CMS SQL). Optional: `pnpm seed:apply -- --dry-run`.

3. **Meilisearch:** Studio **Settings → Search** — set main catalog table, enable **`catalog_product_listing`** if applicable, run **Sync index**.

**Regenerating** store / travel / hotels **catalogue JSON + `seed-cms.sql`** from shared vertical definitions: from the Aurora repo root, **`PEXELS_API_KEY`** optional in `.env`, run **`node scripts/emit-travel-store-seeds.mjs`** (`--vertical store|travel|hotels`). Grocery catalogue is maintained in-repo (`catalog-seed.mjs export` or hand-edits).

## Pexels keys: repo root vs Aurora Studio

| Where | Used for |
|-------|-----------|
| **Repo root `.env`** — `PEXELS_API_KEY` | **Regenerating** demo images when running **`emit-travel-store-seeds.mjs`** (picsum fallback if unset). |
| **Aurora Studio API `.env`** — `PEXELS_API_KEY` | **Runtime** hero fallbacks and tenant Pexels routes. |

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
