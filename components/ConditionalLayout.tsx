"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { StoreContextBar } from "@aurora-studio/starter-core";
import { Nav } from "./Nav";
import { ActiveMissionBar } from "./ActiveMissionBar";
import { IntentPresenceBar } from "./intent/IntentPresenceBar";
import { Footer } from "./Footer";
import { FooterTip } from "./FooterTip";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Nav />
      <Suspense fallback={null}>
        <IntentPresenceBar />
      </Suspense>
      {/* Persistent store strip (was only on home/offers — restores “Shopping from…” under nav everywhere) */}
      <StoreContextBar />
      <Suspense fallback={null}>
        <ActiveMissionBar />
      </Suspense>
      <main className="min-h-[calc(100vh-3.5rem)] flex flex-col">
        <div key={pathname} className="animate-page-enter">
          {children}
        </div>
        <FooterTip />
        <Footer />
      </main>
    </>
  );
}
