#!/usr/bin/env node
/**
 * Enrich grocery catalogue copy: brand-free display names, descriptions, features,
 * storage hints, and nutrition-style text in `attributes` JSON (for PDP tabs).
 * Does not change images, prices, sale flags, or stock.
 *
 * Env: aurora-template-grocery `.env.local` / `.env`, optional monorepo `../../.env`
 * (via loadAllTemplateEnv). Needs AURORA_API_URL / NEXT_PUBLIC_AURORA_API_URL + AURORA_API_KEY.
 *
 *   pnpm catalog:enrich
 *   node scripts/enrich-grocery-catalog.mjs --dry-run
 *   node scripts/enrich-grocery-catalog.mjs --force   # re-apply even if _enriched marker present
 */
import { fileURLToPath } from "url";
import { dirname } from "path";
import { AuroraClient } from "@aurora-studio/sdk";
import { loadAllTemplateEnv } from "./load-template-env.mjs";

const ENRICH_MARKER = "grocery-v1";

loadAllTemplateEnv(import.meta.url);

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");

const baseUrl = (process.env.AURORA_API_URL || process.env.NEXT_PUBLIC_AURORA_API_URL || "").replace(
  /\/$/,
  ""
);
const apiKey = process.env.AURORA_API_KEY || process.env.NEXT_PUBLIC_AURORA_API_KEY || "";

if (!baseUrl || baseUrl.startsWith("/") || !apiKey) {
  console.error("Set AURORA_API_URL (or NEXT_PUBLIC_AURORA_API_URL) and AURORA_API_KEY in .env.local");
  process.exit(1);
}

const client = new AuroraClient({
  baseUrl,
  apiKey,
  specUrl: `${baseUrl}/v1/openapi.json`,
});
const tables = client.tables.bind(client);

/** @param {unknown} v */
function relationId(v) {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "id" in v && typeof v.id === "string") return v.id;
  return null;
}

/**
 * @param {string} slug
 * @param {{ limit?: number }} [opts]
 */
async function listAllRecords(slug, opts = {}) {
  const limit = opts.limit ?? 250;
  const out = [];
  let offset = 0;
  for (;;) {
    const page = await tables(slug).records.list({
      limit,
      offset,
      sort: "created_at",
      order: "asc",
    });
    out.push(...page.data);
    offset += page.data.length;
    if (page.data.length === 0 || out.length >= page.total) break;
  }
  return out;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} name
 * @returns {string | null}
 */
function guessAmpersandBrand(name) {
  const m = name.match(/^(.+?)\s+&\s+(.+?)\s+(.{8,})$/);
  if (!m) return null;
  return `${m[1].trim()} & ${m[2].trim()}`;
}

/**
 * @param {string} name
 * @returns {string | null}
 */
function guessLeadingBrand(name) {
  const t = name.trim();
  const amp = guessAmpersandBrand(t);
  if (amp) return amp;

  const parts = t.split(/\s+/);
  if (parts.length < 2) return null;
  if (/^\d+$/.test(parts[0])) return null;

  const skipLead = /^(organic|fresh|frozen|mild|mature|large|small|whole|semi|skim|low|free|new|british|scottish|english|extra)$/i;
  if (skipLead.test(parts[0])) return null;

  const rest = parts.slice(1).join(" ");
  if (rest.length < 10) return null;

  const first = parts[0];
  if (first.length > 24) return null;

  return first;
}

/**
 * @param {string} name
 * @param {string | null | undefined} brand
 */
function stripBrandFromName(name, brand) {
  let n = name.trim();
  if (!brand) return n;
  const b = brand.trim();
  const variants = [b, b.replace(/\s*&\s*/g, " & "), b.replace(/\s*&\s*/g, "&")];
  for (const v of variants) {
    const re = new RegExp(`^${escapeRegExp(v)}\\s*[-–—]?\\s*`, "i");
    if (re.test(n)) {
      n = n.replace(re, "").trim();
      break;
    }
  }
  return n;
}

/**
 * @param {string} name
 * @param {string} trade
 * @param {string} sub
 */
