import Link from "next/link";
import { createAuroraClient, holmesGoesWith } from "aurora-starter-core";
import { formatPrice, toCents } from "aurora-starter-core";
import { AddToCartButton } from "aurora-starter-core";
import { ProductImage } from "aurora-starter-core";
import { getImageUrlFromRecord } from "aurora-starter-core";

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

    const goesWithRes = await holmesGoesWith(productId, 6).catch(() => null);
    if (goesWithRes && goesWithRes.products?.length > 0) {
      records = (goesWithRes.products as Record<string, unknown>[])
        .filter((r) => String(r.recordId ?? r.id) !== productId)
        .slice(0, 4)
        .map((h) => ({
          id: h.recordId ?? h.id,
          name: h.name ?? h.title ?? h.recordId ?? h.id,
          price: h.price,
          image_url: h.image_url,
          fromHolmes: true,
        }));
    }
    if (records.length === 0 && categoryId) {
      const result = await aurora.tables(catalogTableSlug).records.list({
        limit: 8,
        sort: "created_at",
        order: "desc",
        category_id: categoryId,
      } as Record<string, unknown>);
      records = (result.data ?? []).filter((r) => String(r.id) !== productId).slice(0, 4);
    }
    if (records.length === 0) {
      const result = await aurora.tables(catalogTableSlug).records.list({
        limit: 8,
        sort: "created_at",
        order: "desc",
      });
      records = (result.data ?? []).filter((r) => String(r.id) !== productId).slice(0, 4);
    }
  } catch {
    return null;
  }

  if (records.length === 0) return null;

  const fromHolmes = records.some((r) => (r as { fromHolmes?: boolean }).fromHolmes);
  return (
    <div data-holmes="recommendations" data-current-product={productId}>
      <h2 className="font-display text-xl font-bold mb-4">
        {fromHolmes ? "Pairs well with" : "You may also like"}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-start">
        {records.map((record) => {
          const id = String(record.id ?? "");
          const name = getDisplayName(record);
          const priceCents = toCents(getPrice(record));
          const imageUrl = getImageUrlFromRecord(record);

          return (
            <div
              key={id}
              className="pattern-well p-4 rounded-component border border-aurora-border flex flex-col"
            >
              <Link href={`/catalogue/${id}`} className="flex flex-col flex-1 min-h-0">
                <div className="aspect-square w-full rounded-component bg-aurora-surface-hover mb-2 overflow-hidden relative shrink-0">
                  <ProductImage
                    src={imageUrl}
                    className="absolute inset-0 w-full h-full object-center"
                    objectFit="contain"
                    thumbnail
                    fallback={<div className="absolute inset-0 flex items-center justify-center text-aurora-muted text-2xl">-</div>}
                  />
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
