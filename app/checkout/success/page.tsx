"use client";

import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Thank you for your order</h1>
      <p className="text-aurora-muted mb-8">
        Your payment was successful. You will receive a confirmation email
        shortly.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/account/orders"
          className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-aurora-primary text-white font-semibold hover:bg-aurora-primary-dark transition-colors"
        >
          View your orders
        </Link>
        <Link
          href="/catalogue"
          className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-aurora-border bg-aurora-surface text-aurora-text font-semibold hover:bg-aurora-surface-hover transition-colors"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
