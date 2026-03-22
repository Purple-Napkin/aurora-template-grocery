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

## Per-template seed scripts

Each app includes **`scripts/seed-store-content-blocks.mjs`** and **`pnpm seed:content-blocks`**. Seed slugs use a **template-specific prefix** so one tenant can run multiple templates without collisions:

| Template | Slug prefix |
|----------|-------------|
| Grocery | `seed-cb-` |
| Store | `seed-cb-store-` |
| Travel | `seed-cb-travel-` |
| Hotels | `seed-cb-hotels-` |

Copy in each seed file is tuned to the vertical (retail, travel, hotels); structure (pages / regions) matches the shared CMS plan.

## Seed script (provision table + test rows)

From the relevant `aurora-hippo-*` app with API credentials:

```bash
export AURORA_API_URL="https://your-api.example.com"
export AURORA_API_KEY="your-key"
pnpm seed:content-blocks
# or: node scripts/seed-store-content-blocks.mjs
```

- Ensures **`store_content_blocks`** exists via **`POST /v1/provision-schema`** (same table definition as `init/schema-v2.json`).
- **Grocery** seeds include a default **`product_list`** row with **real catalogue UUIDs** sampled from the **hippo-grocery** tenant via live search (pantry staples: organic spaghetti, Barilla sauce, rice, olive oil, Cirio / cherry tomatoes). Copy and search-term rails are written to read like a finished storefront; **placeholder images** use distinct `picsum.photos` seeds (`hippo-grocery-weekly`, `hippo-grocery-about`) — replace in Studio when you have final art.
- Override curated products: **`SEED_PRODUCT_IDS=uuid1,uuid2,...`** (comma-separated record **`id`** values from your products table).
- By default, removes rows whose **`slug`** starts with this template’s seed prefix, then inserts blocks for the planned **page / region** matrix.
- **`--dry-run`** — log actions only.
- **`--skip-provision`** — only delete/insert seeds (table must already exist).
- **`--no-clean`** — do not delete existing seed-prefix rows (may duplicate on re-run).
- **`SEED_PRODUCT_IDS=uuid1,uuid2`** — adds a **`product_list`** row on **`home` / `home_main_feed`** (optional).

## Studio setup (minimal)

Create rows in **Store content blocks**, for example:

| slug | page | region | block_kind | notes |
|------|------|--------|------------|--------|
| `home-essentials` | home | home_main_feed | search_terms | Comma-separated phrases → single OR search |
| `home-featured` | home | home_main_feed | product_list | Product IDs |
| `for-you-tip` | for_you | for_you_below_cart_blocks | blurb | Body + optional title |

Holmes injections (`basket-bundle`, `catalogue-list`, etc.) are unchanged; they remain template-defined.

## Further reading

Canonical region map and half-width algorithm: [`docs/Content-Blocks-CMS-Regions-And-Holmes-Slots.md`](../../docs/Content-Blocks-CMS-Regions-And-Holmes-Slots.md) (repo root).
