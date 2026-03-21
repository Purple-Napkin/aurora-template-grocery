import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "aurora-starter-core";

/**
 * Create checkout session via SDK (API key stays server-side).
 * Ecom store uses only the SDK for web; this route is the only place that talks to Aurora.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      successUrl,
      cancelUrl,
      lineItems,
      currency,
      deliverySlotId,
      metadata,
      holmes_session_id,
      holmes_mission_start_timestamp,
    } = body;

    if (!successUrl || !cancelUrl || !lineItems?.length) {
      return NextResponse.json(
        { error: "successUrl, cancelUrl, and lineItems are required" },
        { status: 400 }
      );
    }

    const params = {
      successUrl,
      cancelUrl,
      lineItems,
      currency,
      deliverySlotId,
      metadata,
      ...(holmes_session_id && { holmes_session_id }),
      ...(holmes_mission_start_timestamp != null && {
        holmes_mission_start_timestamp: Number(holmes_mission_start_timestamp),
      }),
    };
    const result = await createCheckoutSession(params as Parameters<typeof createCheckoutSession>[0]);

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
