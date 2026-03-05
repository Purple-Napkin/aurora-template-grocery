"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { useAddToCartFly } from "./AddToCartFly";

interface AddToCartButtonProps {
  recordId: string;
  tableSlug: string;
  name: string;
  unitAmount: number;
  /** Variable-weight product: show weight input, unitAmount = price_per_unit (cents) */
  sellByWeight?: boolean;
  unit?: string;
  /** Product image URL for basket display */
  imageUrl?: string | null;
  className?: string;
}

export function AddToCartButton({
  recordId,
  tableSlug,
  name,
  unitAmount,
  sellByWeight,
  unit = "kg",
  imageUrl,
  className,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const flyCtx = useAddToCartFly();
  const [weight, setWeight] = useState<string>("1");

  if (sellByWeight) {
    const handleAdd = (e: React.MouseEvent) => {
      const w = parseFloat(weight);
      if (!Number.isFinite(w) || w <= 0) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      flyCtx?.triggerFly(imageUrl ?? null, rect);
      addItem({
        recordId,
        tableSlug,
        name,
        unitAmount,
        quantity: w,
        sellByWeight: true,
        unit,
        imageUrl,
      });
    };
    return (
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-20 px-2 py-2 rounded-lg border border-aurora-border bg-aurora-surface text-aurora-text"
          />
          <span className="text-aurora-muted">{unit}</span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className={
            className ??
            "h-12 px-4 rounded-xl bg-aurora-primary text-white font-semibold hover:bg-aurora-primary-dark transition-colors"
          }
        >
          Add to cart
        </button>
      </div>
    );
  }

  const handleAdd = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    flyCtx?.triggerFly(imageUrl ?? null, rect);
    addItem({ recordId, tableSlug, name, unitAmount, imageUrl });
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={
        className ??
        "h-12 px-4 rounded-xl bg-aurora-primary text-white font-semibold hover:bg-aurora-primary-dark transition-colors"
      }
    >
      Add to cart
    </button>
  );
}
