import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "@aurora-studio/starter-core";

/** Proxy Holmes editorial combo list (canonical). Mirrors GET /store/holmes/combos. */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "8", 10)));
    const timeOfDayParam = searchParams.get("time_of_day")?.toLowerCase();
    const timeOfDay =
      timeOfDayParam && ["morning", "afternoon", "evening"].includes(timeOfDayParam)
        ? (timeOfDayParam as "morning" | "afternoon" | "evening")
        : undefined;
    const excludeDietaryRaw = searchParams.get("excludeDietary")?.trim();
    const excludeDietary = excludeDietaryRaw
      ? excludeDietaryRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const client = createAuroraClient();
    const opts = excludeDietary?.length ? { excludeDietary } : undefined;
    const { combos } = await client.store.holmesRecentCombos(limit, timeOfDay, opts);
    return NextResponse.json({ combos });
  } catch {
    return NextResponse.json({ combos: [] });
  }
}
