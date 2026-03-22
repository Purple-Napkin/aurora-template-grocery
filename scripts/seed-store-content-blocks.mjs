#!/usr/bin/env node
/**
 * Ensure `store_content_blocks` exists (provision-schema, idempotent) and insert seed rows
 * for every page/region from the content-blocks plan — useful for API + Studio testing.
 *
 * Slugs are prefixed `seed-cb-`. Re-run with --clean to delete those rows first (default).
 *
 * **Curated `product_list` UUIDs** are tuned to the live **hippo-grocery** catalogue (Aurora search, Mar 2026).
 * For another tenant, set **`SEED_PRODUCT_IDS`** to comma-separated record UUIDs or the product_list row will resolve empty and be skipped by the API.
 *
 * Requires: AURORA_API_URL (or NEXT_PUBLIC_AURORA_API_URL), AURORA_API_KEY
 *
 * Usage:
 *   node scripts/seed-store-content-blocks.mjs
 *   node scripts/seed-store-content-blocks.mjs --dry-run
 *   node scripts/seed-store-content-blocks.mjs --skip-provision
 *   node scripts/seed-store-content-blocks.mjs --no-clean
 *   SEED_PRODUCT_IDS=uuid1,uuid2 node scripts/seed-store-content-blocks.mjs
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREFIX = "seed-cb-";

/** Pantry-focused picks from hippo-grocery search (De Cecco, Barilla, rice, oil, tomatoes). */
const DEFAULT_HIPPO_GROCERY_PRODUCT_IDS =
  [
    "3918793e-b56c-4404-b459-3b10b6bd0e52", // De Cecco 100% Organic Spaghetti
    "4167862f-37b4-4b23-bd38-ba64b70d4a4e", // Barilla Pasta Sauce Basilico 400gm
    "47df7aaa-1866-4723-a795-189e287820cf", // Sunwhite Calrose Rice 1Kg
    "7aad9d23-0f7b-4066-acb4-2b8267aa04e2", // Pompeian Organic Robust Extra Virgin Olive Oil
    "832d18af-289e-4e0a-825b-ebe40c3c02b9", // Cirio Pelati Peeled Plum Tomatoes 4x400g
    "a4774f6e-7117-44ca-9110-645b83372ccb", // Organic Cherry Tomato Packed 250g
  ].join(",");

const apiUrl = process.env.AURORA_API_URL || process.env.NEXT_PUBLIC_AURORA_API_URL;
const apiKey = process.env.AURORA_API_KEY;
const productIdsEnv = (process.env.SEED_PRODUCT_IDS || "").trim();
const curatedProductIds = productIdsEnv || DEFAULT_HIPPO_GROCERY_PRODUCT_IDS;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const skipProvision = args.has("--skip-provision");
const noClean = args.has("--no-clean");

if (!apiUrl || !apiKey) {
  console.error(
    "Set AURORA_API_URL (or NEXT_PUBLIC_AURORA_API_URL) and AURORA_API_KEY"
  );
  process.exit(1);
}

const base = apiUrl.replace(/\/$/, "");

function extractStoreContentBlocksTable(schemaPath) {
  const raw = readFileSync(schemaPath, "utf8");
  const parsed = JSON.parse(raw);
  const tables = typeof parsed.tables !== "undefined" ? parsed.tables : parsed;
  const table = tables.find((t) => t.slug === "store_content_blocks");
  if (!table) {
    throw new Error(`store_content_blocks not found in ${schemaPath}`);
  }
  return table;
}

