# Holmes in the Store

Holmes adapts the storefront to each shopper's intent - recommendations, checkout flow, and discovery surfaces change based on inferred mission (urgent replenishment, browsing, discovery, etc.).

## Quick Start

1. Ensure Aurora API is running (`pnpm dev` in aurora-studio) and Aurora has provisioned products.
2. Run the ecom storefront: `pnpm dev` (port 3001).
3. Shop normally - home, catalogue, product pages, cart, checkout. Holmes infers from behaviour and adapts.

## Holmes Targets

| Target | Location | Holmes behaviour |
|--------|----------|------------------|
| `home-sections` | Home | Personalized sections (Meals, Top up, Based on your browsing) |
| `catalogue-list` | Catalogue | "Recommended for you" block |
| `recommendations` | Product detail | "You May Also Like" with mission-specific picks |
| `basket-bundle` | Cart | "Often bought together" bundle suggestion |
| `checkout-summary` | Cart | Checkout CTA, streamlined copy when fast checkout |
| `cross-sell` | Cart | Promo code / cross-sell (hidden when urgent) |
| `checkout-extras` | Checkout | Delivery options, substitutions (hidden when urgent) |
| `payment` | Checkout | Payment button (highlighted when ready-to-pay) |

## Disabling Holmes

Add `?holmes_disabled=1` to any URL to disable Holmes for testing.

## E2E Tests

```bash
# First time: install browser
pnpm test:e2e:install

# Requires: ecom dev server (pnpm dev) + Aurora API
pnpm test:e2e

# With UI
pnpm test:e2e:ui
```

Tests cover:

- Checkout flow with Holmes targets
- Recommendations visible on product page
- Cart flow with checkout CTA

Tests skip gracefully when catalog is empty (no products).

## Control Dashboard

Open Holmes Control in Aurora Studio to see live inferences and mission distribution.
