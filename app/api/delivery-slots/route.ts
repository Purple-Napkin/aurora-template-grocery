import { NextRequest, NextResponse } from "next/server";
import { getDeliverySlots } from "@aurora-studio/starter-core";

/**
 * Proxy delivery slots request (API key stays server-side).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") ?? "");
    const lng = parseFloat(searchParams.get("lng") ?? "");
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "lat and lng query params required", data: [] },
        { status: 400 }
      );
    }

    const vendorId = searchParams.get("vendor_id") ?? searchParams.get("vendorId") ?? undefined;
    const result = await getDeliverySlots(lat, lng, vendorId ? { vendorId } : undefined);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load delivery slots";
    return NextResponse.json({ error: message, data: [] }, { status: 500 });
  }
}