async function provisionTable(tableDef) {
  const url = `${base}/v1/provision-schema`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      schema: { tables: [tableDef] },
      base: "marketplace-base",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`provision-schema ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

async function listRecords(offset = 0) {
  const url = new URL(`${base}/v1/tables/store_content_blocks/records`);
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", String(offset));
  const res = await fetch(url, { headers: { "X-Api-Key": apiKey } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`list records ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

async function deleteRecord(id) {
  const res = await fetch(`${base}/v1/tables/store_content_blocks/records/${id}`, {
    method: "DELETE",
    headers: { "X-Api-Key": apiKey },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`delete ${id} ${res.status}: ${text || res.statusText}`);
  }
}

async function createRecord(body) {
  const res = await fetch(`${base}/v1/tables/store_content_blocks/records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`create ${body.slug} ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

async function cleanSeedRows() {
  let offset = 0;
  let deleted = 0;
  for (;;) {
    const { data, total } = await listRecords(offset);
    const batch = data ?? [];
    for (const row of batch) {
      const slug = String(row.slug ?? "");
      if (slug.startsWith(PREFIX)) {
        if (!dryRun) {
          await deleteRecord(row.id);
        }
        deleted++;
        console.log(dryRun ? "[dry-run] would delete" : "deleted", slug);
      }
    }
    offset += batch.length;
    if (batch.length < 100 || offset >= (total ?? 0)) break;
  }
  return deleted;
}

/** @returns {Record<string, unknown>[]} */
function buildSeeds() {
  const imgWeekly = "https://picsum.photos/seed/hippo-grocery-weekly/960/520";
  const imgAbout = "https://picsum.photos/seed/hippo-grocery-about/960/600";

  const seeds = [
    // --- Home main feed (wired) — curated order: hero products → brand shelf → editorial → halves → promo ---
    {
      slug: `${PREFIX}home-main-products`,
      sort_order: 0,
      page: "home",
      region: "home_main_feed",
      width: "full",
      block_kind: "product_list",
      title: "Pantry picks we stock for busy weeks",
      subtitle: "Organic pasta, passata-ready tomatoes, rice, and oil — one pass down the middle aisles.",
      product_ids: curatedProductIds,
    },
    {
      slug: `${PREFIX}home-main-search`,
      sort_order: 1,
      page: "home",
      region: "home_main_feed",
      width: "full",
      block_kind: "search_terms",
      title: "Brands your household already trusts",
      subtitle: "One search pulls a mixed shelf — swap terms anytime in Studio.",
      search_terms: "Nescafe, Barilla, Weetabix, India Gate, Pompeian, Kelloggs",
    },
    {
      slug: `${PREFIX}home-main-blurb`,
      sort_order: 2,
      page: "home",
      region: "home_main_feed",
      width: "full",
      block_kind: "blurb",
      title: "Shop the way you cook",
      body: "Filter by aisle, dietary needs, or mission — then let Holmes suggest bundles and swaps from what’s in stock. Your cart and For You page stay in sync so you never double-buy the heavy items.",
      link_url: "/catalogue",
      link_label: "Browse full catalogue",
    },
    {
      slug: `${PREFIX}home-main-half-a`,
      sort_order: 3,
      page: "home",
      region: "home_main_feed",
      width: "half",
      block_kind: "blurb",
      title: "Fresh produce first",
      body: "Tomatoes, herbs, and loose veg pair with the organic and Cirio lines in our pantry rail — build a simple sauce night without a second trip.",
      link_url: "/catalogue?category=vegetables",
      link_label: "Vegetables",
    },
    {
      slug: `${PREFIX}home-main-half-b`,
      sort_order: 4,
      page: "home",
      region: "home_main_feed",
      width: "half",
      block_kind: "blurb",
      title: "Breakfast in two taps",
      body: "Cereals plus Nescafe and Coffee-mate-style creamers show up when you search from For You — add milk or juice from Dairy & Beverages in one pass.",
      link_url: "/for-you",
      link_label: "Open For You",
    },
    {
      slug: `${PREFIX}home-main-image`,
      sort_order: 5,
      page: "home",
      region: "home_main_feed",
      width: "full",
      block_kind: "image_blurb",
      title: "This week’s price drops",
      body: "Replace this placeholder image with your weekly deals banner. Tie the CTA to live offers so seasonal produce and bundle SKUs get the spotlight.",
      image_url: imgWeekly,
      link_url: "/offers",
      link_label: "See current offers",
    },
    {
      slug: `${PREFIX}home-below-well`,
      sort_order: 1,
      page: "home",
      region: "home_below_context_well",
      width: "full",
      block_kind: "blurb",
      title: "Smart cart remembers weight",
      body: "Slot reserved above the feed: use it for delivery cut-off times, minimum-order nudges, or weather-based substitutions. Not rendered on the home template yet — available via API with page=home, region=home_below_context_well.",
    },
    {
      slug: `${PREFIX}home-between-missions`,
      sort_order: 1,
      page: "home",
      region: "home_between_missions_and_feed",
      width: "full",
      block_kind: "blurb",
      title: "Missions & rewards",
      body: "When this region is wired, place a short line explaining recipe missions, streaks, or loyalty — keep it under two sentences so the feed loads fast.",
    },
    {
      slug: `${PREFIX}home-below-feed`,
      sort_order: 1,
      page: "home",
      region: "home_below_feed",
      width: "full",
      block_kind: "blurb",
      title: "Still hungry for ideas?",
      body: "Footer rail for newsletter signup, store hours, or “shop last order again”. Hook: recipes_index_below_header and /recipes stay linked from the main nav.",
      link_url: "/recipes",
      link_label: "Recipe ideas",
    },

    // --- For You ---
    {
      slug: `${PREFIX}for-you-blocks`,
      sort_order: 1,
      page: "for_you",
      region: "for_you_below_cart_blocks",
      width: "full",
      block_kind: "search_terms",
      title: "Fill the gaps before checkout",
      subtitle: "Snacks, drinks, and breakfast add-ons that match what’s already in your basket.",
      search_terms: "Mini Cheddars, Haldiram, Sprite, Kelloggs, Nescafe, Mandarins",
    },
    {
      slug: `${PREFIX}for-you-header`,
      sort_order: 1,
      page: "for_you",
      region: "for_you_below_header",
      width: "full",
      block_kind: "blurb",
      title: "Personalised from your cart",
      body: "Holmes keeps bundle and cross-sell rails; this CMS strip is for editorial nudges (e.g. “Add fruit for school lunches”). Wire the region when you want copy directly under the For You heading.",
    },

    // --- Catalogue ---
    {
      slug: `${PREFIX}cat-above`,
      sort_order: 1,
      page: "catalogue",
      region: "catalogue_above_grid",
      width: "full",
      block_kind: "blurb",
      title: "Everything in one grid",
      body: "Use filters for category, store, and dietary tags. Search understands recipe-style queries — try an ingredient or brand. Product images respect your tenant image base URL.",
      link_url: "/catalogue",
      link_label: "Reset filters",
    },
    {
      slug: `${PREFIX}cat-below`,
      sort_order: 1,
      page: "catalogue",
      region: "catalogue_below_filters",
      width: "full",
      block_kind: "search_terms",
      title: "Popular searches right now",
      subtitle: "OR-style query across organic lines, staples, and produce.",
      search_terms: "organic, basmati, tomato, olive oil, cereal, Nescafe",
    },
    {
      slug: `${PREFIX}cat-beverages`,
      sort_order: 2,
      page: "catalogue",
      region: "catalogue_below_filters",
      category_slug: "beverages",
      width: "full",
      block_kind: "blurb",
      title: "Drinks & refills",
      body: "You’re in Beverages — look for multipack savings on juice and soft drinks, then grab coffee or tea for the week. Bundle with snacks from the Snacks aisle for movie night.",
      link_url: "/catalogue?category=snacks",
      link_label: "Pair with snacks",
    },

    // --- PDP, recipe, index ---
    {
      slug: `${PREFIX}pdp-tabs`,
      sort_order: 1,
      page: "product_detail",
      region: "pdp_below_tabs",
      width: "full",
      block_kind: "blurb",
      title: "How we show nutrition",
      body: "Ingredients and allergens come from the catalogue record. If something looks off, flag it in Studio — PDP blocks are perfect for “Prepared in a facility that handles nuts” style disclaimers.",
    },
    {
      slug: `${PREFIX}pdp-context`,
      sort_order: 1,
      page: "product_detail",
      region: "pdp_below_context",
      width: "full",
      block_kind: "blurb",
      title: "Storage & satisfaction",
      body: "Short tip: chilled lines should go straight in the fridge; dry goods keep best sealed. Link to your returns policy if you offer freshness guarantees.",
      link_url: "/about",
      link_label: "Our standards",
    },
    {
      slug: `${PREFIX}recipe-title`,
      sort_order: 1,
      page: "recipe",
      region: "recipe_below_title",
      width: "full",
      block_kind: "blurb",
      title: "Cook along",
      body: "Timers and servings stay in the recipe view; use this strip for chef tips or “swap dairy for oat” notes without cluttering the steps.",
    },
    {
      slug: `${PREFIX}recipe-ingredients`,
      sort_order: 1,
      page: "recipe",
      region: "recipe_below_ingredients",
      width: "full",
      block_kind: "blurb",
      title: "Missing one ingredient?",
      body: "Jump to search with the ingredient name, or open For You — Holmes often surfaces the bundle that completes the dish.",
      link_url: "/for-you",
      link_label: "Open For You",
    },
    {
      slug: `${PREFIX}recipe-index`,
      sort_order: 1,
      page: "recipe_index",
      region: "recipes_index_below_header",
      width: "full",
      block_kind: "blurb",
      title: "Meals planned around your basket",
      body: "Each recipe pulls from real catalogue matches. Start a mission from home to auto-fill ingredients, then tweak quantities before checkout.",
      link_url: "/",
      link_label: "Back to home",
    },

    // --- Checkout & cart ---
    {
      slug: `${PREFIX}checkout-summary`,
      sort_order: 1,
      page: "checkout",
      region: "checkout_above_summary",
      width: "full",
      block_kind: "blurb",
      title: "You’re almost done",
      body: "Payments are encrypted. Delivery slots can move during peak hours — we’ll confirm before charging. Substitutions follow your basket preferences.",
    },
    {
      slug: `${PREFIX}checkout-sidebar`,
      sort_order: 1,
      page: "checkout",
      region: "checkout_sidebar",
      width: "full",
      block_kind: "blurb",
      title: "Need help?",
      body: "Chat opens from the Holmes bubble; for order changes, reference your confirmation email. Sidebar CMS is ideal for support hours and FAQ links.",
      link_url: "/about",
      link_label: "Contact & FAQs",
    },
    {
      slug: `${PREFIX}cart-above`,
      sort_order: 1,
      page: "cart",
      region: "cart_above_lines",
      width: "full",
      block_kind: "blurb",
      title: "Review before you pay",
      body: "Quantities sync with For You and missions. Remove chilled items you no longer need — pickers pack in route order to keep temperature stable.",
    },
    {
      slug: `${PREFIX}cart-below-bundle`,
      sort_order: 1,
      page: "cart",
      region: "cart_below_bundle",
      width: "full",
      block_kind: "blurb",
      title: "Complete the meal",
      body: "Holmes may suggest a bundle under your lines; this block is for static cross-sell copy (e.g. “Add bread for soup night”).",
      link_url: "/catalogue?category=bakery-items",
      link_label: "Bakery aisle",
    },

    // --- Marketing pages ---
    {
      slug: `${PREFIX}offers`,
      sort_order: 1,
      page: "offers",
      region: "offers_below_header",
      width: "full",
      block_kind: "blurb",
      title: "Live savings",
      body: "Offers pull from your data model; this strip can highlight stackable deals (“mix any 3 breakfast lines”). Keep messaging short — the grid below is the hero.",
      link_url: "/catalogue",
      link_label: "Shop all",
    },
    {
      slug: `${PREFIX}promotions`,
      sort_order: 1,
      page: "promotions",
      region: "promotions_below_header",
      width: "full",
      block_kind: "blurb",
      title: "Campaigns & seasonal",
      body: "Use promotions for limited-time events (Ramadan bundles, back-to-school, BBQ week). Match imagery in Studio to the same dates as your email campaigns.",
      link_url: "/offers",
      link_label: "See offers",
    },
    {
      slug: `${PREFIX}about`,
      sort_order: 1,
      page: "about",
      region: "about_main",
      width: "full",
      block_kind: "image_blurb",
      title: "Hippo Grocery",
      body: "We combine Aurora catalogue data, Holmes personalisation, and these CMS blocks so your team can merchandise without redeploying the app. Replace the image with your store front, team, or local growers.",
      image_url: imgAbout,
      link_url: "/catalogue",
      link_label: "Start shopping",
    },
  ];

  return seeds;
}

async function main() {
  const schemaV2Path = join(__dirname, "../init/schema-v2.json");
  const schemaPath = join(__dirname, "../init/schema.json");
  const pathToUse = existsSync(schemaV2Path) ? schemaV2Path : schemaPath;

  const tableDef = extractStoreContentBlocksTable(pathToUse);
  console.log("Using schema:", pathToUse);

  if (!skipProvision) {
    if (dryRun) {
      console.log("[dry-run] would POST /v1/provision-schema (store_content_blocks only)");
    } else {
      const prov = await provisionTable(tableDef);
      console.log("Provision:", prov.message ?? JSON.stringify(prov));
    }
  }

  if (!noClean) {
    console.log(`Cleaning previous ${PREFIX}* rows…`);
    const n = await cleanSeedRows();
    console.log(`Removed ${n} seed row(s).`);
  }

  const seeds = buildSeeds();
  console.log(`Inserting ${seeds.length} seed row(s)…`);

  for (const row of seeds) {
    if (dryRun) {
      console.log("[dry-run] create", row.slug, row.page, row.region);
    } else {
      const created = await createRecord(row);
      console.log("created", row.slug, "→", created.id);
    }
  }

  console.log(dryRun ? "Dry run complete." : "Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
