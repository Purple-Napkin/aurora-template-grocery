import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "@aurora-studio/starter-core";

/** Proxy Holmes combo products (canonical). Query: `combo` (or legacy `recipe`). */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const combo =
      searchParams.get("combo")?.trim() ?? searchParams.get("recipe")?.trim() ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "12") || 12, 24);
    const excludeDietaryRaw = searchParams.get("excludeDietary")?.trim();
    const excludeDietary = excludeDietaryRaw
      ? excludeDietaryRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    if (!combo) {
      return NextResponse.json(
        { error: "combo query param required", products: [], total: 0, combo: "" },
        { status: 400 }
      );
    }
    const client = createAuroraClient();
    const result = await client.store.holmesComboProducts(combo, limit, {
      ...(excludeDietary?.length && { excludeDietary }),
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Combo products failed";
    return NextResponse.json({ error: msg, products: [], total: 0 }, { status: 500 });
  }
}
