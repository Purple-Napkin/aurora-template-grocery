"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import {
  CartLink,
  SearchDropdown,
  mergeTemplateLogoMask,
  useStore,
  useAuth,
  useVerticalProfile,
} from "@aurora-studio/starter-core";
import { DietaryNeedsDropdown } from "./DietaryNeedsDropdown";
import { useDietaryExclusions } from "./DietaryExclusionsContext";
import { getRecipeSuggestion } from "@/lib/cart-intelligence";

export function Nav() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Example Grocery";
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL ?? "/template-logo.png";
  const { location, store } = useStore();
  const { user, loading } = useAuth();
  const { excludeDietary } = useDietaryExclusions();
  const { dietaryFilteringEnabled } = useVerticalProfile();
  const excludeForSearch = dietaryFilteringEnabled ? excludeDietary : [];

  const locationDisplay = location?.address ?? store?.name ?? "Select location";

  return (
    <nav className="sticky top-0 z-[200] border-b border-aurora-border/45 shadow-[0_1px_0_rgba(255,255,255,0.65)] dark:shadow-none supports-[backdrop-filter]:bg-aurora-surface/78 supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150 bg-aurora-surface/92 transition-colors duration-luxury">
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
                  className={mergeTemplateLogoMask(
                    logoUrl,
                    "h-12 w-auto object-contain min-h-[2.5rem]"
                  )}
                />
              ) : (
                <span className="text-xl font-bold">{siteName}</span>
              )}
            </Link>
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-aurora-muted hover:text-aurora-text transition-[color,opacity] duration-luxury ease-concierge font-medium"
              >
                Home
              </Link>
              <Link
                href="/catalogue"
                className="text-sm text-aurora-muted hover:text-aurora-text transition-[color,opacity] duration-luxury ease-concierge font-medium"
              >
                All Categories
              </Link>
              <Link
                href="/for-you"
                className="text-sm text-aurora-muted hover:text-aurora-text transition-[color,opacity] duration-luxury ease-concierge font-medium"
              >
                For You
              </Link>
              <Link
                href="/about"
                className="text-sm text-aurora-muted hover:text-aurora-text transition-[color,opacity] duration-luxury ease-concierge font-medium"
              >
                About
              </Link>
            </div>
          </div>

          <div
            className="relative z-50 hidden md:flex flex-1 justify-center min-w-0 max-w-md mx-5"
            data-grocery-search="nav"
          >
            {store ? (
              <SearchDropdown
                placeholder="Search milk, pasta, dinner…"
                vendorId={store.id}
                excludeDietary={excludeForSearch}
                getRecipeSuggestion={getRecipeSuggestion}
                getComboHref={(slug) => `/recipes/${encodeURIComponent(slug)}`}
              />
            ) : (
              <Link href="/stores" className="block cursor-pointer">
                <span className="pointer-events-none block">
                  <SearchDropdown
                    placeholder="Select a store to search…"
                    vendorId={undefined}
                    excludeDietary={excludeForSearch}
                    getRecipeSuggestion={getRecipeSuggestion}
                    getComboHref={(slug) => `/recipes/${encodeURIComponent(slug)}`}
                  />
                </span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link
              href={store ? "/stores" : "/location"}
              className="flex items-center gap-2 text-sm text-aurora-muted hover:text-aurora-text transition-[color] duration-luxury ease-concierge min-w-0 max-w-[140px]"
              title={locationDisplay}
            >
              <MapPin className="w-4 h-4 shrink-0 text-aurora-primary/70" />
              <span className="truncate">{locationDisplay}</span>
            </Link>
            {dietaryFilteringEnabled ? <DietaryNeedsDropdown /> : null}
            <div className="px-3 py-1.5 -mx-1 rounded-lg">
              <CartLink />
            </div>
            <Link
              href="/account"
              className="flex items-center gap-2 text-aurora-muted hover:text-aurora-text p-2 rounded-xl hover:bg-aurora-surface-hover/80 min-w-0 transition-[color,background-color] duration-luxury ease-concierge"
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
