"use client";

import { usePathname } from "next/navigation";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSimulate = pathname === "/simulate";

  if (isSimulate) {
    return <>{children}</>;
  }

  return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-3.5rem)] flex flex-col">
        <div key={pathname} className="animate-page-enter">
          {children}
        </div>
        <Footer />
      </main>
    </>
  );
}
