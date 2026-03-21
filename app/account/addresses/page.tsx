"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@aurora-studio/starter-core";

interface MeResponse {
  tenantId?: string;
  user?: { id: string };
  addresses?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export default function AddressesPage() {
  const { user, loading: authLoading } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setMe(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/me?userId=${encodeURIComponent(user.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setMe(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const addresses = (me?.addresses ?? []) as Array<Record<string, unknown>>;

  if (authLoading || (user && loading)) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
        <h1 className="text-2xl font-bold mb-2">Your Addresses</h1>
        <p className="text-aurora-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
        <h1 className="text-2xl font-bold mb-2">Your Addresses</h1>
        <p className="text-aurora-muted mb-6">Sign in to view and manage your delivery addresses.</p>
        <Link
          href="/auth/login?returnTo=/account/addresses"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-component bg-aurora-accent text-aurora-bg font-medium hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-2xl font-bold mb-2">Your Addresses</h1>
      <p className="text-aurora-muted mb-6">
        Manage your delivery addresses. Addresses from your tenant (e.g. saved at checkout) appear here when linked to your account.
      </p>
      <div className="flex justify-end mb-6">
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-component bg-aurora-accent text-aurora-bg font-medium hover:opacity-90"
        >
          <span>+</span> Add Address
        </button>
      </div>
      <div className="space-y-4">
        {addresses.length === 0 ? (
          <p className="text-aurora-muted py-8 text-center rounded-component bg-aurora-surface border border-aurora-border">
            You haven&apos;t added any addresses yet. Add one at checkout or here once the tenant supports address creation.
          </p>
        ) : (
          addresses.map((addr, i) => (
            <div
              key={i}
              className="p-4 rounded-component bg-aurora-surface border border-aurora-border"
            >
              <pre className="text-sm text-aurora-muted whitespace-pre-wrap font-sans">
                {JSON.stringify(addr, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
