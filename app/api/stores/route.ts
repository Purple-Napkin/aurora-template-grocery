import { NextResponse } from "next/server";
import { getStores } from "aurora-starter-core";

export async function GET() {
  try {
    const res = await getStores();
    return NextResponse.json(res);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load stores";
    return NextResponse.json({ error: message, data: [] }, { status: 500 });
  }
}