function classifyKind(name, trade, sub) {
  const n = `${name} ${trade || ""} ${sub || ""}`.toLowerCase();
  if (
    /wine|beer|cider|prosecco|champagne|spirit|vodka|gin|whisky|whiskey|lager|ale|alcohol|aperol|sambuca/.test(
      n
    )
  ) {
    return "beverage_alcohol";
  }
  if (/juice|cola|water|squash|smoothie|tea|coffee|drink|tonic|lemonade/.test(n)) return "beverage_soft";
  if (
    /dishwasher|laundry|bleach|cleaner|surface|toilet|fabric\s*softener|washing\s*powder|detergent|disinfect|mop\s*bucket|sponge\s*scourer/.test(
      n
    )
  ) {
    return "household";
  }
  if (/fruit|vegetable|veg\b|potato|onion|tomato|salad|herb|mushroom|pepper\b|carrot|broccoli|lettuce|apple|banana|pear|berry|grape/.test(n))
    return "produce";
  if (/bread|bagel|bun|croissant|pastry|muffin|cake|roll\b|brioche/.test(n)) return "bakery";
  if (/frozen|ice\s*cream|chips\b.*frozen|peas.*frozen/.test(n)) return "frozen";
  if (/vitamin|supplement|plaster|tablet.*mg|omega|probiotic/.test(n)) return "health";
  if (/cheese|milk|yogurt|yoghurt|butter|cream\b|fromage|dairy/.test(n)) return "dairy";
  if (/cereal|crisp|crisps|chocolate|biscuit|snack|nuts\b|popcorn/.test(n)) return "pantry_snack";
  return "food_general";
}

const DISCLAIMER =
  "\n\nIllustrative values for storefront demos — always read the on-pack nutrition and allergen information.";

/**
 * @param {string} kind
 * @param {string} displayName
 */
function buildNutrition(kind, displayName) {
  const head = `About “${displayName}” (typical / estimated where noted)${DISCLAIMER}`;
  switch (kind) {
    case "household":
      return `${head}\n\nNot for human consumption. Use as directed on the packaging. Keep out of reach of children and pets. Avoid contact with eyes; if contact occurs rinse thoroughly with water.\n\nMay contain: surfactants, bleaching agents, enzymes, perfumes, and colourants — exact composition varies by SKU.`;
    case "health":
      return `${head}\n\nFood supplement style product: take only as directed on pack. Do not exceed the stated dose. Food supplements should not replace a balanced diet. Consult a healthcare professional if pregnant, breastfeeding, or taking medication.\n\nTypical label format: energy, protein, carbohydrate, fat, salt per dose — see pack.`;
    case "produce":
      return `${head}\n\nFresh produce — values vary by variety and season.\n\nVery approximate per 100g (raw): Energy 25–90 kcal, Carbohydrate 3–20g (mostly naturally occurring sugars in fruit), Fibre 1–4g, Protein 0.5–4g, Fat trace–15g (e.g. avocado), Salt <0.05g.\n\nWash before use. Storage: refrigerator for most cut or leafy items unless labelled otherwise.`;
    case "bakery":
      return `${head}\n\nTypical per 100g (baked goods vary widely): Energy 250–400 kcal, Fat 5–20g (of which saturates 1–10g), Carbohydrate 40–60g (sugars 5–25g), Fibre 2–6g, Protein 6–12g, Salt 0.5–1.2g.\n\nContains cereals containing gluten unless labelled gluten-free. May contain milk, egg, sesame, nuts — check pack.`;
    case "frozen":
      return `${head}\n\nFrozen foods — nutrition similar to fresh equivalents once cooked; values on pack are usually per cooked or per 100g as frozen.\n\nTypical frozen veg per 100g: Energy 30–90 kcal, Carbohydrate 4–15g, Fibre 2–5g, Protein 1–4g, Fat trace–8g, Salt 0.01–0.5g.\n\nKeep frozen at ≤ -18°C unless pack states otherwise.`;
    case "dairy":
      return `${head}\n\nTypical dairy (per 100g, varies by fat level): Energy 60–420 kcal, Fat 0.5–35g (saturates 0.3–22g), Carbohydrate 4–12g (sugars 4–12g), Protein 3–25g, Salt 0.1–1.8g.\n\nContains milk. Allergens: see ingredients panel.`;
    case "beverage_alcohol":
      return `${head}\n\nAlcoholic drink — please drink responsibly. Not for sale to under-18s in the UK.\n\nTypical per 100ml: Energy 60–280 kJ / 15–70 kcal depending on ABV and sweetness. Usually negligible fat, protein, and salt; carbohydrate mostly from sugars in wine/spirits mixers.\n\nContains alcohol.`;
    case "beverage_soft":
      return `${head}\n\nTypical soft drink per 100ml: Energy 15–180 kJ / 4–45 kcal, Carbohydrate 0–12g (sugars or sweeteners per pack), Fat trace, Protein trace, Salt trace–0.05g.\n\nHigh caffeine products: not recommended for children or pregnant people — see pack.`;
    case "pantry_snack":
      return `${head}\n\nTypical snack / breakfast cereal per 100g (wide range): Energy 350–550 kcal, Fat 5–30g, Carbohydrate 45–85g (sugars 5–40g), Fibre 2–15g, Protein 5–15g, Salt 0.1–2g.\n\nAllergens: may contain gluten, milk, nuts, peanuts, soya — always check the printed ingredients.`;
    case "food_general":
    default:
      return `${head}\n\nTypical packaged food per 100g (very approximate): Energy 150–500 kcal, Fat 2–35g, Carbohydrate 5–70g, Sugars 2–40g, Protein 2–25g, Salt 0.1–2g.\n\nAllergen statement: see on-pack bold ingredients list.`;
  }
}

