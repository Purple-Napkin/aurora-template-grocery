"use client";

import { ProductImage } from "@aurora-studio/starter-core";
import { ChefHat } from "lucide-react";

/** Prefer recipe/combo hero `imageUrl` (holmes_recipes.image_url); else product thumbnail collage. */
export function RecipeProductCollage({
  imageUrl,
  imageUrls,
  className = "",
}: {
  imageUrl?: string | null;
  imageUrls: string[];
  className?: string;
}) {
  const hero = imageUrl?.trim();
  if (hero) {
    return (
      <div
        className={`h-full w-full overflow-hidden bg-white dark:bg-white [&_img]:!object-top ${className}`}
      >
        <ProductImage
          src={hero}
          className="h-full w-full"
          objectFit="cover"
          thumbnail
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <ChefHat className="h-12 w-12 text-aurora-primary/60" aria-hidden />
            </div>
          }
        />
      </div>
    );
  }

  const urls = imageUrls.filter((u): u is string => !!u).slice(0, 4);

  if (urls.length === 0) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-white dark:bg-white ${className}`}
      >
        <ChefHat className="h-12 w-12 text-aurora-primary/60" aria-hidden />
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <div
        className={`h-full w-full overflow-hidden bg-white dark:bg-white [&_img]:!object-top ${className}`}
      >
        <ProductImage
          src={urls[0]}
          className="h-full w-full"
          objectFit="cover"
          thumbnail
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <ChefHat className="h-12 w-12 text-aurora-primary/60" />
            </div>
          }
        />
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div
        className={`grid h-full w-full grid-cols-2 gap-0.5 overflow-hidden bg-white dark:bg-white [&_img]:!object-top ${className}`}
      >
        {urls.map((url, i) => (
          <div key={i} className="relative min-h-0">
            <ProductImage
              src={url}
              className="absolute inset-0 w-full h-full"
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
      className={`grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden bg-white dark:bg-white [&_img]:!object-top ${className}`}
    >
      {urls.slice(0, 4).map((url, i) => (
        <div key={i} className="relative min-h-0 aspect-square">
          <ProductImage
            src={url}
            className="absolute inset-0 w-full h-full"
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
