import Link from "next/link";
import {
  AddToCartButton,
  ProductImage,
  ProductSaleBadge,
  createAuroraClient,
} from "@aurora-studio/starter-core";
import { StoreContentRails } from "@/components/StoreContentRails";
import {
  CONTENT_BLOCK_CARD_SHELL,
  CONTENT_BLOCK_IMAGE_WELL,
} from "@/components/ContentBlockProductCard";

export const dynamic = "force-dynamic";

function getImageUrl(record: Record<string, unknown>): string | null {
  const field = ["image_url", "image", "thumbnail", "photo"].find((f) => record[f]);
  return field ? String(record[field]) : null;
}

function getPrice(record: Record<string, unknown>): number | undefined {
  if (record.on_sale && record.sale_price != null) return Number(record.sale_price);
  if (record.reduced_price != null) return Number(record.reduced_price);
  const field = ["price", "amount", "value"].find((f) => record[f] != null);
  return field ? Number(record[field]) : undefined;
}

function getDisplayName(record: Record<string, unknown>): string {
  return String(record.name_en ?? record.name ?? record.title ?? record.id ?? "");
}

function formatPrice(cents: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export default async function OffersPage() {
  let records: Record<string, unknown>[] = [];
  let catalogTableSlug: string | null = null;
  let currency = "GBP";

  try {
    const aurora = createAuroraClient();
    const config = await aurora.store.config();
    if (!config.enabled) {
      return (
        <div className="max-w-6xl mx-auto py-16 px-6 text-center">
          <p className="text-aurora-muted">Unable to load offers. Configure your store in Aurora Studio.</p>
        </div>
      );
    }

    catalogTableSlug = config.catalogTableSlug ?? null;
    currency = (config as { currency?: string }).currency ?? "GBP";

    /* Offers are checkout-only discounts, not products - never show them as browseable items. */
    if (catalogTableSlug) {
      const result = await aurora.tables(catalogTableSlug).records.list({
        limit: 48,
        sort: "created_at",
        order: "desc",
      });
      records = (result.data ?? []).filter(
        (r: Record<string, unknown>) => r.on_sale === true || r.sale_price != null
      );
      if (records.length === 0) {
        records = (result.data ?? []).slice(0, 12);
      }
    }
  } catch {
    return (
      <div className="max-w-6xl mx-auto py-16 px-6 text-center">
        <p className="text-aurora-muted">
          Unable to load offers. Configure your store in Aurora Studio.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="py-12 px-4 sm:px-6">
        <StoreContentRails contentPage="offers" contentRegion="offers_below_header" className="mb-8" />
        <h1 className="text-2xl font-bold mb-2">Offers</h1>
        <p className="text-aurora-muted mb-8">
          Products on sale. Discounts apply automatically at checkout.
        </p>
        {records.length === 0 ? (
          <p className="text-aurora-muted py-12">
            No offers at the moment. Add products with on_sale in Aurora Studio.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {records.map((record) => {
              const id = String(record.id ?? "");
              const name = getDisplayName(record);
              const sellByWeight = Boolean(record.sell_by_weight);
              const unit = (record.unit as string) || "kg";
              const pricePerUnit = record.price_per_unit as number | undefined;
              const rawPrice = getPrice(record);
              const priceCents =
                sellByWeight && pricePerUnit != null
                  ? Math.round(pricePerUnit * 100)
                  : rawPrice != null
                    ? (rawPrice < 100 && rawPrice > 0 ? Math.round(rawPrice * 100) : Math.round(rawPrice))
                    : undefined;
              const imageUrl = getImageUrl(record);
              const isOnSale = record.on_sale === true;

              return (
                <div
                  key={id}
                  className={`flex flex-col overflow-hidden rounded-xl bg-white dark:bg-white ${CONTENT_BLOCK_CARD_SHELL}`}
                >
                  <Link href={`/catalogue/${id}`} className="block shrink-0">
                    {isOnSale ? <span className="sr-only">On sale. </span> : null}
                    <div className={CONTENT_BLOCK_IMAGE_WELL}>
                      <ProductImage
                        src={imageUrl}
                        className="absolute inset-0 h-full w-full"
                        objectFit="cover"
                        thumbnail
                        fallback={<div className="w-full h-full flex items-center justify-center text-aurora-muted text-4xl">-</div>}
                      />
                      {isOnSale ? <ProductSaleBadge>On Sale</ProductSaleBadge> : null}
                    </div>
                  </Link>
                  <div className="flex flex-col flex-1 px-3 sm:px-4 pt-3 pb-4 border-t border-stone-200/90">
                    <Link href={`/catalogue/${id}`} className="block min-w-0">
                      <p className="font-semibold text-sm truncate">{name}</p>
                      {(priceCents != null || (sellByWeight && pricePerUnit != null)) && (
                        <p className="text-sm mt-1 font-bold text-aurora-accent">
                          {sellByWeight && pricePerUnit != null
                            ? formatPrice(Math.round(pricePerUnit * 100), currency) + `/${unit}`
                            : formatPrice(priceCents!, currency)}
                        </p>
                      )}
                    </Link>
                    {priceCents != null && catalogTableSlug && (
                      <div className="mt-auto pt-3">
                        <AddToCartButton
                          recordId={id}
                          tableSlug={catalogTableSlug}
                          name={name}
                          unitAmount={priceCents}
                          sellByWeight={sellByWeight}
                          unit={unit}
                          imageUrl={imageUrl}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
