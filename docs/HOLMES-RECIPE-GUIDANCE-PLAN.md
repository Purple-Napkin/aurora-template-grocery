# Holmes Recipe Guidance – UX Improvement Plan

## Status (March 2026)

| Item | Status |
|------|--------|
| Proactive notification (`hasCombo` / `comboTitle` on contextual hint; cart IDs) | **Shipped** – API + `HolmesContextualWell` / mission surfaces |
| Recipe collages / ingredient fallback | **Partial** – `holmes-recipe-expand`, product resolution ongoing where Meilisearch is thin |
| Earlier guidance (home / catalogue / cart banners, basket-bundle ranker) | **Shipped** – `next-step-ranker`, storefront placeholders |
| Multi-combo API + picker + `holmesSelectCombo` | **Shipped** – `combos-for-cart`, `RecipePicker` pattern in ecom template |
| Category restriction to selected combo (`restrictCategoriesToCombo`) | **Planned** – see template + `home-personalization` follow-up |

**Next product slice:** [Holmes whitepaper](../../aurora-studio/docs/HOLMES-WHITEPAPER.md) – mission-driven UX, inference-driven prioritisation, hints, and bundles.

---

Feedback from user testing (March 2026):

1. **No proactive notification** – Holmes never informed the user that it had recipes for their cart or was "thinking about options."
2. **Recipe cards lack collages** – Some recipes (e.g. Beef and Tomato Stuffed Potatoes, Stuffed Beef Tomatoes) show only a chef-hat placeholder instead of product images.
3. **Guidance too late** – "Complete your stuffed beef tomatoes" only appeared at checkout, not earlier (cart, home, catalogue).
4. **No recipe choice** – User wanted to pick from multiple recipes based on cart, then have categories restricted and be guided to complete the chosen recipe.

---

## Current State

| Area | Current behavior |
|------|------------------|
| **Mission bar** | Shows inferred mission (In a hurry, High confidence) but does not mention recipes. |
| **Contextual well** | Rule-based hints (sandwich, cereal, pasta) – never "We have recipes for your cart." |
| **Recipe collages** | `HomeSections` fetches `holmesRecipeProducts(slug, 4)` per recipe. Empty → chef hat. AI-generated combos (`cart-{fp}`) may have no Meilisearch products or missing `image_url`. |
| **Basket bundle** | Holmes script injects into `data-holmes="basket-bundle"` on **cart only**. Uses `inferComboFromCartWithAI` → single combo. |
| **Combo-from-cart API** | Returns **one** combo per cart fingerprint. No multi-option API. |
| **Category narrowing** | `narrowCatalog` reorders categories by mission; does not restrict to recipe ingredients. |

---

## Implementation Plan

### 1. Proactive notification ("We have recipes for you")

**Goal:** Tell the user early that Holmes has recipe options for their cart.

**Backend (aurora-studio):**
- Extend `getContextualHint` or add a lightweight `GET /store/holmes/combos-for-cart` that:
  - Accepts `cart_ids` (or `cart_names`) and `sid`
  - Calls `inferComboFromCartWithAI` when cart has ≥2 items
  - Returns `{ hasCombo: true, comboTitle?: string }` or `{ hasCombo: false }` (no full inference if expensive; could use a cheap check first)

**Frontend (aurora-starter-ecom):**
- **HolmesContextualWell**: When `hasCombo: true`, show a banner: *"Holmes found a recipe for what you're building – [View options]"* or *"We're thinking about options for you."*
- **ActiveMissionBar**: When `activeMission` is `recipe_mission` or `combo_mission` and cart has items, add a line: *"Recipes available for your cart"* with a link to cart or recipe picker.
- **Cart page**: Add a persistent banner at top when combo exists: *"Complete your [Recipe] – add missing ingredients"* (before the Holmes-injected bundle).

**Placement:** Home, cart, catalogue header, product pages (when cart has items).

---

### 2. Recipe card collages (fix chef-hat fallback)

**Root cause:** `holmesRecipeProducts(slug, 4)` returns products without `image_url`, or no products for AI-generated slugs (e.g. `cart-abc123`).

**Fixes:**

1. **Fallback to recipe ingredients**  
   When `holmesRecipeProducts` returns 0 products, fetch `holmesRecipe(slug)` and search Meilisearch by ingredient names. Use those product images for the collage.

2. **Ensure products have images**  
   `combo-products` and `recipe-products` already use `normalizeHitImage`. Verify `image_url` is populated from catalog/Meilisearch. If products exist but lack images, consider a DB fallback for `products.image` or `products.image_url`.

3. **Preload collages for AI combos**  
   When `inferComboFromCartWithAI` creates a combo, the combo is stored in `holmes_recipes` with ingredients. The `combo-products` API uses `getOrFetchRecipe` + ingredient-based search. For home "Recipes for tonight", we show `holmesRecentRecipes` – which includes AI combos. Ensure we fetch products for those slugs (they use `cart-{fp}`) and that the search finds matches.

