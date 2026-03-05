"use client";

import Link from "next/link";
import { Zap, Search, ShoppingCart, Eye, ChevronRight } from "lucide-react";

const SCENARIOS = [
  {
    id: "urgent_replenishment",
    title: "Urgent Replenishment",
    tagline: "In a rush — fast checkout",
    description:
      "Simulate a hurried shopper: add an item to cart and go straight to checkout. Holmes hides delivery extras, promo codes, and cross-sell to compress the flow.",
    steps: [
      "Add any product to cart",
      "Go to checkout",
      "Observe: checkout-extras, cross-sell, and promo fields are hidden",
      "Payment step is highlighted for focus",
    ],
    link: "/catalogue?holmes_demo=urgent_replenishment",
    cta: "Try urgent scenario",
    icon: Zap,
  },
  {
    id: "browsing",
    title: "Browsing",
    tagline: "Explore & discover",
    description:
      "Simulate a relaxed browser: view several products, scroll slowly. Holmes expands recommendations and discovery sections instead of compressing.",
    steps: [
      "Browse the catalogue, view 3–4 products",
      "Scroll through the product page",
      "Observe: recommendations expanded, no hidden sections",
      "See the 'You May Also Like' section with Holmes picks",
    ],
    link: "/catalogue?holmes_demo=browsing",
    cta: "Try browsing scenario",
    icon: Eye,
  },
  {
    id: "ready_to_pay",
    title: "Ready to Pay",
    tagline: "Cart full — payment focus",
    description:
      "Cart has items and you're at the payment step. Holmes highlights the payment section and hides non-essential checkout friction.",
    steps: [
      "Add items to cart",
      "Proceed to checkout (step 3)",
      "Observe: payment area is highlighted",
      "Checkout extras are hidden",
    ],
    link: "/checkout?holmes_demo=ready_to_pay",
    cta: "Try ready-to-pay (add to cart first)",
    icon: ShoppingCart,
  },
  {
    id: "discovery",
    title: "Discovery",
    tagline: "Search-driven exploration",
    description:
      "Search for something. Holmes infers you're exploring and surfaces new arrivals and impulse buys in recommendations.",
    steps: [
      "Use the search bar to find a product",
      "View a few search results",
      "Observe: discovery/expand_discovery directives",
      "Recommendations favor new arrivals",
    ],
    link: "/catalogue?holmes_demo=discovery",
    cta: "Try discovery scenario",
    icon: Search,
  },
] as const;

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-aurora-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-16">
          <Link
            href="/"
            className="text-aurora-accent hover:underline text-sm font-medium mb-6 inline-block"
          >
            ← Back to store
          </Link>
          <h1
            className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4"
            data-testid="demo-page-title"
          >
            Holmes Demo Scenarios
          </h1>
          <p className="text-aurora-muted text-lg max-w-2xl">
            Deterministic flows for verification and demos. Each link appends{" "}
            <code className="px-1.5 py-0.5 rounded bg-aurora-surface text-aurora-accent text-sm">
              ?holmes_demo=mission
            </code>{" "}
            so Holmes returns the matching mission&apos;s directives and bundle.
          </p>
        </div>

        <div className="space-y-8">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <div
                key={scenario.id}
                className="rounded-2xl border border-aurora-border bg-aurora-surface/40 backdrop-blur-sm p-6 sm:p-8 shadow-xl hover:border-aurora-accent/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-aurora-accent/20 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-aurora-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-xl font-bold text-white mb-1">
                      {scenario.title}
                    </h2>
                    <p className="text-aurora-accent font-medium text-sm mb-3">
                      {scenario.tagline}
                    </p>
                    <p className="text-aurora-muted mb-4">{scenario.description}</p>
                    <ul className="space-y-1.5 mb-6">
                      {scenario.steps.map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-aurora-muted"
                        >
                          <span className="text-aurora-accent font-mono text-xs mt-0.5">
                            {i + 1}.
                          </span>
                          {step}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={scenario.link}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurora-accent text-aurora-bg font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      {scenario.cta}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 p-6 rounded-2xl border border-aurora-accent/20 bg-aurora-accent/5">
          <h3 className="font-semibold text-aurora-accent mb-2">
            Control Dashboard
          </h3>
          <p className="text-sm text-aurora-muted">
            Open Holmes Control in Aurora Studio to see live inferences, mission
            distribution, and signal logs. Each demo scenario will appear in the
            stream with the forced mission.
          </p>
          <p className="text-xs text-aurora-muted mt-2">
            Mission keys: <code>urgent_replenishment</code>,{" "}
            <code>browsing</code>, <code>ready_to_pay</code>,{" "}
            <code>routine_shop</code>, <code>discovery</code>
          </p>
        </div>
      </div>
    </div>
  );
}
