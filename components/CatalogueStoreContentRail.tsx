"use client";

import { ClientStoreContentRail } from "@/components/ClientStoreContentRail";

type Region = "catalogue_above_grid" | "catalogue_below_filters";

export function CatalogueStoreContentRail({
  region,
  className,
}: {
  region: Region;
  className?: string;
}) {
  return (
    <ClientStoreContentRail
      contentPage="catalogue"
      contentRegion={region}
      useCatalogueCategoryFromUrl={region === "catalogue_below_filters"}
      className={className}
    />
  );
}
