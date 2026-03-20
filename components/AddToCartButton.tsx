"use client";

import { useState } from "react";
import { Check } from "lucide-react";
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
  const { items, addItem } = useCart();
  const flyCtx = useAddToCartFly();
  const [weight, setWeight] = useState<string>("1");
  const cartId = `${tableSlug}:${recordId}`;
  const inCart = items.some((i) => i.id === cartId);

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
          disabled={inCart}
          className={
            inCart
              ? `inline-flex items-center gap-1.5 text-aurora-primary font-medium cursor-default ${className ?? ""}`.trim()
              : className ??
                "h-12 px-4 rounded-xl bg-aurora-primary text-white font-semibold hover:bg-aurora-primary-dark transition-colors"
          }
        >
          {inCart ? (
            <>
              <Check className="w-4 h-4 shrink-0" aria-hidden />
              Added
            </>
          ) : (
            "Add to cart"
          )}
        </button>
      </div>
    );
  }

  const handleAdd = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    flyCtx?.triggerFly(imageUrl ?? null, rect);
    addItem({ recordId, tableSlug, name, unitAmount, imageUrl });
  };

  const baseClass =
    className ??
    "h-12 px-4 rounded-xl bg-aurora-primary text-white font-semibold hover:bg-aurora-primary-dark transition-colors";

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={inCart}
      className={
        inCart
          ? `inline-flex items-center gap-1.5 text-aurora-primary font-medium cursor-default ${className ?? ""}`.trim()
          : baseClass
      }
    >
      {inCart ? (
        <>
          <Check className="w-4 h-4 shrink-0" aria-hidden />
          Added
        </>
      ) : (
        "Add to cart"
      )}
    </button>
  );
}