/**
 * @param {string} kind
 * @param {string} displayName
 * @param {string} trade
 */
function buildDescription(kind, displayName, trade) {
  const cat = trade ? ` Listed under ${trade.trim()} in our catalogue.` : "";
  switch (kind) {
    case "household":
      return `A dependable household essential for everyday cleaning and care. ${displayName} is chosen for reliable performance around the home.${cat} Follow the on-pack instructions, ventilate the room where advised, and store upright away from food.`;
    case "health":
      return `Supports your routine when used as part of a balanced lifestyle. ${displayName} is merchandised for clarity on shelf — always read and follow the label.${cat} If you have medical conditions or take prescription medicines, seek professional advice before starting any new supplement.`;
    case "produce":
      return `Fresh, flavourful produce picked for quality and shelf appeal. ${displayName} works across salads, sides, and cooking — wash thoroughly before eating or preparing.${cat} Best enjoyed within the use-by or best-before window on the pack.`;
    case "bakery":
      return `Bakery-fresh taste for breakfast, lunchboxes, and teatime. ${displayName} is ideal toasted or as-is depending on the product style.${cat} For allergens (gluten, milk, egg, sesame, nuts), rely on the printed ingredients panel.`;
    case "frozen":
      return `Frozen to lock in freshness and cut waste — cook straight from frozen or thaw safely as the pack recommends. ${displayName} is a practical staple for busy weeks.${cat} Keep the cold chain: return to the freezer promptly after shopping.`;
    case "dairy":
      return `Creamy, versatile dairy for cooking, baking, or straight from the pack. ${displayName} — refrigerate after opening and use within the period shown.${cat} Contains milk unless labelled plant-based; check allergens on pack.`;
    case "beverage_alcohol":
      return `For relaxed evenings and celebrations. ${displayName} — enjoy responsibly and never drink and drive.${cat} Challenge 25: we operate responsible retailing; ID may be required.`;
    case "beverage_soft":
      return `A refreshing choice from our drinks aisle. ${displayName} — serve chilled where it improves flavour.${cat} Check the label for caffeine, sweeteners, or sugar levels to match your preferences.`;
    case "pantry_snack":
      return `Pantry or snack-aisle pick for quick energy and flavour. ${displayName} — portion sizes on pack help with planning lunches and movie nights.${cat} Allergen and may-contain statements are on the packaging.`;
    case "food_general":
    default:
      return `A versatile grocery-line product for your basket. ${displayName} is selected to balance quality and value.${cat} Refer to the pack for full ingredients, allergens, and preparation advice.`;
  }
}

/**
 * @param {string} kind
 * @param {string} displayName
 */
function buildFeatures(kind, displayName) {
  const base = [
    `Selected for our ${kind.replace(/_/g, " ")} range — quality you can trust on shelf.`,
    "Ingredients, allergens, and recycling symbols are always on the physical pack.",
  ];
  if (kind === "household") {
    base.unshift("Keep away from children; never mix with other cleaning products unless the label says it is safe.");
  }
  if (kind === "produce") {
    base.unshift("Wash before eating; trim or peel where you normally would for that variety.");
  }
  if (kind === "beverage_alcohol") {
    base.unshift("Contains alcohol — not suitable for children or pregnancy.");
  }
  return base.slice(0, 5);
}

/**
 * @param {string} kind
 */
