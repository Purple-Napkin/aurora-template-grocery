import { NextRequest, NextResponse } from "next/server";
import { getAcmeSession } from "@aurora-studio/starter-core";

/**
 * Fetch ACME session via SDK (API key stays server-side).
 * Proxies to avoid CORS when storefront and Aurora API are on different origins.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session");
  if (!sessionId) {
    return NextResponse.json({ error: "session is required" }, { status: 400 });
  }
  try {
    const session = await getAcmeSession(sessionId);
    return NextResponse.json(session);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
