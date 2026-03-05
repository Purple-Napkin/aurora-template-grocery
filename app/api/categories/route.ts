import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "@/lib/aurora";
import { search } from "@/lib/aurora";

const DEFAULT_CATEGORIES = [
  { name: "Bakery Items", slug: "bakery-items" },
  { name: "Frozen Foods", slug: "frozen-foods" },
  { name: "Vegetables", slug: "vegetables" },
  { name: "Fruits", slug: "fruits" },
  { name: "Dairy Products", slug: "dairy-products" },
  { name: "Snacks", slug: "snacks" },
  { name: "Beverages", slug: "beverages" },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId")?.trim() || undefined;

    const aurora = createAuroraClient();
    const config = await aurora.store.config();
    const categorySlug = (config as { categoryTableSlug?: string }).categoryTableSlug;

    let categories: { name: string; slug: string }[] = DEFAULT_CATEGORIES;

    if (config.enabled && categorySlug) {
      const { data } = await aurora.tables(categorySlug).records.list({ limit: 20 });
      if (data?.length) {
        categories = data.map((r: Record<string, unknown>) => ({
          name: String(r.name ?? r.slug ?? r.id ?? ""),
          slug: String(r.slug ?? r.name ?? r.id ?? "").toLowerCase().replace(/\s+/g, "-"),
        }));
      }
    }

    // When a store is selected, filter to only categories that have products
    if (vendorId) {
      const withCounts = await Promise.all(
        categories.map(async (cat) => {
          try {
            const res = await search({
              q: "",
              limit: 1,
              offset: 0,
              vendorId,
              category: cat.slug,
            });
            return { ...cat, count: res.total ?? 0 };
          } catch {
            return { ...cat, count: 0 };
          }
        })
      );
      categories = withCounts.filter((c) => c.count > 0).map(({ name, slug }) => ({ name, slug }));
    }

    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ categories: DEFAULT_CATEGORIES });
  }
}
