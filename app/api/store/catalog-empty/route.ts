import { NextResponse } from "next/server";

const baseUrl =
  process.env.AURORA_API_URL ?? process.env.NEXT_PUBLIC_AURORA_API_URL ?? "";
const apiKey = process.env.AURORA_API_KEY ?? process.env.NEXT_PUBLIC_AURORA_API_KEY ?? "";

/**
 * True when the tenant has no vendors, categories, or products (catalogue not seeded).
 * Used to show "Use example data" only for empty tenants, not for zero-result searches.
 */
export async function GET() {
  if (!baseUrl?.trim() || !apiKey) {
    return NextResponse.json({ empty: false });
  }

  const base = baseUrl.replace(/\/$/, "");
  const headers = {
    "Content-Type": "application/json",
    "X-Api-Key": apiKey,
  };

  async function tableTotal(slug: string): Promise<number | null> {
    const url = `${base}/v1/tables/${slug}/records?limit=1`;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { total?: unknown };
    return typeof body.total === "number" ? body.total : null;
  }

  const [vendors, categories, products] = await Promise.all([
    tableTotal("vendors"),
    tableTotal("categories"),
    tableTotal("products"),
  ]);

  if (vendors === null || categories === null || products === null) {
    return NextResponse.json({ empty: false });
  }

  const empty = vendors === 0 && categories === 0 && products === 0;
  return NextResponse.json({ empty });
}
