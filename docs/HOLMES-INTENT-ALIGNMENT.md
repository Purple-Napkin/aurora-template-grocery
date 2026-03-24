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
| **Active mission bar** | Top of screen when inference ≥ 0.6. Shows label, confidence band, summary. Dismiss / Reset. Drives catalogue narrowing when `narrowCatalog` and not dismissed. |
| **Command surface** | **Missions first, search secondary.** "What are you trying to do?" + Start here chips, then "Search the store" (smaller). Quick actions Holmes-influenced when inference exists. |
| **Mission entry points** | Cook dinner, Quick snacks, etc. **Cold start:** sensible defaults. **Holmes active:** missions reflect inferred intent (e.g. "Travel essentials", "Travel prep"). |
| **Adaptive feed** | Sections from `home-personalization`. Holmes orders and filters based on mission. Trust signals ("Because it's 6pm", "Based on your browsing") build confidence. |
| **Catalogue narrowing** | When `activeMission.uiHints.narrowCatalog` and bar not dismissed: categories reordered by mission priority; "For your mission" section at top. |
| **Contextual hints** | Guardrail rules (holmes-core) + HolmesContextualWell. Micro-learning insights ("Egg noodles absorb sauce better than spaghetti"). |

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
- [x] **Active mission** – `home-personalization` returns `activeMission` (key, label, confidence, band, summary, uiHints). MissionAwareHomeProvider in layout; ActiveMissionBar below Nav.
- [x] **Command surface hierarchy** – Missions first ("Start here"), search secondary ("Search the store"). Headline: "What are you trying to do?"
- [x] **Catalogue narrowing** – When `narrowCatalog`: mission priority for categories, "For your mission" section. Respects mission bar dismiss.
- [x] **Guardrail rules** – holmes-core `guardrail-rules.ts`; 12 rules. Contextual hint API evaluates first; micro-learning insights.

---

## QA Matrix: Missions and Bands

| Scenario | sid | Mission key | Confidence | Expected UI |
|----------|-----|-------------|------------|-------------|
| Cold start | none | — | — | No mission bar. Default quick actions. Full categories. |
| Low confidence | yes | browsing | low | No mission bar (or band "low"). Default missions. |
| Travel prep (high) | yes | travel_prep | ≥ 0.75 | Mission bar: "Travel essentials", High confidence. narrowCatalog: travel categories first, "For your mission" section. |
| Recipe mission | yes | recipe_mission | 0.9 | Mission bar: "Cook dinner". Recipe hero/sections on home. narrowCatalog when high. |
| Mission bar dismissed | yes | travel_prep | high | Bar hidden. Catalogue shows full categories (no narrowing). |
| Reset mission | yes | — | — | Clears dismiss; refetches personalization. |

---

## Mission-driven vs signal-priority (planned)

**Today:** Dismissing the **active mission bar** mainly restores a **broader catalogue** (e.g. turns off aggressive narrowing). Holmes inference may still run for hints and scripts.

**Target:** Two explicit experience levels:

1. **Mission-driven (default)** when confidence is high — full mission bar, mission-first command surface, recipe/combo guidance, bundle pickers, and structural layout changes.
2. **Signal-priority (“classic Holmes”)** when the user dismisses or opts out of mission framing — **no** requirement to show named missions, but Holmes **still** uses signals to **prioritise categories and products**, surface **suggestions**, **tidbits**, **guardrails**, **offers**, **prefetch**, and **bundled/combo** surfaces.

Spec and acceptance criteria: [HOLMES-WHITEPAPER.md](../../aurora-studio/docs/HOLMES-WHITEPAPER.md) (in Aurora Studio repo).

---

## Don't Lose Track

The command surface, missions, and feed are **expression layers**. Holmes is the **brain**.

When we add static options, they are **cold-start defaults**. As soon as Holmes has inference, it should drive what appears. The UI should feel like Holmes "figured it out" - not like the user navigated a fixed menu.
