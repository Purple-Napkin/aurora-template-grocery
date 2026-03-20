"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { CartLink } from "./CartLink";
import { SearchDropdown } from "./SearchDropdown";
import { useStore } from "./StoreContext";
import { useAuth } from "./AuthProvider";

export function Nav() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Hippo Ecom";
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL ?? "https://vnawbscpsiwkqniibyya.supabase.co/storage/v1/object/public/placeholders/hippo-ecom.png";
  const { location, store } = useStore();
  const { user, loading } = useAuth();

  const locationDisplay = location?.address ?? store?.name ?? "Select location";

  return (
    <nav className="sticky top-0 z-[100] border-b border-aurora-border shadow-sm supports-[backdrop-filter]:bg-aurora-surface/90 supports-[backdrop-filter]:backdrop-blur-md bg-aurora-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 h-14">
          <div className="flex items-center gap-6 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-component p-1 -m-1 ring-2 ring-transparent hover:ring-aurora-primary/30 focus:ring-aurora-primary/50 focus:outline-none transition-all"
              aria-label={`${siteName} home`}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-12 w-auto object-contain min-h-[2.5rem]"
                />
              ) : (
                <span className="text-xl font-bold">{siteName}</span>
              )}
            </Link>
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-aurora-muted hover:text-aurora-text transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                href="/catalogue"
                className="text-sm text-aurora-muted hover:text-aurora-text transition-colors font-medium"
              >
                All Categories
              </Link>
              <Link
                href="/for-you"
                className="text-sm text-aurora-muted hover:text-aurora-text transition-colors font-medium"
              >
                For You
              </Link>
              <Link
                href="/about"
                className="text-sm text-aurora-muted hover:text-aurora-text transition-colors font-medium"
              >
                About
              </Link>
            </div>
          </div>

          <div className="hidden md:flex flex-1 justify-center min-w-0 max-w-sm mx-4">
            {store ? (
              <SearchDropdown
                placeholder={`Search products in ${store.name}…`}
                vendorId={store.id}
              />
            ) : (
              <Link href="/stores" className="block cursor-pointer">
                <span className="pointer-events-none block">
                  <SearchDropdown
                    placeholder="Select a store to search products…"
                    vendorId={undefined}
                  />
                </span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link
              href={store ? "/stores" : "/location"}
              className="flex items-center gap-2 text-sm text-aurora-muted hover:text-aurora-text transition-colors min-w-0 max-w-[140px]"
              title={locationDisplay}
            >
              <MapPin className="w-4 h-4 shrink-0 text-aurora-primary/70" />
              <span className="truncate">{locationDisplay}</span>
            </Link>
            <div className="px-3 py-1.5 -mx-1 rounded-lg">
              <CartLink />
            </div>
            <Link
              href="/account"
              className="flex items-center gap-2 text-aurora-muted hover:text-aurora-text p-2 rounded-component hover:bg-aurora-surface-hover min-w-0"
              aria-label="Account"
              title={user ? user.email ?? "Account" : "Sign in"}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {!loading && user?.email && (
                <span className="hidden sm:block truncate max-w-[120px]">{user.email}</span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
