import Link from "next/link";
import { createAuroraClient } from "@aurora-studio/starter-core";
import { formatPrice, toCents } from "@aurora-studio/starter-core";
import { AddToCartButton } from "@aurora-studio/starter-core";
import { ProductImage } from "@aurora-studio/starter-core";
import {
  CONTENT_BLOCK_CARD_SHELL,
  CONTENT_BLOCK_IMAGE_WELL,
} from "@/components/ContentBlockProductCard";

function getImageUrl(record: Record<string, unknown>): string | null {
  const field = ["image_url", "image", "thumbnail", "photo"].find((f) => record[f]);
  return field ? String(record[field]) : null;
}

/** Aurora stores prices as decimal (e.g. 2.00 = £2). Returns raw value. */
function getPrice(record: Record<string, unknown>): number | undefined {
  if (record.on_sale && record.sale_price != null) return Number(record.sale_price);
  if (record.reduced_price != null) return Number(record.reduced_price);
  const regular = ["price", "amount", "value"].find((f) => record[f] != null);
  return regular ? Number(record[regular]) : undefined;
}

function getDisplayName(record: Record<string, unknown>): string {
  return String(record.name_en ?? record.name ?? record.title ?? record.id ?? "");
}

export async function SpecialOffers() {
  let records: Record<string, unknown>[] = [];
  let catalogTableSlug: string | null = null;
  let currency = "GBP";

  try {
    const aurora = createAuroraClient();
    const config = await aurora.store.config();
    if (!config.enabled) {
      return (
        <p className="text-aurora-muted py-8">Unable to load offers. Configure your store.</p>
      );
    }

    catalogTableSlug = config.catalogTableSlug ?? null;
    currency = (config as { currency?: string }).currency ?? "GBP";

    /* Offers are checkout-only discounts, not products - show only catalog products on sale. */
    if (catalogTableSlug) {
      const result = await aurora.tables(catalogTableSlug).records.list({
        limit: 24,
        sort: "created_at",
        order: "desc",
      });
      records = (result.data ?? []).filter(
        (r: Record<string, unknown>) => r.on_sale === true || r.sale_price != null
      );
      if (records.length === 0) {
        records = (result.data ?? []).slice(0, 8);
      } else {
        records = records.slice(0, 8);
      }
    }
  } catch {
    return (
      <p className="text-aurora-muted py-8">Unable to load offers. Configure your store.</p>
    );
  }

  if (records.length === 0) {
    return (
      <p className="text-aurora-muted py-8">
        No special offers yet. Add products with on_sale in Aurora Studio.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {records.slice(0, 8).map((record) => {
        const id = String(record.id ?? "");
        const name = getDisplayName(record);
        const priceCents = toCents(getPrice(record));
        const imageUrl = getImageUrl(record);

        return (
          <div
            key={id}
            className={`flex flex-col overflow-hidden rounded-xl bg-white dark:bg-white ${CONTENT_BLOCK_CARD_SHELL}`}
          >
            <Link href={`/catalogue/${id}`} className="block shrink-0">
              <div className={CONTENT_BLOCK_IMAGE_WELL}>
                <ProductImage
                  src={imageUrl}
                  className="absolute inset-0 h-full w-full"
                  objectFit="cover"
                  thumbnail
                  fallback={<div className="w-full h-full flex items-center justify-center text-aurora-muted text-4xl">-</div>}
                />
              </div>
            </Link>
            <div className="flex flex-col flex-1 px-3 sm:px-4 pt-3 pb-4 border-t border-stone-200/90">
              <Link href={`/catalogue/${id}`} className="block min-w-0">
                <p className="font-semibold text-sm truncate">{name}</p>
                {priceCents != null && (
                  <p className="text-sm mt-1 font-bold text-aurora-accent">
                    {formatPrice(priceCents, currency)}
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
                    imageUrl={imageUrl}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
