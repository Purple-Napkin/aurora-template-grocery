# Aurora template — Grocery

A full-featured retail storefront for Aurora Studio. Showcases Aurora capabilities: Meilisearch search, Holmes mission inference, delivery slots, per-store promotions, and multi-step checkout.

**Theme:** Dark mode by default. Set `NEXT_PUBLIC_THEME=light` for a light theme.

---

## Quick Start

1. **Create or clone:**
   - **Option A - From Studio:** Sign up at [Aurora](https://aurora.mandeville.digital), create a workspace from **Grocery (example template)** (`aurora-template-grocery`). Studio provisions the base schema; the storefront adds the full schema on first run.
   - **Option B - Clone:**
   ```bash
   git clone https://github.com/Purple-Napkin/aurora-template-grocery.git
   cd aurora-template-grocery
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Aurora API URL, API key, and tenant slug (from Aurora Studio → Settings).

3. **Provision schema** (first time only, if not provisioned via Studio):
   ```bash
   AURORA_API_URL=https://api.yourapp.com AURORA_API_KEY=aur_xxx pnpm schema:provision
   ```
   By default uses `init/schema-v2.json` (enterprise schema with Offers) when present; otherwise `init/schema.json`. Or import in Aurora Studio: Data Builder → Import from JSON.

4. **Demo catalog + content blocks** (optional — empty tenants only): checked-in **`init/seed.sql`** posts to the API via **`pnpm seed:apply`**. Use **`pnpm seed:apply -- --dry-run`** to validate without writing. See [`docs/CONTENT-BLOCKS.md`](docs/CONTENT-BLOCKS.md).

5. **Enable Meilisearch** (for search): Aurora Studio → Settings → Search → configure Meilisearch, then run "Sync index" for your products table.

6. **Run the app:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3001](http://localhost:3001).

---

## Features

- **Intent-first entry** - "What are you trying to do?" Mission chips first, search secondary. Active mission bar when Holmes infers intent (dismiss/reset).
- **Location & Store Selection** - Set delivery location on a map, browse nearby stores
- **Meilisearch Search** - Live product search (secondary to missions on home)
- **Product Catalogue** - Featured, Bestsellers, New Arrivals, On Sale tabs; category filters. Mission-aware narrowing: categories reordered, "For your mission" section when confidence high.
- **Product Detail** - Tabs (Details, Nutrition, Feedback), You May Also Like
- **Basket & Checkout** - Multi-step checkout with delivery slot selection; ACME test payment flow (`/checkout/acme`, `/checkout/success`). Guardrail hints ("Egg noodles absorb sauce better than spaghetti").
- **Holmes** - Rules-based intent engine (no generative AI). Mission inference, active mission bar, catalogue narrowing, guardrail rules. Cart **combo** discovery (`holmesCombosForCart`), selected combo on session, contextual “bundle for your cart” hints. One-click bundle checkout when enabled.
- **Promotions** - Store-specific offers and on-sale products
- **Account** - Profile, Orders, Addresses (integrate Supabase Auth for full features)

## Setup

1. Copy `.env.example` to `.env.local`
2. Configure environment variables (see below)
3. Provision your Aurora tenant with the base schema (see Schema)
4. Run `pnpm dev`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_AURORA_API_URL` | Yes | Aurora API base URL (e.g. `https://api.yourapp.com`) |
| `AURORA_API_KEY` | Yes | API key from Aurora Studio → Settings → API Keys |
| `NEXT_PUBLIC_TENANT_SLUG` | Yes | Your tenant slug (e.g. `acme`) |
| `NEXT_PUBLIC_SITE_NAME` | No | Store name (default: "Store") |
| `NEXT_PUBLIC_LOGO_URL` | No | Logo image URL (default: bundled `/template-logo.png`) |
| `NEXT_PUBLIC_ACCENT_COLOR` | No | Accent colour (default: `#38bdf8`) |

## Base Schema

Provision the required tables before using the template:

**Option A - Provision script** (recommended; uses `init/schema-v2.json`)
```bash
AURORA_API_URL=https://api.yourapp.com AURORA_API_KEY=aur_xxx pnpm schema:provision
```

**Option B - Import in Aurora Studio**  
Data Builder → Import from JSON → use `schema/base-store-schema-import.json` (subset aligned with v2 products; full marketplace schema is in `init/schema-v2.json`).

If you get 401/403 on Option A, use Option B instead.

**After DB migration `20260322140000_template_schema_cleanup`:** call `POST /v1/run-schema-migration` per tenant (API key) to recreate `catalog_product_listing`, then reindex Meilisearch.

**Tables created (v2 provision):** vendors, vendor_products, categories, products, zones, orders, order_items, product_substitutions, addresses, hero_banners, site_images, store_content_blocks (see `init/schema-v2.json`)

For **Meilisearch** search to work, enable Meilisearch in Aurora Settings and run an index sync for your products table.

For **delivery slots**, add vendors with `location` (PostGIS), create `vendor_catchments` and `delivery_slots` records. Vendors manage slots in the vendor dashboard.

## Holmes

Holmes is a rules-based intent engine. It uses deterministic and heuristic algorithms with configurable business rules. It does not use generative AI. Holmes is auto-injected when `NEXT_PUBLIC_AURORA_API_URL` and `NEXT_PUBLIC_TENANT_SLUG` are set. It captures behavioural signals and adapts the experience:

- **Active mission bar** – Shows inferred mission (e.g. "Travel essentials", "Cook dinner") with confidence band. Dismiss or reset.
- **Mission-first command surface** – "What are you trying to do?" with Start here chips; search is secondary.
- **Catalogue narrowing** – When confidence is high, categories reorder by mission and a "For your mission" section appears. Dismissing the mission bar restores full categories.
- **Guardrail rules** – Contextual hints with micro-learning (e.g. "Egg noodles absorb sauce better than spaghetti" when cart has stir-fry ingredients + spaghetti).

Enable Holmes in your tenant commerce config. For standalone deployment, set `NEXT_PUBLIC_APP_URL` on the Aurora API to your storefront URL so Holmes redirects correctly after one-click checkout.

## How to Use

### First-time setup

1. **Create a workspace** in [Aurora Studio](https://aurora.mandeville.digital) from the **Grocery (example template)** entry, or clone this repo and provision schema manually.
2. **Configure `.env.local`** with `NEXT_PUBLIC_AURORA_API_URL`, `AURORA_API_KEY`, and `NEXT_PUBLIC_TENANT_SLUG` (from Studio → Settings).
3. **Enable Meilisearch** in Studio → Settings → Search, then run "Sync index" for products.
4. Run `pnpm dev` and open [http://localhost:3001](http://localhost:3001).

### Shopping flow

- **Home** – "What are you trying to do?" Mission chips first (Start here), search secondary. Active mission bar when Holmes infers intent. Holmes personalizes sections when it infers intent.
- **Catalogue** – Browse by category, filter. When mission bar is active and confidence high: categories reorder by mission, "For your mission" section at top. Holmes can surface "Recommended for you" when it has session context.
- **Product page** – Details, nutrition, feedback. "You May Also Like" and Holmes tidbits adapt to mission.
- **Cart** – Bundle suggestions ("Often bought together"), guardrail hints ("Egg noodles absorb sauce better than spaghetti" when stir-fry + spaghetti). Substitute button on items.
- **Checkout** – Multi-step flow. Holmes compresses checkout (hides extras) when it infers urgency. ACME test payment when Stripe not configured.

### Holmes behaviour

- Holmes infers mission from search, cart, browsing, time of day. Add `?holmes_disabled=1` to any URL to disable for testing.
- **Dev tools** – In development, a Holmes toolbar appears: reset session, toggle Holmes off.
- **Combos & recipes** – Search for "paella" or "curry"; Holmes may infer a recipe mission and transform the home. Multi-option **recipe/combo picker** from cart when the API returns bundles.
- **Control Dashboard** – In Aurora Studio → Holmes Control, view live inferences and mission distribution.

### Deploying

From Aurora Studio: Settings → Storefront → Deploy to Vercel. Environment variables are injected automatically. For standalone deploy, set `NEXT_PUBLIC_APP_URL` on the Aurora API to your storefront URL.

---

## ACME Checkout

When Stripe is not configured, the template uses **ACME** - a test payment provider. Checkout flow:

1. Create session via `/store/checkout/sessions` → returns ACME session URL
2. User completes payment at `/checkout/acme?session=acme_xxx`
3. Redirect to `/checkout/success` or custom success URL

The API redirects to `/checkout/acme` when the success path starts with `/checkout`. Configure `NEXT_PUBLIC_APP_URL` for correct redirects in standalone deployment.

## Deploy to Vercel

From Aurora Studio: Settings → Apps → deploy. Uses template `aurora-template-grocery` from the Template Registry. Environment variables are injected when you generate deploy credentials.

---

## SDK Version

Pinned versions are in `package.json` (currently **`@aurora-studio/sdk@^0.2.33`**, **`@aurora-studio/starter-core@^0.1.15`**). Holmes features (active mission, home personalization, guardrails, offers, session attribution, time-to-completion metrics) are available in SDK 0.2.7+; **cart combos, `holmesSelectCombo`, contextual `hasCombo`** require **0.2.22+**.

_Last build trigger: March 2026_
