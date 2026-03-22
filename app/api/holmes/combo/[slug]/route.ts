import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "@aurora-studio/starter-core";

/** Proxy Holmes cached combo (canonical). Mirrors GET /store/holmes/combo/:slug. */
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
    const combo = await client.store.holmesCombo(slug);
    if (!combo) {
      return NextResponse.json({ error: "Combo not found", slug }, { status: 404 });
    }
    return NextResponse.json(combo);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Combo fetch failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