4. **Expand search for long titles**  
   Slugs like `beef-and-tomato-stuffed-potatoes` may not match Meilisearch well. `expandRecipeQuery` in `holmes-recipe-expand` could add variants (e.g. "stuffed potatoes", "beef tomatoes") for better recall.

---

### 3. Earlier guidance (surface "Complete your X" before checkout)

**Goal:** Show "Complete your [Recipe]" on home, cart, and catalogue – not only at checkout.

**Backend:**
- Holmes fragment `basket-bundle` is currently requested when route matches `/cart`. Extend `next-step-ranker` or fragment selection so `basket-bundle` is also requested on:
  - Home (when `recipe_mission` or `combo_mission` and cart has items)
  - Catalogue (when same conditions)
- Or add a new fragment type `recipe-completion-banner` that is lighter (headline + CTA) and can appear on multiple routes.

**Frontend:**
- Add `data-holmes="basket-bundle"` (or `recipe-completion-banner`) on:
  - **Home**: Inside `MissionAwareSections` or above `HomeSections` when mission is recipe-related.
  - **Catalogue**: Above product grid when mission is recipe-related and cart has items.
- Holmes script already injects into `data-holmes="basket-bundle"` on cart. Ensure the script also polls/injects when on home/catalogue with the right conditions.

**Alternative:** A server-rendered or client-fetched "Complete your X" banner that calls an API (e.g. `combos-for-cart`) and renders without waiting for the Holmes script. Simpler but duplicates logic.

---

### 4. Recipe choice + category restriction

**Goal:** User picks from 2–3 recipes based on cart; after selection, categories are restricted to that recipe’s ingredients and the UI guides completion.

**Backend (aurora-studio):**

1. **Multi-combo API**  
   - New: `POST /tenants/:slug/holmes/combos-from-cart` or `GET /store/holmes/combos-for-cart?cart_ids=...&limit=3`
   - Returns 2–3 combos. Options:
     - **A:** Call `inferComboFromCartWithAI` 2–3 times with different temperature or "give me 3 options" prompt.
     - **B:** Single AI call with prompt: *"Return 3 distinct recipe options as JSON array."*
   - Response: `{ combos: [{ slug, title, productImageUrls? }] }`

2. **Selected combo persistence**  
   - Store `selected_combo_slug` in Holmes session (or cookie/localStorage for storefront).
   - Holmes script / session already has `comboViewed`. Add `selectedCombo` or use `comboViewed` as the "chosen" combo when user explicitly selects.

3. **Category restriction**  
   - `home-personalization` and catalogue need to support "restrict to recipe ingredients."
   - New `uiHints`: `restrictCategoriesToCombo: string` (combo slug).
   - When set, categories sidebar shows only categories that contain products matching the combo’s ingredients (from `holmesRecipeProducts` or recipe ingredients).
   - "For your mission" section filters to those products only.

**Frontend (aurora-starter-ecom):**

1. **Recipe picker UI**  
   - When cart has ≥2 items and combos exist:
     - Show "Pick a recipe" section (modal or inline) with 2–3 cards.
     - Each card: collage, title, "Select" button.
   - On select: call API to set `selected_combo_slug`, refresh mission/personalization, close picker.

2. **Category restriction**  
   - When `restrictCategoriesToCombo` is set:
     - Catalogue sidebar: only show categories that have products for that combo.
     - Product grid: default to "For your recipe" filtered view.
     - Mission bar: "Completing: [Recipe] – X items left."

3. **Guidance copy**  
   - "Add these to finish your [Recipe]" with checklist of missing ingredients.
   - Progress indicator: "3 of 8 ingredients in cart."

---

## Priority Order

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Proactive notification (contextual well + mission bar) | Medium | High |
| 2 | Recipe collages fallback (ingredients search when products empty) | Small | High |
| 3 | Earlier guidance (basket-bundle on home + catalogue) | Medium | High |
| 4 | Recipe choice API + picker UI | Large | High |
| 5 | Category restriction to selected recipe | Large | Medium |

---

## Files to Touch

**aurora-studio**
- `apps/api/src/lib/holmes-contextual-hint.ts` – add combo-aware hint
- `apps/api/src/lib/holmes-combo-from-cart.ts` – optional multi-combo support
- `apps/api/src/routes/holmes.ts` – new combos-for-cart endpoint; fragment on home/catalogue
- `apps/api/src/lib/home-personalization.ts` – `restrictCategoriesToCombo`
- `packages/holmes-core/src/next-step-ranker.ts` – basket-bundle on home

**aurora-starter-ecom**
- `components/HolmesContextualWell.tsx` – "We have recipes" banner
- `components/ActiveMissionBar.tsx` – recipe-available line
- `components/HomeSections.tsx` – collage fallback from ingredients
- `app/cart/page.tsx` – recipe picker section
- `app/catalogue/page.tsx` – category restriction; `data-holmes` for bundle
- `app/page.tsx` – `data-holmes="basket-bundle"` on home when recipe mission
