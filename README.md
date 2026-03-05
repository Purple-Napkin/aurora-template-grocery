# Aurora E-commerce Starter Template

A full-featured retail storefront for Aurora Studio. Showcases Aurora capabilities: Meilisearch search, Holmes mission inference, home page personalization, delivery slots, per-store offers, and multi-step checkout.

**Theme:** Dark mode by default. Set `NEXT_PUBLIC_THEME=light` for a light theme.

---

## Quick Start

1. **Clone and install:**
   ```bash
   git clone https://github.com/marceldupr/aurora-starter-ecom.git
   cd aurora-starter-ecom
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Aurora API URL, API key, and tenant slug (from Aurora Studio → Settings).

3. **Provision schema** (first time only):
   ```bash
   AURORA_API_URL=https://api.yourapp.com AURORA_API_KEY=aur_xxx pnpm schema:provision
   ```
   By default uses `init/schema-v2.json` (enterprise schema with Offers) when present; otherwise `init/schema.json`. Or import in Aurora Studio: Data Builder → Import from JSON.

4. **Enable Meilisearch** (for search): Aurora Studio → Settings → Search → configure Meilisearch, then run "Sync index" for your products table.

5. **Run the app:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3001](http://localhost:3001).

---

## Features

| Feature | Description |
|---------|-------------|
| **Location & Store Selection** | Set delivery location on a map, browse nearby stores |
| **Meilisearch Search** | Live product search dropdown in header |
| **Product Catalogue** | Sidebar filters, Featured/Bestsellers/New/On Sale tabs |
| **Product Detail** | Tabs, You May Also Like (Holmes recommendations when enabled) |
| **Basket & Checkout** | Multi-step checkout, delivery slots, ACME test payment |
| **Holmes** | AI mission inference, bundle banner, home page personalization |
| **Offers** | Store-specific offers (from offers table) or on-sale products |
| **Account** | Profile, Orders, Addresses (Supabase Auth for full features) |

---

## Full Setup Instructions

### 1. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_AURORA_API_URL` | Yes | Aurora API base (e.g. `https://api.yourapp.com`) |
| `AURORA_API_KEY` | Yes | API key from Aurora Studio → Settings → API Keys |
| `NEXT_PUBLIC_TENANT_SLUG` | Yes | Tenant slug (e.g. `acme`) |
| `NEXT_PUBLIC_SITE_NAME` | No | Store name (default: "Store") |
| `NEXT_PUBLIC_LOGO_URL` | No | Logo image URL |
| `NEXT_PUBLIC_ACCENT_COLOR` | No | Accent colour (default: `#38bdf8`) |
| `NEXT_PUBLIC_THEME` | No | `dark` or `light` (default: `dark`) |
| `NEXT_PUBLIC_APP_URL` | No | Full storefront URL for checkout redirects (e.g. `https://shop.yourapp.com`) |

### 2. Schema Provisioning

The template requires: vendors, categories, products, offers (or products with on_sale), orders, order_items, product_substitutions, addresses, hero_banners, home_sections, curated_collections.

**Option A — Provision script:**
```bash
AURORA_API_URL=https://api.yourapp.com AURORA_API_KEY=aur_xxx pnpm schema:provision
```

**Option B — Import in Aurora Studio:**  
Data Builder → Import from JSON → use `init/schema-v2.json` (enterprise) or `init/schema.json`

### 3. Meilisearch (Search)

1. Aurora Studio → Settings → Search
2. Configure Meilisearch URL and master key
3. Select your tenant and products table
4. Run "Clear & Sync" to index products

### 4. Holmes (Personalization)

Holmes is loaded via a script in the layout. Enable Holmes in your tenant's commerce config.

**What Holmes does:**
- Captures behavioural signals (search, product views, cart)
- Inferences shopper mission (e.g. quick meal, bulk shop)
- Injects a **bundle banner** when confidence is high
- **Personalizes the home page** (hero + Meals / Top up / Inspiration sections) when `home-personalization` API is configured
- Replaces "You May Also Like" with mission-driven recommendations on product pages

**Event wiring** (already in this template): `lib/holmes-events.ts` dispatches `holmes:search`, `holmes:productView`, `holmes:cartUpdate`. The Holmes script listens and updates signals.

### 5. Delivery Slots

1. Add vendors with `location` (PostGIS point)
2. Create `vendor_catchments` and `delivery_slots` records
3. Vendors manage slots in the vendor dashboard

### 6. ACME Checkout (Test Payment)

When Stripe is not configured, checkout uses **ACME** — a test provider. Flow:

1. Create session → redirect to `/checkout/acme?session=acme_xxx`
2. Complete payment → redirect to `/checkout/success`

Set `NEXT_PUBLIC_APP_URL` for correct redirects in production.

---

## Holmes Home Personalization

The home page includes placeholders that the Holmes script fills when personalization is enabled:

- **`data-holmes="home-hero"`** — Hero banner (title, subtitle, image, CTAs). Falls back to static `HeroBanner` if no API response.
- **`data-holmes="home-sections"`** — Meals for tonight, Top up on essentials, Inspiration for you. Populated from `home-personalization` API (time of day, holidays, mission).

Requires Aurora Studio with `home-personalization` endpoint and `home_sections` / `curated_collections` tables. See Aurora Studio migrations.

### Time-of-Day & Holiday Promotions

The `home-personalization` API combines:

1. **Holidays** (public table, shared) — Add rows in `public.holidays`:

   | Column     | Example         |
   |------------|-----------------|
   | key        | `valentines`    |
   | name       | Valentine's Day |
   | start_date | 2025-02-14      |
   | end_date   | 2025-02-14      |
   | region     | GB              |

   A migration seeds common GB holidays (Valentine's, Easter, Mother's Day, Christmas, etc.). Add more via SQL or a future admin UI.

2. **Home sections** — In your tenant's `home_sections` table, configure sections with optional filters:
   - `time_of_day`: `morning` | `afternoon` | `evening`
   - `day_of_week`: `mon`–`sun`
   - `holiday_key`: matches `public.holidays.key` (only shown when that holiday is active)

   Sections without filters show for all visitors. Sections with filters show only when conditions match.

3. **CMS overrides** — If you have rows in `hero_banners` or `home_sections`, they take precedence. Holmes falls back to default sections (Meals, Top up, Inspiration) when CMS content is empty.

4. **Pexels images** — Set `PEXELS_API_KEY` in Aurora Studio `.env` to fetch stock imagery for hero and sections when CMS rows have no `image_url`. Get a free key at [pexels.com/api](https://www.pexels.com/api/).

---

## Catalogue Filters

The catalogue page uses a **sidebar layout** on desktop with:

- **Categories** — From your category table (or defaults)
- **Sort options** — Featured, Bestsellers, New Arrivals, On Sale

On mobile, filters open in a bottom drawer.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (provisions schema if env vars set) |
| `pnpm build` | Production build |
| `pnpm start` | Run production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm schema:provision` | Provision schema to Aurora tenant |

---

## Deploy to Vercel

From Aurora Studio: Settings → Storefront → Deploy to Vercel. Environment variables are injected automatically.

---

## SDK Version

This template uses `@aurora-studio/sdk@0.2.9`. Holmes features (offers, chat, home personalization) are available in SDK 0.2.7+.
