import { NextRequest, NextResponse } from "next/server";
import { getMe } from "@aurora-studio/starter-core";

/** Current user metadata and related data (e.g. addresses). Uses SDK getMe(userId); API key server-side. */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  try {
    const data = await getMe(userId ?? undefined);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load user data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
