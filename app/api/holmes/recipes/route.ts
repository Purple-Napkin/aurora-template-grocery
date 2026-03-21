import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "aurora-starter-core";

/**
 * Proxy Holmes recent recipes from Aurora cache.
 * Returns recipes ordered by most recently updated.
 * excludeDietary (comma-separated) filters out recipes whose ingredients match excluded types.
 */
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
    const result = await (
      client.store.holmesRecentRecipes as (
        limit: number,
        timeOfDay?: "morning" | "afternoon" | "evening",
        opts?: { excludeDietary?: string[] }
      ) => Promise<{ recipes: Array<{ id: string; slug: string; title: string; description: string | null }> }>
    )(limit, timeOfDay, opts);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ recipes: [] });
  }
}
