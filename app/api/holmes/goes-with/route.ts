import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "aurora-starter-core";

/**
 * Proxy Holmes goes-with from Aurora.
 * Products that go well with a given product via holmes_insights.goes_well_with.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id")?.trim();
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "8") || 8, 16);
    const excludeDietaryRaw = searchParams.get("excludeDietary")?.trim();
    const excludeDietary = excludeDietaryRaw
      ? excludeDietaryRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    if (!productId) {
      return NextResponse.json({ error: "product_id required", products: [], total: 0 }, { status: 400 });
    }
    const client = createAuroraClient();
    const result = await client.store.holmesGoesWith(productId, limit, {
      ...(excludeDietary?.length && { excludeDietary }),
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Goes-with failed";
    return NextResponse.json({ error: msg, products: [], total: 0 }, { status: 500 });
  }
}
