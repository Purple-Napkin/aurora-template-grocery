"use client";

import { useState } from "react";

export function ProductDetailTabs({ record }: { record: Record<string, unknown> }) {
  const [active, setActive] = useState<"details" | "nutrition" | "feedback">("details");

  const features = record.features;
  const featuresList = Array.isArray(features)
    ? features
    : typeof features === "string"
      ? (() => {
          try {
            const p = JSON.parse(features);
            return Array.isArray(p) ? p : [];
          } catch {
            return [];
          }
        })()
      : [];

  const storageInstructions = record.storage_instructions as string | undefined;

  const tabs = [
    { id: "details" as const, label: "Product Details" },
    { id: "nutrition" as const, label: "Nutrition Facts" },
    { id: "feedback" as const, label: "Customer Feedback" },
  ];

  return (
    <div>
      <div className="flex gap-4 border-b border-aurora-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`py-3 font-medium border-b-2 transition-colors -mb-[2px] ${
              active === t.id
                ? "border-aurora-accent text-aurora-accent"
                : "border-transparent text-aurora-muted hover:text-aurora-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="py-6">
        {active === "details" && (
          <div className="space-y-4">
            <p className="text-aurora-muted">
              {String(record.description ?? record.name ?? "")} - High quality product.
            </p>
            {featuresList.length > 0 && (
              <ul className="list-disc list-inside space-y-1">
                {featuresList.map((f: unknown, i: number) => (
                  <li key={i}>{String(f)}</li>
                ))}
              </ul>
            )}
            {storageInstructions && (
              <div>
                <h4 className="font-semibold mb-2">Storage Instructions</h4>
                <p className="text-aurora-muted text-sm">{storageInstructions}</p>
              </div>
            )}
          </div>
        )}
        {active === "nutrition" && (
          <p className="text-aurora-muted">
            Nutrition information will be displayed here when available.
          </p>
        )}
        {active === "feedback" && (
          <p className="text-aurora-muted">
            Customer reviews will be displayed here when available.
          </p>
        )}
      </div>
    </div>
  );
}
