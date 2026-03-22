import Link from "next/link";
import { notFound } from "next/navigation";
import { createAuroraClient } from "@aurora-studio/starter-core";
import { AddToCartButton } from "@aurora-studio/starter-core";
import { HolmesProductViewTracker } from "@aurora-studio/starter-core";
import { ProductDetailTabs } from "@aurora-studio/starter-core";
import { ProductImageGallery } from "@aurora-studio/starter-core";
import { YouMayAlsoLike } from "@/components/YouMayAlsoLike";
import { HolmesContextualWell } from "@/components/HolmesContextualWell";
import { HolmesTidbits } from "@aurora-studio/starter-core";
import { StoreContentRails } from "@/components/StoreContentRails";

export const dynamic = "force-dynamic";

function getImageUrl(record: Record<string, unknown>): string | null {
  const field = ["image_url", "image", "thumbnail", "photo"].find((f) => record[f]);
  return field ? String(record[field]) : null;
}

function getPrice(record: Record<string, unknown>): number | undefined {
  if (record.on_sale && record.sale_price != null) return Number(record.sale_price);
  const field = ["price", "amount", "value"].find((f) => record[f] != null);
  return field ? Number(record[field]) : undefined;
}

function getDisplayName(record: Record<string, unknown>): string {
  const field = ["name", "title", "slug"].find((f) => record[f]) ?? "id";
  return String(record[field] ?? record.id ?? "");
}

/** Entity for Holmes tidbits lookup (entity_slug). API lowercases; use slug format to match common storage. */
function toProductEntity(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function formatPrice(cents: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const aurora = createAuroraClient();
  const baseUrl = process.env.NEXT_PUBLIC_AURORA_API_URL ?? "";
  const apiKey = process.env.AURORA_API_KEY ?? "";

  if (!baseUrl || !apiKey) notFound();

  let catalogTableSlug: string | null = null;
  let currency = "GBP";

  try {
    const config = await aurora.store.config();
    if (config.enabled && config.catalogTableSlug) {
      catalogTableSlug = config.catalogTableSlug;
      currency = (config as { currency?: string }).currency ?? "GBP";
    }
  } catch {
    notFound();
  }

  if (!catalogTableSlug) notFound();

  let record: Record<string, unknown>;

  try {
    record = await aurora.tables(catalogTableSlug).records.get(id);
  } catch {
    notFound();
  }

  const name = getDisplayName(record);
  const rawPrice = getPrice(record);
  const priceCents = rawPrice != null ? Math.round(rawPrice * 100) : undefined;
  const sellByWeight = Boolean(record.sell_by_weight);
  const unit = (record.unit as string) || "kg";
  const pricePerUnit = record.price_per_unit as number | undefined;
  const pricePerUnitCents = pricePerUnit != null ? Math.round(pricePerUnit * 100) : undefined;
  const imageUrl = getImageUrl(record);
  const vendorName = record.vendor_name as string | undefined;
  const categoryObj = record.category as Record<string, unknown> | undefined;
  const categoryName = categoryObj?.name ?? record.subcategory ?? "Products";
  const categoryId = (record.category_id ?? categoryObj?.id) as string | undefined;
  const stockQuantity = record.stock_quantity as number | undefined;
  const description = record.description as string | undefined;

  return (
    <div className="max-w-6xl mx-auto py-10 sm:py-14 px-4 sm:px-6">
      <HolmesProductViewTracker productId={id} />
      <HolmesContextualWell currentProductId={id} />

      <nav className="text-sm text-aurora-muted mb-6">
        <Link href="/" className="hover:text-aurora-text">Home</Link>
        {" > "}
        <Link href="/catalogue" className="hover:text-aurora-text">{String(categoryName)}</Link>
        {" > "}
        <span className="text-aurora-text">{name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="shrink-0 lg:w-2/5">
          <ProductImageGallery record={record} />
        </div>

        <div className="flex-1 min-w-0 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{name}</h1>
          {sellByWeight && pricePerUnitCents != null ? (
            <p className="text-xl font-bold text-aurora-accent">
              {formatPrice(pricePerUnitCents, currency)}/{unit}
            </p>
          ) : priceCents != null ? (
            <p className="text-xl font-bold text-aurora-accent">
              {formatPrice(priceCents, currency)}
            </p>
          ) : null}
          {description && (
            <p className="text-aurora-muted">{description}</p>
          )}
          <div className="mt-4">
            <HolmesTidbits
              entity={toProductEntity(name)}
              entityType="product"
            />
          </div>
          {vendorName && (
            <p className="text-sm">
              Sold by:{" "}
              <Link href="/stores" className="text-aurora-accent hover:underline">
                {vendorName}
              </Link>
            </p>
          )}
          <p className="text-sm text-aurora-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Free delivery on orders over £50
          </p>
          {stockQuantity != null && (
            <p className="text-sm text-aurora-muted">
              In stock ({stockQuantity} available)
            </p>
          )}
          <div className="flex gap-3">
            {((sellByWeight && pricePerUnitCents != null) || priceCents != null) && catalogTableSlug && (
              <AddToCartButton
                recordId={id}
                tableSlug={catalogTableSlug}
                name={name}
                unitAmount={sellByWeight ? pricePerUnitCents! : priceCents!}
                sellByWeight={sellByWeight}
                unit={unit}
                imageUrl={imageUrl}
                className="px-8 py-4 rounded-component bg-aurora-accent text-aurora-bg font-bold hover:opacity-90 flex items-center gap-2"
              />
            )}
            <button
              type="button"
              className="px-6 py-4 rounded-component border border-aurora-border text-aurora-text hover:bg-aurora-surface-hover hover:border-aurora-primary/40 transition-colors"
            >
              Add to Favorites
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <ProductDetailTabs record={record} />
      </div>

      <div className="mt-10 space-y-10">
        <StoreContentRails contentPage="product_detail" contentRegion="pdp_below_tabs" />
        <StoreContentRails contentPage="product_detail" contentRegion="pdp_below_context" />
      </div>

      <div className="mt-12">
        <YouMayAlsoLike
          productId={id}
          catalogTableSlug={catalogTableSlug}
          categoryId={categoryId}
        />
      </div>
    </div>
  );
}
