import { NextRequest, NextResponse } from "next/server";
import { getApiBase, getTenantSlug } from "@/lib/aurora";

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
    const base = getApiBase();
    const tenant = getTenantSlug();
    const apiKey = process.env.AURORA_API_KEY ?? process.env.NEXT_PUBLIC_AURORA_API_KEY ?? "";
    const res = await fetch(
      `${base}/api/tenants/${encodeURIComponent(tenant)}/store/category-suggestions?sid=${encodeURIComponent(sid)}`,
      { headers: apiKey ? { "X-Api-Key": apiKey } : {} }
    );
    const data = await res.json().catch(() => ({ suggested: [] }));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ suggested: [] });
  }
}
