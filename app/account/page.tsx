"use client";

import Link from "next/link";
import { User, Package, MapPin, CreditCard, LogOut } from "lucide-react";
import { useAuth } from "@aurora-studio/starter-core";

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-2xl font-bold mb-8">My Account</h1>
      <div className="grid md:grid-cols-4 gap-8">
        <aside className="space-y-2">
          <Link
            href="/account"
            className="flex items-center gap-3 px-4 py-3 rounded-component bg-aurora-accent/20 text-aurora-accent font-medium"
          >
            <User className="w-5 h-5 shrink-0" /> Profile
          </Link>
          <Link
            href="/account/orders"
            className="flex items-center gap-3 px-4 py-3 rounded-component text-aurora-muted hover:text-aurora-bg hover:bg-aurora-accent"
          >
            <Package className="w-5 h-5 shrink-0" /> Orders
          </Link>
          <Link
            href="/account/addresses"
            className="flex items-center gap-3 px-4 py-3 rounded-component text-aurora-muted hover:text-aurora-bg hover:bg-aurora-accent"
          >
            <MapPin className="w-5 h-5 shrink-0" /> Addresses
          </Link>
          <Link
            href="/account/payment-methods"
            className="flex items-center gap-3 px-4 py-3 rounded-component text-aurora-muted hover:text-aurora-bg hover:bg-aurora-accent"
          >
            <CreditCard className="w-5 h-5 shrink-0" /> Payment Methods
          </Link>
          {user && (
            <button
              type="button"
              onClick={() => signOut()}
              className="flex items-center gap-3 px-4 py-3 rounded-component text-red-400 hover:bg-aurora-surface w-full text-left"
            >
              <LogOut className="w-5 h-5 shrink-0" /> Sign Out
            </button>
          )}
        </aside>
        <main className="md:col-span-3">
          <div className="p-6 rounded-component bg-aurora-surface border border-aurora-border">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>
            {loading ? (
              <p className="text-aurora-muted">Loading…</p>
            ) : user ? (
              <>
                <p className="text-aurora-muted mb-4">
                  Signed in as <strong className="text-white">{user.email ?? user.id}</strong>. Your orders and saved addresses are available from the menu.
                </p>
                <p className="text-aurora-muted text-sm">
                  Account and checkout are powered by Aurora (app user auth). Studio users (vendor portal, workspace members) are managed separately in Aurora Studio.
                </p>
              </>
            ) : (
              <>
                <p className="text-aurora-muted mb-4">
                  Sign in to see your profile, orders, and saved addresses. You can browse and checkout as a guest.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/auth/login?returnTo=/account"
                    className="px-4 py-2 rounded-component bg-aurora-accent text-aurora-bg font-medium hover:opacity-90"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/login?register=1&returnTo=/account"
                    className="px-4 py-2 rounded-component border border-aurora-border hover:bg-aurora-accent hover:text-aurora-bg font-medium"
                  >
                    Create account
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
