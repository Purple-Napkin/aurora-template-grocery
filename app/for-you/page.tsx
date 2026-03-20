import { ForYouClientContent } from "@/components/ForYouClientContent";
import { ForYouSections } from "@/components/ForYouSections";

/**
 * For You – bundles, recipes, suggestions assembled for the user.
 * Server component so ForYouSections (async) can run; client parts in ForYouClientContent.
 */
export default function ForYouPage() {
  return <ForYouClientContent sections={<ForYouSections />} />;
}
