import {
  AuroraClient,
  type SearchParams,
  type SearchResult,
  type SearchHit,
  type DeliverySlot,
  type StoreItem,
  type CheckoutLineItem,
  type CreateCheckoutSessionParams,
  type CheckoutSessionResult,
  type AcmeSession,
  type HolmesInferResult,
  type HolmesRecipe,
  type HolmesTidbit,
  type HolmesContextualHintResult,
  type HomePersonalizationResult,
} from "@aurora-studio/sdk";

const baseUrl =
  process.env.AURORA_API_URL ??
  process.env.NEXT_PUBLIC_AURORA_API_URL ??
  "";
const apiKey =
  process.env.AURORA_API_KEY ??
  process.env.NEXT_PUBLIC_AURORA_API_KEY ??
  "";
const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG ?? "";

/** Optional spec URL so the SDK can adjust from the tenant OpenAPI spec (default: baseUrl + /v1/openapi.json) */
const specUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/v1/openapi.json` : undefined;

export function createAuroraClient(): AuroraClient {
  if (!baseUrl || baseUrl.startsWith("/")) {
    throw new Error(
      "Aurora API URL is not configured. Set AURORA_API_URL (or NEXT_PUBLIC_AURORA_API_URL) to your Aurora API root (e.g. https://api.youraurora.com)."
    );
  }
  return new AuroraClient({ baseUrl, apiKey, specUrl });
}

export function getApiBase(): string {
  return baseUrl.replace(/\/$/, "");
}

export function getTenantSlug(): string {
  return tenantSlug;
}

/** Store config - safe for client: fetches via /api/store/config (keeps API key server-side). */
export async function getStoreConfig(): Promise<{
  enabled: boolean;
  catalogTableSlug?: string;
  categoryTableSlug?: string;
  currency?: string;
  [key: string]: unknown;
} | null> {
  if (typeof window !== "undefined") {
    const res = await fetch("/api/store/config");
    if (!res.ok) return null;
    return res.json();
  }
  const client = createAuroraClient();
  return client.store.config();
}

// Re-export types for consumers
export type { SearchParams, SearchResult, SearchHit, DeliverySlot, StoreItem };
export type {
  CheckoutLineItem,
  CreateCheckoutSessionParams,
  CheckoutSessionResult,
  AcmeSession,
  HolmesInferResult,
  HolmesRecipe,
  HolmesTidbit,
  HolmesContextualHintResult,
  HomePersonalizationResult,
};

/** Exclude offers from search — offers are checkout-only discounts, not products. */
function excludeOffersFromSearch<T extends { hits?: unknown[] }>(result: T): T {
  const hits = result.hits ?? [];
  const filtered = hits.filter(
    (h) => (h as Record<string, unknown>).tableSlug !== "offers"
  ) as SearchResult["hits"];
  return { ...result, hits: filtered } as T;
}

/** Meilisearch-powered product search. Uses API route from client (keeps API key server-side). */
export async function search(params: SearchParams): Promise<SearchResult> {
  let result: SearchResult;
  if (typeof window !== "undefined") {
    const qs = new URLSearchParams();
    if (params.q != null && params.q !== "") qs.set("q", params.q);
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.offset != null) qs.set("offset", String(params.offset));
    if (params.vendorId) qs.set("vendorId", params.vendorId);
    if (params.category) qs.set("category", params.category);
    if (params.sort) qs.set("sort", params.sort);
    if (params.order) qs.set("order", params.order);
    const res = await fetch(`/api/search?${qs.toString()}`);
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? "Search failed");
    }
    result = (await res.json()) as SearchResult;
  } else {
    const client = createAuroraClient();
    result = await client.site.search(params);
  }
  return excludeOffersFromSearch(result);
}

/** Fetch delivery slots for a location */
export async function getDeliverySlots(lat: number, lng: number): Promise<{ data: DeliverySlot[] }> {
  const client = createAuroraClient();
  return client.store.deliverySlots(lat, lng);
}

/** List stores/vendors */
export async function getStores(): Promise<{ data: StoreItem[] }> {
  const client = createAuroraClient();
  return client.site.stores();
}

/** Create checkout session (Stripe or ACME) */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  const client = createAuroraClient();
  return client.store.checkout.sessions.create(params);
}

/** Fetch ACME checkout session */
export async function getAcmeSession(sessionId: string): Promise<AcmeSession> {
  const client = createAuroraClient();
  return client.store.checkout.acme.get(sessionId);
}

/** Complete ACME checkout */
export async function completeAcmeCheckout(
  sessionId: string,
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  }
): Promise<{ success: boolean; redirectUrl?: string }> {
  const client = createAuroraClient();
  return client.store.checkout.acme.complete(sessionId, shippingAddress);
}

/** Holmes mission inference */
export async function holmesInfer(sessionId: string): Promise<HolmesInferResult> {
  const client = createAuroraClient();
  return client.holmes.infer(sessionId);
}

/** Holmes insights: products for a recipe (paella, curry, pasta). Uses holmes_insights.recipe_ideas. */
export async function holmesRecipeProducts(
  recipe: string,
  limit = 12
): Promise<{ products: SearchHit[]; total: number; recipe: string }> {
  if (typeof window !== "undefined") {
    const qs = new URLSearchParams({ recipe, limit: String(limit) });
    const res = await fetch(`/api/holmes/recipe-products?${qs.toString()}`);
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? "Recipe products failed");
    }
    return res.json();
  }
  const client = createAuroraClient();
  return client.store.holmesRecipeProducts(recipe, limit);
}

/** Holmes cached recipe. Fetches via AI on cache miss. */
export async function holmesRecipe(slug: string): Promise<HolmesRecipe | null> {
  if (typeof window !== "undefined") {
    const res = await fetch(`/api/holmes/recipe/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    return res.json();
  }
  const client = createAuroraClient();
  return client.store.holmesRecipe(slug);
}

