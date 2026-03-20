import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "@/lib/aurora";

/**
 * Proxy Holmes recent recipes from Aurora cache.
 * Returns recipes ordered by most recently updated.
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
    const client = createAuroraClient();
    const result = await client.store.holmesRecentRecipes(limit, timeOfDay);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ recipes: [] });
  }
}
