import { ForYouClientContent } from "@/components/ForYouClientContent";
import { ForYouSections } from "@/components/ForYouSections";
import { StoreContentRails } from "@/components/StoreContentRails";

export const dynamic = "force-dynamic";

/**
 * For You – bundles, recipes, suggestions assembled for the user.
 * Server component so ForYouSections (async) can run; client parts in ForYouClientContent.
 */
export default function ForYouPage() {
  return (
    <ForYouClientContent
      belowTitle={
        <StoreContentRails
          contentPage="for_you"
          contentRegion="for_you_below_header"
          className="mt-4"
        />
      }
      sections={<ForYouSections />}
    />
  );
}
