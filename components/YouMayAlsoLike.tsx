import Link from "next/link";
import { createAuroraClient } from "@/lib/aurora";
import { formatPrice, toCents } from "@/lib/format-price";
import { AddToCartButton } from "./AddToCartButton";

function getImageUrl(record: Record<string, unknown>): string | null {
  const field = ["image_url", "image", "thumbnail", "photo"].find((f) => record[f]);
  return field ? String(record[field]) : null;
}

/** Aurora stores prices as decimal. Use toCents for display/cart. */
function getPrice(record: Record<string, unknown>): number | undefined {
  if (record.on_sale && record.sale_price != null) return Number(record.sale_price);
  const field = ["price", "amount", "value"].find((f) => record[f] != null);
  return field ? Number(record[field]) : undefined;
}

function getDisplayName(record: Record<string, unknown>): string {
  return String(record.name ?? record.title ?? record.id ?? "");
}

export async function YouMayAlsoLike({
  productId,
  catalogTableSlug,
  categoryId,
}: {
  productId: string;
  catalogTableSlug: string;
  categoryId?: string | null;
}) {
  let records: Record<string, unknown>[] = [];
  let currency = "GBP";

  try {
    const aurora = createAuroraClient();
    const config = await aurora.store.config();
    currency = (config as { currency?: string }).currency ?? "GBP";
    const query: { limit: number; sort: string; order: "desc"; category_id?: string } = {
      limit: 8,
      sort: "created_at",
      order: "desc",
    };
    if (categoryId) query.category_id = categoryId;
    const result = await aurora.tables(catalogTableSlug).records.list(query);
    records = (result.data ?? []).filter((r) => String(r.id) !== productId).slice(0, 4);
  } catch {
    return null;
  }

  if (records.length === 0) return null;

  return (
    <div data-holmes="recommendations" data-current-product={productId}>
      <h2 className="font-display text-xl font-bold mb-4">You May Also Like</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {records.map((record) => {
          const id = String(record.id ?? "");
          const name = getDisplayName(record);
          const priceCents = toCents(getPrice(record));
          const imageUrl = getImageUrl(record);

          return (
            <div
              key={id}
              className="p-4 rounded-component bg-aurora-surface/80 border border-aurora-border"
            >
              <Link href={`/catalogue/${id}`}>
                <div className="aspect-square rounded-component bg-aurora-surface-hover mb-2 overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-aurora-muted text-2xl">
                      —
                    </div>
                  )}
                </div>
                <p className="font-semibold text-sm truncate">{name}</p>
                {priceCents != null && (
                  <p className="text-sm font-bold text-aurora-accent">
                    {formatPrice(priceCents, currency)}
                  </p>
                )}
              </Link>
              {priceCents != null && (
                <div className="mt-2">
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
          );
        })}
      </div>
    </div>
  );
}