/** Holmes tidbits for entity (recipe, ingredient, product). */
export async function holmesTidbits(
  entity: string,
  entityType = "recipe"
): Promise<{ tidbits: HolmesTidbit[] }> {
  if (typeof window !== "undefined") {
    const qs = new URLSearchParams({ entity, entity_type: entityType });
    const res = await fetch(`/api/holmes/tidbits?${qs.toString()}`);
    if (!res.ok) return { tidbits: [] };
    return res.json();
  }
  const client = createAuroraClient();
  return client.store.holmesTidbits(entity, entityType);
}

/** Holmes insights: products that go well with a given product. Uses holmes_insights.goes_well_with. */
export async function holmesGoesWith(
  productId: string,
  limit = 8
): Promise<{ products: SearchHit[]; total: number }> {
  if (typeof window !== "undefined") {
    const qs = new URLSearchParams({ product_id: productId, limit: String(limit) });
    const res = await fetch(`/api/holmes/goes-with?${qs.toString()}`);
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? "Goes-with failed");
    }
    return res.json();
  }
  const client = createAuroraClient();
  return client.store.holmesGoesWith(productId, limit);
}

/** Home personalization - sections for SSR fallback. sid optional (omit for default sections). */
export async function getHomePersonalization(sid?: string): Promise<HomePersonalizationResult | null> {
  try {
    const client = createAuroraClient();
    const result = await client.store.homePersonalization(sid ?? "", undefined);
    return result;
  } catch {
    return null;
  }
}

// Holmes offers & chat: available in SDK 0.2.7+ via client.holmes.offers(), client.holmes.chat.send(), client.holmes.chat.list()

/** Current user metadata and related data (e.g. addresses) when userId is provided. Uses GET /me from tenant spec. */
export async function getMe(userId?: string): Promise<{
  tenantId: string;
  user?: { id: string };
  addresses?: unknown[];
  [key: string]: unknown;
}> {
  const client = createAuroraClient();
  return client.me({ userId });
}
