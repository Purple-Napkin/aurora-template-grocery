"use client";

import { useState } from "react";
import {
  resolveProductImageUrl,
  getImageUrlFromRecord,
} from "@/lib/image-url";
import { useStoreConfigImageBase } from "./StoreConfigContext";

type ProductImageProps = {
  src?: string | null;
  alt?: string;
  baseUrl?: string | null;
  className?: string;
  fallback?: React.ReactNode;
  /** For record-based usage - pass record to extract url */
  record?: Record<string, unknown>;
};

const DEFAULT_FALLBACK = (
  <span
    className="w-full h-full flex items-center justify-center text-aurora-muted text-2xl"
    aria-hidden
  >
    –
  </span>
);

/**
 * Product image with onError fallback to avoid broken image icons.
 * Uses imageBaseUrl from store config (or baseUrl prop) for relative URLs.
 */
export function ProductImage({
  src,
  alt = "",
  baseUrl,
  className = "w-full h-full object-cover",
  fallback = DEFAULT_FALLBACK,
  record,
}: ProductImageProps) {
  const [errored, setErrored] = useState(false);
  const configBase = useStoreConfigImageBase();

  const rawUrl = record !== undefined ? getImageUrlFromRecord(record) : src;
  const resolved = resolveProductImageUrl(rawUrl, baseUrl ?? configBase);

  if (!resolved || errored) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[1px]">
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}
