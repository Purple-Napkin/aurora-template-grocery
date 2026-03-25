import { GroupedStoreContentSections } from "./storeContentBlocksUi";
import {
  getHomePersonalizationCached,
  getStoreConfigCached,
} from "@/lib/server-request-cache";

/** SSR: load `store_content_blocks` for a CMS page + region (and optional catalogue category). */
export async function StoreContentRails({
  contentPage,
  contentRegion,
  categorySlug,
  className,
  withHolmesMarkers = false,
}: {
  contentPage: string;
  contentRegion: string;
  categorySlug?: string | null;
  className?: string;
  withHolmesMarkers?: boolean;
}) {
  const cat = categorySlug != null ? String(categorySlug).trim() : "";
  const [data, config] = await Promise.all([
    getHomePersonalizationCached(contentPage, contentRegion, cat),
    getStoreConfigCached(),
  ]);

  const sections = data?.sections ?? [];
  if (sections.length === 0) return null;

  const currency = ((config as { currency?: string })?.currency ?? "gbp").toLowerCase();
  const currencyCode = currency.length >= 3 ? currency.toUpperCase() : "GBP";

  return (
    <GroupedStoreContentSections
      sections={sections}
      currency={currencyCode}
      recipesWithProducts={[]}
      withHolmesMarkers={withHolmesMarkers}
      className={className}
    />
  );
}
