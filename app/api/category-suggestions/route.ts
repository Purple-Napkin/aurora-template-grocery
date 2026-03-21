import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "@aurora-studio/starter-core";

/**
 * Proxy category suggestions from Aurora (Holmes-driven).
 * Requires sid from Holmes session.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sid = searchParams.get("sid")?.trim();
    if (!sid) {
      return NextResponse.json({ suggested: [] });
    }
    const client = createAuroraClient();
    const result = await client.store.categorySuggestions(sid);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ suggested: [] });
  }
}
