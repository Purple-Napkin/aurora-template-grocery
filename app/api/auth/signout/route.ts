import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "aurora-starter-core";

/** Sign out app user. Send Bearer token; client should discard tokens after calling. */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    try {
      const client = createAuroraClient();
      await client.auth.signout(token);
    } catch {
      // still return success so client can clear local state
    }
  }
  return NextResponse.json({ success: true });
}
