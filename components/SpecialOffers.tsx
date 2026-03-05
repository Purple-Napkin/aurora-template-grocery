import Link from "next/link";
import { createAuroraClient } from "@/lib/aurora";
import { formatPrice, toCents } from "@/lib/format-price";
import { AddToCartButton } from "./AddToCartButton";

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

type ContentMode = "offers" | "products";

export async function SpecialOffers() {
  let records: Record<string, unknown>[] = [];
  let catalogTableSlug: string | null = null;
  let currency = "GBP";
  let mode: ContentMode = "products";

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

    try {
      const offersResult = await aurora.tables("offers").records.list({
        limit: 8,
        sort: "created_at",
        order: "desc",
      });
      const offerRecords = (offersResult.data ?? []).filter(
        (r: Record<string, unknown>) => {
          const startsAt = r.starts_at as string | null | undefined;
          const endsAt = r.ends_at as string | null | undefined;
          const now = new Date().toISOString();
          if (startsAt && startsAt > now) return false;
          if (endsAt && endsAt < now) return false;
          return r.name != null || r.name_en != null;
        }
      );
      if (offerRecords.length > 0) {
        records = offerRecords.slice(0, 8);
        mode = "offers";
      }
    } catch {
      /* offers table may not exist */
    }

    if (records.length === 0 && catalogTableSlug) {
      const result = await aurora.tables(catalogTableSlug).records.list({
        limit: 8,
        sort: "created_at",
        order: "desc",
      });
      records = result.data ?? [];
    }
  } catch {
    return (
      <p className="text-aurora-muted py-8">Unable to load offers. Configure your store.</p>
    );
  }

  if (records.length === 0) {
    return (
      <p className="text-aurora-muted py-8">
        No special offers yet. Add offers or products with on_sale in Aurora Studio.
      </p>
    );
  }

  if (mode === "offers") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {records.map((record) => {
          const id = String(record.id ?? "");
          const name = getDisplayName(record);
          const desc = String(record.description_en ?? record.description ?? "").slice(0, 60);
          const priceCents = toCents(getPrice(record));
          const label = String(record.label_en ?? record.type ?? "");

          return (
            <Link key={id} href="/offers" className="block">
              <div className="p-4 rounded-component bg-aurora-surface/80 border border-aurora-border hover:border-aurora-accent/40 transition-all">
                <div className="aspect-square rounded-component bg-aurora-surface-hover mb-3 flex items-center justify-center text-aurora-muted text-3xl">
                  —
                </div>
                <p className="font-semibold text-sm truncate">{name}</p>
                {label && (
                  <span className="inline-block px-2 py-0.5 rounded bg-aurora-accent/20 text-aurora-accent text-xs font-medium mt-1">
                    {label}
                  </span>
                )}
                {desc && <p className="text-xs text-aurora-muted mt-1 line-clamp-2">{desc}</p>}
                {priceCents != null && (
                  <p className="text-sm mt-1 font-bold text-aurora-accent">
                    {formatPrice(priceCents, currency)}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
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
            className="p-4 rounded-component bg-aurora-surface/80 border border-aurora-border hover:border-aurora-accent/40 transition-all"
          >
            <Link href={`/catalogue/${id}`} className="block">
              <div className="aspect-square rounded-component bg-aurora-surface-hover mb-3 overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-aurora-muted text-4xl">
                    —
                  </div>
                )}
              </div>
              <p className="font-semibold text-sm truncate">{name}</p>
              {priceCents != null && (
                <p className="text-sm mt-1 font-bold text-aurora-accent">
                  {formatPrice(priceCents, currency)}
                </p>
              )}
            </Link>
            {priceCents != null && catalogTableSlug && (
              <div className="mt-3">
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
  );
}
