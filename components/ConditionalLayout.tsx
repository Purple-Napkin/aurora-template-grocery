"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Nav } from "./Nav";
import { ActiveMissionBar } from "./ActiveMissionBar";
import { Footer } from "./Footer";
import { FooterTip } from "./FooterTip";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Nav />
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
