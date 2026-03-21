import { NextRequest, NextResponse } from "next/server";
import { completeAcmeCheckout } from "aurora-starter-core";

/**
 * Complete ACME checkout via SDK (API key stays server-side).
 * Proxies to avoid CORS when storefront and Aurora API are on different origins.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, shippingAddress } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const result = await completeAcmeCheckout(sessionId, shippingAddress);

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
