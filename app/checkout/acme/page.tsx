"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { AcmeSession } from "aurora-starter-core";

function formatPrice(cents: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function CheckoutAcmeContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const [session, setSession] = useState<AcmeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    postal_code: "",
    country: "GB",
  });

  useEffect(() => {
    if (!sessionId || !sessionId.startsWith("acme_")) {
      setError("Invalid or missing checkout session");
      setLoading(false);
      return;
    }
    fetch(`/api/checkout/acme?session=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(new Error(j.error ?? "Failed to load")))))
      .then(setSession)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load checkout"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handlePay = useCallback(async () => {
    if (!sessionId || paying) return;
    if (
      session?.requireShipping &&
      (!shippingAddress.line1.trim() || !shippingAddress.city.trim())
    ) {
      setError("Please enter your shipping address");
      return;
    }
    setPaying(true);
    setError(null);
    try {
      const shipping =
        session?.requireShipping && shippingAddress.line1
          ? shippingAddress
          : undefined;
      const res = await fetch("/api/checkout/acme/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, shippingAddress: shipping }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Payment failed");
      }
      const result = (await res.json()) as { redirectUrl?: string };
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        window.location.href = session?.success_url ?? "/checkout/success";
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setPaying(false);
    }
  }, [sessionId, session?.success_url, session?.requireShipping, shippingAddress, paying]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-16 px-6 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-aurora-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-aurora-muted">Loading checkout…</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center">
        <p className="text-red-400 mb-6">{error}</p>
        <Link
          href="/cart"
          className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-aurora-border bg-aurora-surface text-aurora-text font-semibold hover:bg-aurora-surface-hover transition-colors"
        >
          Back to cart
        </Link>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <div className="rounded-component bg-aurora-surface border border-aurora-border p-6">
        <h1 className="text-xl font-semibold mb-2">ACME Payment</h1>
        <p className="text-sm text-aurora-muted mb-6">
          Test payment provider - no real card required. Click Pay to simulate
          a successful checkout.
        </p>

        <div className="space-y-3 mb-6">
          {session.line_items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {item.name ?? "Item"} × {item.quantity ?? 1}
              </span>
              <span className="text-aurora-muted">
                {formatPrice(
                  (item.unitAmount ?? 0) * (item.quantity ?? 1),
                  session.currency
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between font-semibold text-lg mb-6 pt-3 border-t border-aurora-border">
          <span>Total</span>
          <span className="text-aurora-accent">
            {formatPrice(Math.round(session.total * 100), session.currency)}
          </span>
        </div>

        {session.requireShipping && (
          <div className="mb-6 p-4 rounded-component bg-aurora-bg border border-aurora-border space-y-2">
            <span className="text-sm font-medium block">Delivery address</span>
            <input
              type="text"
              placeholder="Address line 1 *"
              value={shippingAddress.line1}
              onChange={(e) =>
                setShippingAddress((s) => ({ ...s, line1: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-component bg-aurora-surface border border-aurora-border text-aurora-text placeholder:text-aurora-muted text-sm"
            />
            <input
              type="text"
              placeholder="City *"
              value={shippingAddress.city}
              onChange={(e) =>
                setShippingAddress((s) => ({ ...s, city: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-component bg-aurora-surface border border-aurora-border text-aurora-text placeholder:text-aurora-muted text-sm"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-component bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href={session.cancel_url || "/cart"}
            className="flex-1 inline-flex items-center justify-center h-12 px-4 rounded-xl border border-aurora-border bg-aurora-surface text-aurora-text font-semibold hover:bg-aurora-surface-hover transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handlePay}
            disabled={paying}
            className="flex-1 h-12 px-4 rounded-xl bg-aurora-primary text-white font-semibold hover:bg-aurora-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {paying ? "Processing…" : "Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutAcmePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-16 px-6 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-aurora-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-aurora-muted">Loading…</p>
        </div>
      }
    >
      <CheckoutAcmeContent />
    </Suspense>
  );
}
