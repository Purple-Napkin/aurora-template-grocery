import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "@aurora-studio/starter-core";

/**
 * Proxy Holmes tidbits from Aurora.
 * Tidbits for recipes, ingredients, products (origin, pairing, tip).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity")?.trim();
    const entityType = searchParams.get("entity_type")?.trim() || "recipe";
    if (!entity) {
      return NextResponse.json({ error: "entity required", tidbits: [] }, { status: 400 });
    }
    const client = createAuroraClient();
    const result = await client.store.holmesTidbits(entity, entityType);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Tidbits fetch failed";
    return NextResponse.json({ error: msg, tidbits: [] }, { status: 500 });
  }
}
