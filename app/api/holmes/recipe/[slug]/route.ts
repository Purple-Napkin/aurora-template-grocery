import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "@aurora-studio/starter-core";

/**
 * Proxy Holmes cached recipe from Aurora.
 * Returns recipe from holmes_recipes; fetches via AI on cache miss.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug?.trim()) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }
    const client = createAuroraClient();
    const recipe = await client.store.holmesRecipe(slug);
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found", slug }, { status: 404 });
    }
    return NextResponse.json(recipe);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Recipe fetch failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
