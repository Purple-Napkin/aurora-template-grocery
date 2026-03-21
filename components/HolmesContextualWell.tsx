"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "aurora-starter-core";
import { useDietaryExclusions } from "@/components/DietaryExclusionsContext";
import { ProductImage } from "aurora-starter-core";

type Props = {
  /** Pass when on product detail page */
  currentProductId?: string | null;
  /** "cart" = scroll to #basket-bundle; "for-you" = on For You page, no link; "default" = link to /for-you */
  variant?: "default" | "cart" | "for-you";
};

/**
 * Holmes "paying attention" well - subtle hint based on cart and mission.
 * Renders at top of cart, PDP, or home when Holmes has something relevant.
 * Shows proactive "We have recipes" banner when Holmes has combos for the cart.
 */
export function HolmesContextualWell({ currentProductId, variant = "default" }: Props) {
  const { items } = useCart();
  const { excludeDietary } = useDietaryExclusions();
  const [hint, setHint] = useState<string | null>(null);
  const [products, setProducts] = useState<Array<{ id: string; name: string; url: string; image_url?: string }>>([]);
  const [hasCombo, setHasCombo] = useState(false);
  const [comboTitle, setComboTitle] = useState<string | null>(null);

  useEffect(() => {
    const cartNames = items.map((i) => i.name).filter(Boolean);
    const cartIds = items.map((i) => i.recordId).filter(Boolean);
    if (cartNames.length === 0 && !currentProductId) {
      setHint(null);
      setProducts([]);
      setHasCombo(false);
      setComboTitle(null);
      return;
    }
    const sid =
      typeof window !== "undefined"
        ? (window as { holmes?: { getSessionId?: () => string } }).holmes?.getSessionId?.()
        : null;
    const qs = new URLSearchParams();
    if (sid) qs.set("sid", sid);
    if (cartNames.length) qs.set("cart_names", cartNames.join(","));
    if (cartIds.length) qs.set("cart_ids", cartIds.join(","));
    if (currentProductId) qs.set("current_product", currentProductId);
    if (excludeDietary.length) qs.set("excludeDietary", excludeDietary.join(","));
    fetch(`/api/holmes/contextual-hint?${qs.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.hint) {
          setHint(data.hint);
          setProducts((data.products ?? []).slice(0, 2));
        } else {
          setHint(null);
          setProducts([]);
        }
        setHasCombo(Boolean(data?.hasCombo));
        setComboTitle(data?.comboTitle ?? null);
      })
      .catch(() => {
        setHint(null);
        setProducts([]);
        setHasCombo(false);
        setComboTitle(null);
      });
  }, [items.map((i) => `${i.recordId}:${i.name}`).join(","), currentProductId, excludeDietary]);

  // Proactive "We have suggestions" banner when combo exists but no rule-based hint
  if (hasCombo && !hint) {
    const isRecipeStyle =
      comboTitle &&
      /recipe|dinner|meal|chicken|pasta|curry|stir.?fry|paella|risotto/i.test(comboTitle);
    const cartCopy =
      variant === "cart" && comboTitle
        ? isRecipeStyle
          ? `Complete your ${comboTitle} – add missing ingredients`
          : `Complete your ${comboTitle} – add suggested items`
        : isRecipeStyle
          ? `Holmes found a recipe for what you&apos;re building${comboTitle ? ` – complete your ${comboTitle}` : ""}.`
          : `Holmes has suggestions for your cart${comboTitle ? ` – ${comboTitle}` : ""}.`;
    return (
      <div className="pattern-well mb-6 p-4 rounded-xl border border-aurora-primary/30 bg-aurora-primary/5">
        <p className="text-sm text-aurora-text mb-2">{cartCopy}</p>
        {variant === "cart" ? (
          <a
            href="#basket-bundle"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aurora-primary/15 text-aurora-primary text-sm font-medium hover:bg-aurora-primary/25 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("basket-bundle")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {isRecipeStyle ? "See ingredients to add" : "See suggested items"}
          </a>
        ) : variant === "for-you" ? null : (
          <Link
            href="/for-you"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aurora-primary/15 text-aurora-primary text-sm font-medium hover:bg-aurora-primary/25 transition-colors"
          >
            View ideas
          </Link>
        )}
      </div>
    );
  }

  if (!hint) return null;

  return (
    <div className="pattern-well mb-6 p-4 rounded-xl border border-aurora-primary/30">
      <p className="text-sm text-aurora-text mb-2">{hint}</p>
      {products.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {products.map((p) => (
            <Link
              key={p.id}
              href={p.url}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aurora-primary/15 text-aurora-primary text-sm font-medium hover:bg-aurora-primary/25 transition-colors"
            >
              <span className="w-6 h-6 rounded overflow-hidden shrink-0">
                <ProductImage
                  src={p.image_url}
                  className="w-full h-full"
                  objectFit="contain"
                  thumbnail
                  fallback={<span className="text-xs">-</span>}
                />
              </span>
              {p.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
