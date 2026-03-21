import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "@aurora-studio/starter-core";

/** Validate Bearer token and return current app user. No API key; token from Authorization header. */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Missing Authorization: Bearer <token>" }, { status: 401 });
  }
  try {
    const client = createAuroraClient();
    const session = await client.auth.session(token);
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
