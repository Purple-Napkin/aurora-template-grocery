import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "aurora-starter-core";

/**
 * Proxy home-personalization from Aurora.
 * When sid is provided and Holmes infers a recipe mission, returns mode: "recipe_mission".
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sid = searchParams.get("sid")?.trim() ?? "";
    const excludeDietaryRaw = searchParams.get("excludeDietary")?.trim();
    const excludeDietary = excludeDietaryRaw
      ? excludeDietaryRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const client = createAuroraClient();
    const opts = excludeDietary?.length ? { excludeDietary } : undefined;
    const result = await (
      client.store.homePersonalization as (
        sid: string,
        storeId?: string,
        opts?: { excludeDietary?: string[] }
      ) => Promise<{ hero?: unknown; sections?: unknown[]; [key: string]: unknown }>
    )(sid, undefined, opts);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ hero: {}, sections: [] }, { status: 200 });
  }
}
