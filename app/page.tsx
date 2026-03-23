import { HeroCommandSurface } from "@/components/HeroCommandSurface";
import { HolmesContextualWell } from "@/components/HolmesContextualWell";
import { MissionEntryPoints } from "@/components/MissionEntryPoints";
import { ShoppingListTemplates } from "@/components/ShoppingListTemplates";
import { HolmesHomeRefresher } from "@aurora-studio/starter-core";
import { HomeSections } from "@/components/HomeSections";
import { SmartCartPanel } from "@aurora-studio/starter-core";
import {
  MissionAwareHero,
  MissionAwareSections,
} from "@/components/MissionAwareHome";
import { IntentAssistancePanel } from "@/components/intent/IntentAssistancePanel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <>
      <HolmesHomeRefresher />

        {/* Full-bleed hero: avoid z-10 here — it stacked above the feed and swallowed clicks on basket CTAs/cards below */}
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          <MissionAwareHero>
            <HeroCommandSurface />
          </MissionAwareHero>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <IntentAssistancePanel />
          <HolmesContextualWell />

          {/* Holmes injects "Complete your [Recipe]" when recipe mission + cart has items */}
          <div data-holmes="basket-bundle" className="min-h-[1px] mb-4" />

          {/* Mission-based entry points - Holmes-influenced when inference exists */}
          <MissionEntryPoints />

          {/* Shopping list templates - e.g. Travel essentials when travel prep detected */}
          <ShoppingListTemplates />

          {/* Single adaptive feed - Holmes data via event, trust signals, merged sections */}
          <MissionAwareSections>
            <HomeSections />
          </MissionAwareSections>

          {/* Smart cart panel - bridges browsing to conversion */}
          <SmartCartPanel />
        </div>
    </>
  );
}
