"use client";

import { ProductImage } from "@aurora-studio/starter-core";
import { ChefHat } from "lucide-react";

/** Collage of 2 or 4 product images for recipe cards. Falls back to chef hat when empty. */
export function RecipeProductCollage({
  imageUrls,
  className = "",
}: {
  imageUrls: string[];
  className?: string;
}) {
  const urls = imageUrls.filter((u): u is string => !!u).slice(0, 4);

  if (urls.length === 0) {
    return (
      <div
        className={`w-full h-full min-h-[120px] rounded-lg bg-aurora-surface-hover flex items-center justify-center ${className}`}
      >
        <ChefHat className="w-12 h-12 text-aurora-primary/60" aria-hidden />
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <div
        className={`w-full h-full rounded-lg overflow-hidden bg-aurora-surface-hover ${className}`}
      >
        <ProductImage
          src={urls[0]}
          className="w-full h-full"
          objectFit="contain"
          thumbnail
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-aurora-primary/60" />
            </div>
          }
        />
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div
        className={`w-full h-full rounded-lg overflow-hidden grid grid-cols-2 gap-0.5 bg-aurora-surface-hover ${className}`}
      >
        {urls.map((url, i) => (
          <div key={i} className="relative min-h-0">
            <ProductImage
              src={url}
              className="absolute inset-0 w-full h-full"
              objectFit="contain"
              thumbnail
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat className="w-8 h-8 text-aurora-primary/40" />
                </div>
              }
            />
          </div>
        ))}
      </div>
    );
  }

  // 3 or 4 images: 2x2 grid
  return (
    <div
      className={`w-full h-full rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 gap-0.5 bg-aurora-surface-hover ${className}`}
    >
      {urls.slice(0, 4).map((url, i) => (
        <div key={i} className="relative min-h-0 aspect-square">
          <ProductImage
            src={url}
            className="absolute inset-0 w-full h-full"
            objectFit="contain"
            thumbnail
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <ChefHat className="w-8 h-8 text-aurora-primary/40" />
              </div>
            }
          />
        </div>
      ))}
    </div>
  );
}
