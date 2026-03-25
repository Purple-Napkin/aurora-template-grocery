import { type NextRequest, NextResponse } from "next/server";
import { revalidateStoreContentAndWarm } from "@/lib/revalidate-store-content";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron: set `CRON_SECRET` in project env; schedule in `vercel.json`.
 * Optionally call `revalidateStoreContentAndWarm` from a CMS webhook Server Action.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await revalidateStoreContentAndWarm();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Refresh failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
