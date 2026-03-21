import { StoreContextBar } from "aurora-starter-core";
import { HeroCommandSurface } from "@/components/HeroCommandSurface";
import { HolmesContextualWell } from "@/components/HolmesContextualWell";
import { MissionEntryPoints } from "@/components/MissionEntryPoints";
import { ShoppingListTemplates } from "@/components/ShoppingListTemplates";
import { HolmesHomeRefresher } from "aurora-starter-core";
import { HomeSections } from "@/components/HomeSections";
import { SmartCartPanel } from "aurora-starter-core";
import { LiveSignalsRow } from "@/components/LiveSignalsRow";
import {
  MissionAwareHero,
  MissionAwareSections,
} from "@/components/MissionAwareHome";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <HolmesHomeRefresher />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <StoreContextBar />
        </div>

        {/* Hero + command surface - actionable intent capture with real retail warmth (z-10 so dropdown overlays Mission section) */}
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] z-10">
          <MissionAwareHero>
            <HeroCommandSurface />
          </MissionAwareHero>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-0">
          <HolmesContextualWell />

          {/* Holmes injects "Complete your [Recipe]" when recipe mission + cart has items */}
          <div data-holmes="basket-bundle" className="min-h-[1px] mb-4" />

          {/* Mission-based entry points - Holmes-influenced when inference exists */}
          <MissionEntryPoints />

          {/* Shopping list templates - e.g. Travel essentials when travel prep detected */}
          <ShoppingListTemplates />

          {/* Live adapting signals - perceived intelligence */}
          <LiveSignalsRow />

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
