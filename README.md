# Aurora E-commerce Showcase Template

A full-featured retail storefront for Aurora Studio. Showcases Aurora capabilities: Meilisearch search, Holmes mission inference, delivery slots, per-store promotions, and multi-step checkout.

**Theme:** This template uses **dark mode** by default. Toggle via `NEXT_PUBLIC_THEME=light` for a light theme.

**Aurora** is an all-in-one, no-code platform for stores, marketplaces, CRMs, and more.

## Features

- **Location & Store Selection** — Set delivery location on a map, browse nearby stores
- **Meilisearch Search** — Live product search dropdown in header
- **Product Catalogue** — Featured, Bestsellers, New Arrivals, On Sale tabs; category filters
- **Product Detail** — Tabs (Details, Nutrition, Feedback), You May Also Like
- **Basket & Checkout** — Multi-step checkout with delivery slot selection; ACME test payment flow (`/checkout/acme`, `/checkout/success`)
- **Holmes** — AI mission inference; one-click bundle checkout when enabled
- **Promotions** — Store-specific offers and on-sale products
- **Account** — Profile, Orders, Addresses (integrate Supabase Auth for full features)

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
| `NEXT_PUBLIC_LOGO_URL` | No | Logo image URL |
| `NEXT_PUBLIC_ACCENT_COLOR` | No | Accent colour (default: `#38bdf8`) |
| `NEXT_PUBLIC_THEME` | No | `dark` or `light` (default: `dark`) |

## Base Schema

Provision the required tables before using the template:

**Option A — Import in Aurora Studio**  
Data Builder → Import from JSON → use `schema/base-store-schema-import.json`

**Option B — Provision script** (requires tenant admin API key)
```bash
AURORA_API_URL=https://api.yourapp.com AURORA_API_KEY=aur_xxx TENANT_SLUG=your-tenant pnpm schema:provision
```
If you get 401/403, use Option A instead.

**Tables created:** vendors, categories, products, promotions, orders, order_items, product_substitutions, addresses

For **Meilisearch** search to work, enable Meilisearch in Aurora Settings and run an index sync for your products table.

For **delivery slots**, add vendors with `location` (PostGIS), create `vendor_catchments` and `delivery_slots` records. Vendors manage slots in the vendor dashboard.

## Holmes

Holmes works like Google Analytics: a small script loads from the central Aurora API, sends behavioural signals, and periodically fetches AI-suggested bundles. **Scales to thousands of storefronts** — one API, one script URL, identified by `?site=tenant`.

**Holmes exposure via SDK** (see `lib/aurora.ts`):
- `holmesInfer(sessionId)` — Mission inference, bundle suggestions
- Holmes script (embedded in layout) — Auto-captures signals, applies directives, injects bundle banner
- **SDK 0.2.7+** also exposes: `holmes.offers(sessionId)`, `holmes.chat.send(sid, content)`, `holmes.chat.list(sid)` for custom offers and chat

**Mission Deep Dive** is a Control Dashboard feature (staff only) for inspecting session signals — not exposed to the storefront.

**Embed (any storefront):**
```html
<script async src="https://api.aurora.com/api/holmes/v1/script.js?site=your-tenant"></script>
```

The script auto-captures mouse, typing, scroll; for best results, push commerce events:
- `window.holmes.setSearch('pasta')` when user searches
- `window.holmes.setProductsViewed(['id1','id2'])` when viewing products
- `window.holmes.setCartCount(n)` and `window.holmes.setCartItems([...])` when cart changes

Or dispatch DOM events: `holmes:search`, `holmes:productView`, `holmes:cartUpdate` (see `lib/holmes-events.ts`).

This template wires search, product views, and cart updates automatically. Enable Holmes in your tenant commerce config. Set `NEXT_PUBLIC_APP_URL` on the Aurora API for correct post-checkout redirects.

## ACME Checkout

When Stripe is not configured, the template uses **ACME** — a test payment provider. Checkout flow:

1. Create session via `/store/checkout/sessions` → returns ACME session URL
2. User completes payment at `/checkout/acme?session=acme_xxx`
3. Redirect to `/checkout/success` or custom success URL

The API redirects to `/checkout/acme` when the success path starts with `/checkout`. Configure `NEXT_PUBLIC_APP_URL` for correct redirects in standalone deployment.

## Deploy to Vercel

From Aurora Studio: Settings → Storefront → Deploy to Vercel. Env vars are injected automatically.
