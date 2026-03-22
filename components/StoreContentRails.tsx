import { getHomePersonalization, getStoreConfig } from "@aurora-studio/starter-core";
import { getDietaryFromCookie } from "@/lib/dietary-server";
import { GroupedStoreContentSections } from "./storeContentBlocksUi";

const SYMBOLS: Record<string, string> = {
  gbp: "£",
  usd: "$",
  eur: "€",
  aud: "A$",
};

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
  const excludeDietary = await getDietaryFromCookie();
  const dietaryOpts = excludeDietary.length ? { excludeDietary } : undefined;
  const cat = categorySlug != null ? String(categorySlug).trim() : "";
  const [data, config] = await Promise.all([
    getHomePersonalization(undefined, {
      ...dietaryOpts,
      contentPage,
      contentRegion,
      ...(cat ? { categorySlug: cat } : {}),
    }),
    getStoreConfig(),
  ]);

  const sections = data?.sections ?? [];
  if (sections.length === 0) return null;

  const currency = ((config as { currency?: string })?.currency ?? "gbp").toLowerCase();
  const symbol = SYMBOLS[currency] ?? "£";

  return (
    <GroupedStoreContentSections
      sections={sections}
      symbol={symbol}
      recipesWithProducts={[]}
      withHolmesMarkers={withHolmesMarkers}
      className={className}
    />
  );
}