function storageFor(kind) {
  switch (kind) {
    case "household":
      return "Store upright in a cool, dry place away from food, children, and pets.";
    case "health":
      return "Store in a cool, dry place; keep the lid closed. Out of direct sunlight unless the label says otherwise.";
    case "produce":
      return "Refrigerate after purchase unless the item is clearly labelled as ambient (e.g. some root veg). Use within the date on pack.";
    case "bakery":
      return "Store in a bread bin or sealed bag; freeze on day of purchase if you need to extend life.";
    case "frozen":
      return "Keep frozen at -18°C (or as pack states). Once thawed, do not refreeze unless cooked into a new dish and the label allows it.";
    case "dairy":
      return "Keep refrigerated. Once opened, consume within the number of days indicated on pack.";
    case "beverage_alcohol":
    case "beverage_soft":
      return "Chill before serving if you prefer; store upright away from direct heat.";
    default:
      return "Store in a cool, dry place; reseal after opening where a reseal closure is provided.";
  }
}

/**
 * @param {string} fullName
 */
function shortFunctionalName(fullName) {
  const t = fullName.trim();
  const lower = t.toLowerCase();
  const shortcuts = [
    [/dishwasher.*tab|tab.*dishwasher/i, "Dishwasher tablets"],
    [/rice\s*crisp/i, "Rice crisps cereal"],
    [/mozzarella|mozarella/i, "Mozzarella cheese"],
    [/prosecco/i, "Prosecco"],
    [/fruit.*veg|veg.*fruit/i, "Fruit & vegetable wash"],
    [/mineral\s*water|spring\s*water/i, "Bottled water"],
  ];
  for (const [re, label] of shortcuts) {
    if (re.test(lower)) return label;
  }
  if (t.length <= 44) return t;
  const cut = t.slice(0, 44);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 18 ? cut.slice(0, sp) : cut).trim()}…`;
}

/**
 * @param {unknown} raw
 */
function parseAttributes(raw) {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const j = JSON.parse(raw);
    return typeof j === "object" && j !== null ? j : {};
  } catch {
    return {};
  }
}

async function main() {
  const config = await client.store.config();
  const catalogSlug = config.catalogTableSlug || "products";
  console.log(`Catalog table: ${catalogSlug}`);

  const products = await listAllRecords(catalogSlug);
  let updated = 0;

  for (const p of products) {
    const id = relationId(p.id);
    if (!id) continue;

    const name = String(p.name ?? "").trim();
    if (!name) continue;

    const existingBrand = p.brand ? String(p.brand).trim() : "";
    const guessed = existingBrand || guessLeadingBrand(name);
    const strippedName = stripBrandFromName(name, guessed).trim();
    const displayName = strippedName.length >= 4 ? strippedName : name;
    const trade = String(p.trade_category_leaf ?? "").trim();
    const sub = String(p.subcategory ?? "").trim();
    const kind = classifyKind(displayName, trade, sub);

    const attrs = parseAttributes(p.attributes);
    if (!force && attrs._enriched === ENRICH_MARKER) {
      continue;
    }

    const description = buildDescription(kind, displayName, trade);
    const nutrition = buildNutrition(kind, displayName);
    const features = JSON.stringify(buildFeatures(kind, displayName));
    const storage_instructions = storageFor(kind);
    const newAttrs = JSON.stringify({
      ...attrs,
      _enriched: ENRICH_MARKER,
      nutrition,
    });

    const fn = shortFunctionalName(displayName);
    const patch = {};
    if (displayName !== name) patch.name = displayName;
    if (guessed && guessed !== existingBrand) patch.brand = guessed;
    if (String(p.functional_name ?? "").trim() !== fn) patch.functional_name = fn;
    if (String(p.description ?? "").trim() !== description) patch.description = description;
    if (String(p.features ?? "") !== features) patch.features = features;
    if (String(p.storage_instructions ?? "").trim() !== storage_instructions) {
      patch.storage_instructions = storage_instructions;
    }
    if (String(p.attributes ?? "") !== newAttrs) patch.attributes = newAttrs;
    if (!p.country_of_origin) patch.country_of_origin = "United Kingdom";

    if (Object.keys(patch).length === 0) continue;

    console.log(
      `${dryRun ? "[dry-run] " : ""}PATCH ${p.sku || id}: ` +
        Object.keys(patch).join(", ")
    );

    if (!dryRun) {
      await tables(catalogSlug).records.update(id, patch);
    }
    updated++;
  }

  console.log(
    dryRun
      ? `[dry-run] Would update ${updated} product(s).`
      : `Done: updated ${updated} product(s). Reindex search in Studio if needed.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
