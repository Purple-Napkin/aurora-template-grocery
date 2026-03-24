import { getHomePersonalization } from "@aurora-studio/starter-core";
import { getDietaryFromCookie } from "@/lib/dietary-server";
import { GroupedStoreContentSections } from "./storeContentBlocksUi";
import { YouMayAlsoLike } from "./YouMayAlsoLike";

/**
 * PDP below-the-fold: parallel home-personalization for both CMS regions + recommendations.
 * Render inside React Suspense so the main product shell can stream first.
 */
export async function PdpBelowFold({
  productId,
  catalogTableSlug,
  categoryId,
  currencyCode,
}: {
  productId: string;
  catalogTableSlug: string;
  categoryId?: string | null;
  currencyCode: string;
}) {
  const excludeDietary = await getDietaryFromCookie();
  const dietaryOpts = excludeDietary.length ? { excludeDietary } : undefined;

  const [tabsData, ctxData] = await Promise.all([
    getHomePersonalization(undefined, {
      ...dietaryOpts,
      contentPage: "product_detail",
      contentRegion: "pdp_below_tabs",
    }),
    getHomePersonalization(undefined, {
      ...dietaryOpts,
      contentPage: "product_detail",
      contentRegion: "pdp_below_context",
    }),
  ]);

  const tabsSections = tabsData?.sections ?? [];
  const ctxSections = ctxData?.sections ?? [];

  return (
    <>
      {tabsSections.length > 0 ? (
        <div className="mt-10 space-y-10">
          <GroupedStoreContentSections
            sections={tabsSections}
            currency={currencyCode}
            recipesWithProducts={[]}
            withHolmesMarkers={false}
          />
        </div>
      ) : null}
      {ctxSections.length > 0 ? (
        <div className="mt-10 space-y-10">
          <GroupedStoreContentSections
            sections={ctxSections}
            currency={currencyCode}
            recipesWithProducts={[]}
            withHolmesMarkers={false}
          />
        </div>
      ) : null}
      <div className="mt-12">
        <YouMayAlsoLike
          productId={productId}
          catalogTableSlug={catalogTableSlug}
          categoryId={categoryId}
          currencyCode={currencyCode}
        />
      </div>
    </>
  );
}
