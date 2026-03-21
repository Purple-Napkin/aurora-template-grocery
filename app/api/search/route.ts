import { NextRequest, NextResponse } from "next/server";
import { search } from "@aurora-studio/starter-core";

/**
 * Proxy search request (API key stays server-side).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "24") || 24, 48);
    const offset = parseInt(searchParams.get("offset") ?? "0") || 0;
    const vendorId = searchParams.get("vendorId") ?? searchParams.get("vendor_id") ?? "";
    const category = searchParams.get("category") ?? "";
    const sort = searchParams.get("sort") ?? "name";
    const order = (searchParams.get("order") ?? "asc").toLowerCase() as "asc" | "desc";
    const excludeDietaryRaw = searchParams.get("excludeDietary") ?? "";
    const excludeDietary = excludeDietaryRaw
      ? excludeDietaryRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const result = await search({
      q: q.trim() || undefined,
      limit,
      offset,
      vendorId: vendorId.trim() || undefined,
      category: category.trim() || undefined,
      sort,
      order,
      excludeDietary,
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: message, hits: [], total: 0 }, { status: 500 });
  }
}
