"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { useAuth } from "@aurora-studio/starter-core";

export default function PaymentMethodsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
        <h1 className="text-2xl font-bold mb-6">Payment Methods</h1>
        <p className="text-aurora-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
        <h1 className="text-2xl font-bold mb-6">Payment Methods</h1>
        <p className="text-aurora-muted mb-6">Sign in to manage your payment methods.</p>
        <Link
          href="/auth/login?returnTo=/account/payment-methods"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-component bg-aurora-accent text-aurora-bg font-medium hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-2xl font-bold mb-6">Payment Methods</h1>
      <div className="p-6 rounded-xl bg-aurora-surface border border-aurora-border">
        <div className="flex items-start gap-4">
          <CreditCard className="w-10 h-10 text-aurora-muted shrink-0" />
          <div>
            <h2 className="font-semibold mb-2">Payment at checkout</h2>
            <p className="text-aurora-muted text-sm mb-4">
              This store uses secure payment at checkout. When Stripe is configured, you can save
              cards for faster checkout. With the test ACME provider, payment methods are not stored.
            </p>
            <p className="text-aurora-muted text-sm">
              To add a payment method, complete a purchase at checkout. Your card details are
              never stored on our servers when using Stripe - they are handled securely by Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
