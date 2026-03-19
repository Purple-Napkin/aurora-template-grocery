# Holmes Intent Alignment

> **North Star:** Holmes is an **observational intent detector**. It watches behaviour, infers what the user wants, and adapts the experience. The UI expresses Holmes - it does not replace it.

---

## Core Principle

**Holmes interprets reality.** It does not present static menus.

| Holmes does | Holmes does not |
|-------------|-----------------|
| Infer intent from signals (cart, search, browsing, time) | Show fixed category grids |
| Suggest "travel adapter, face wipes" because it saw chapstick + suntan lotion | Assume the user wants "Cook dinner" |
| Adapt quick actions, missions, feed based on inference | Display pre-determined options only |
| Use pre-filled data (recipes, lists) as *suggestions to surface* | Treat recipes/lists as static content |

---

## Example: Travel Prep Inference

**Signals:** User adds chapstick, suntan lotion to cart.

**Holmes infers:** Travel / holiday prep.

**Holmes surfaces:** Travel adapter, face wipes, travel-sized products, packing essentials.

**Why it works:** Holmes *figured it out* from observation. The user didn't pick "Travel" from a menu.

---

## Data Requirements

For Holmes to suggest intelligently, we need **pre-filled data** it can draw from:

1. **Recipes** (`holmes_recipes`) – Holmes surfaces recipe ideas when it infers a cooking mission.
2. **Pre-determined shopping lists** – e.g. "Weekly basics", "Travel essentials", "Dinner for 4", "Healthy week". Holmes suggests these when inference matches.
3. **Product pairings** (`holmes_insights`) – "Goes with X", time-of-day, mission-based.

These are **raw materials**. Holmes decides *when* and *what* to show based on intent.

---

## UI Architecture

| Layer | Role |
|-------|------|
| **Command surface** | Zero-state entry. Search + quick actions. Quick actions are **Holmes-influenced** when inference exists. |
| **Mission entry points** | Cook dinner, Quick snacks, etc. **Cold start:** sensible defaults. **Holmes active:** missions reflect inferred intent (e.g. "Travel prep", "Last-minute gifts"). |
| **Adaptive feed** | Sections from `home-personalization`. Holmes orders and filters based on mission. Trust signals ("Because it's 6pm", "Based on your browsing") build confidence. |
| **Contextual hints** | "Planning a trip? Add travel adapter…" – HolmesContextualWell, basket bundle, etc. |

---

## Wiring (Current → Target)

### Cold start (no Holmes inference yet)

- Quick actions: time-of-day defaults (Dinner in 20 mins, Healthy options, etc.)
- Missions: generic entry points (Cook dinner, Quick snacks, Top up essentials)
- Feed: home-personalization sections (API fallback)

### Holmes active (inference ≥ confidence threshold)

- **Quick actions:** Populated by `home-personalization.quickActions` or contextual-hint API when Holmes has inferred mission.
- **Missions:** Reorder or replace with inferred missions (e.g. "Travel essentials" when travel prep detected).
- **Feed:** Same API, but Holmes has already influenced section order/content via backend.
- **Basket bundle, contextual well:** Already Holmes-driven.

---

## Implementation Checklist

- [x] **Recipes pre-filled** – Seed migration `20260319100000_seed_holmes_recipes.sql` adds paella, curry, pasta, stir-fry, salad. Holmes surfaces these when recipe mission inferred.
- [x] **Shopping list templates** – Table `holmes_shopping_list_templates` with mission_key, keywords, search_terms. Seeded: Weekly basics, Travel essentials, Dinner for 4, Healthy week. Holmes suggests when inference matches.
- [x] **Quick actions from Holmes** – `home-personalization` returns `quickActions`. Holmes-influenced when confidence >= 0.6 (travel_prep, recipe_mission, discovery). UI (CommandSurface) consumes when available.
- [x] **Missions from Holmes** – `home-personalization` returns `missions`. Holmes-influenced when confidence >= 0.6. UI (MissionEntryPoints) falls back to defaults when empty.
- [x] **Trust signals** – `home-personalization` returns `trustSignal`. "Because it's 6pm", "Based on your browsing", "Planning a trip?", etc. Kept and extended.

---

## Don't Lose Track

The command surface, missions, and feed are **expression layers**. Holmes is the **brain**.

When we add static options, they are **cold-start defaults**. As soon as Holmes has inference, it should drive what appears. The UI should feel like Holmes "figured it out" - not like the user navigated a fixed menu.
