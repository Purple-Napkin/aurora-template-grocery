# Holmes / platform gaps (grocery intent showcase)

Non-blocking items discovered while implementing the three-band intent UX in `aurora-template-grocery`. Address in Aurora Studio, API, or SDK when ready.

## Explainability

- **Structured reasons:** `HomePersonalizationResult.activeMission` exposes `summary` (free text) but not typed or enumerated reasons (e.g. `basket_items`, `search_query`, `time_of_day`, `location_proximity`). Structured `reasons: string[]` or a small enum would let storefronts render consistent “Based on …” lines without parsing prose.

## Recipe mission escalation

- **Server-side `mode: recipe_mission`:** The storefront now gates full recipe takeover on `activeMission.band === "high"`. If the API still returns `recipe_mission` at medium/low confidence, only the UI changes; aligning API escalation with `band` would reduce confusion for other clients.

## Section mix per mode

- **Per-mode section filtering:** `sections[]` in home personalization could accept hints to suppress or deprioritise types (e.g. hide recipe-adjacent `meals` rails when `travel_prep` is high). Today the template filters some rails client-side only.

## Location and urgency

- **Signals in payload:** Location context (e.g. “near airport”), scroll velocity, or session urgency flags are not modelled on `HomePersonalizationResult`. The template uses mission keys and copy fallbacks; richer fields would power travel/hurry demos without hard-coded assumptions.

## SDK

- **Types:** `HomePersonalizationResult` in `@aurora-studio/sdk` already includes `activeMission.band`. If new fields are added (`reasons`, `locationLabel`, etc.), publish a minor SDK bump and regenerate storefront types.
