# Holmes Demo Scenarios

Deterministic demo flows for verifying Holmes adaptive storefront behaviour.

## Quick Start

1. Ensure Aurora API is running (`pnpm dev` in aurora-studio) and Aurora has provisioned products.
2. Run the ecom storefront: `pnpm dev` (port 3001).
3. Open `/demo` for scenario cards with direct links.

## Demo Parameter

Append `?holmes_demo=mission` to any page URL. Holmes persists this in `sessionStorage` so it survives navigation (catalogue → cart → checkout).

| Mission               | Effect                                                        |
| --------------------- | ------------------------------------------------------------- |
| `urgent_replenishment`| Hides checkout-extras, cross-sell; highlights payment         |
| `browsing`            | Expands discovery; recommendations visible                   |
| `ready_to_pay`        | Payment focus, checkout compression                           |
| `routine_shop`        | Standard flow, no directives                                  |
| `discovery`           | Expand discovery, new arrivals favored                        |

## Verification Steps

### Urgent scenario (5.2.1)

1. Go to `/catalogue?holmes_demo=urgent_replenishment`
2. Add an item to cart
3. Proceed to checkout
4. **Verify:** `[data-holmes=checkout-extras]` has class `holmes-hidden`
5. **Verify:** Promo code / cross-sell section hidden

### Browsing scenario (5.2.2)

1. Go to `/catalogue?holmes_demo=browsing` or a product page
2. **Verify:** Recommendations section visible (not hidden)
3. **Verify:** "You May Also Like" shows Holmes picks with ✨

### "Why this?" (5.2.3)

1. Use any demo scenario that returns a bundle (e.g. `browsing`, add to cart)
2. On product page or cart, when Holmes injects recommendations
3. **Verify:** "Why this?" button appears
4. Click **Verify:** Reasoning tooltip expands

## E2E Tests

```bash
# First time: install browser
pnpm test:e2e:install

# Requires: ecom dev server (pnpm dev) + Aurora API. Runs automatically if not up.
pnpm test:e2e

# With UI
pnpm test:e2e:ui
```

Tests cover:

- Demo page loads and shows all scenario cards
- Urgent: `[data-holmes=checkout-extras]` has `holmes-hidden` when cart has items + holmes_demo
- Browsing: `[data-holmes=recommendations]` visible and not hidden on product page
- sessionStorage: holmes_demo persists across navigation

Tests skip gracefully when catalog is empty (no products).

## Control Dashboard

Open Holmes Control in Aurora Studio to see live inferences. Demo-mode requests appear with `holmes_demo` in the signals payload.
